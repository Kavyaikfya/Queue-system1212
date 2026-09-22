import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { PriorityEngine } from './priorityEngine.js';
import { WaitTimeEngine } from './waitTimeEngine.js';
import { FairnessEngine } from './fairnessEngine.js';
import { getSocketServer } from '../socket.js';
export class QueueEngine {
    /**
     * Recalculates priorities and reorders all waiting users in the queue.
     * Logs transparent explanations for every single position change.
     */
    static async recalculateAndReorderQueue(queueId, triggerReason, actorId) {
        // 1. Fetch queue and service settings
        const queueRes = await query(`SELECT q.*, s.avg_duration_minutes, s.base_priority, s.category as service_category
       FROM queues q
       LEFT JOIN services s ON q.service_id = s.id
       WHERE q.id = $1`, [queueId]);
        if (queueRes.rows.length === 0)
            return;
        const queue = queueRes.rows[0];
        // Count active counters
        const counterRes = await query(`SELECT count(*) as count FROM counters 
       WHERE queue_id = $1 AND status IN ('ACTIVE', 'BUSY')`, [queueId]);
        const activeCountersCount = Math.max(1, parseInt(counterRes.rows[0].count || '1', 10));
        const avgDuration = queue.avg_duration_minutes || 15;
        const isPaused = queue.status === 'PAUSED';
        // Parse priority rules
        let queueRules = {};
        try {
            if (typeof queue.priority_rules_json === 'string') {
                queueRules = JSON.parse(queue.priority_rules_json || '{}');
            }
            else {
                queueRules = queue.priority_rules_json || {};
            }
        }
        catch {
            queueRules = {};
        }
        // 2. Fetch all WAITING entries
        const entriesRes = await query(`SELECT * FROM queue_entries 
       WHERE queue_id = $1 AND status = 'WAITING'
       ORDER BY join_time ASC`, [queueId]);
        const entries = entriesRes.rows;
        if (entries.length === 0) {
            // Snapshot empty queue
            await this.saveSnapshot(queueId, 0, 0, 100, activeCountersCount);
            this.broadcastQueueUpdate(queueId);
            return;
        }
        // 3. Compute priority scores for each entry
        const scoredEntries = entries.map((entry) => {
            const priorityResult = PriorityEngine.calculate({
                joinTime: entry.join_time,
                hasAppointment: Boolean(entry.has_appointment),
                isUrgent: Boolean(entry.is_urgent),
                serviceBasePriority: queue.base_priority || 10,
                serviceCategory: entry.service_category || queue.service_category,
                queueRules,
            });
            return {
                ...entry,
                newPriorityScore: priorityResult.score,
                newPriorityReason: priorityResult.reason,
            };
        });
        // 4. Sort entries: higher score first; tie-break by earlier join_time
        scoredEntries.sort((a, b) => {
            if (b.newPriorityScore !== a.newPriorityScore) {
                return b.newPriorityScore - a.newPriorityScore;
            }
            return new Date(a.join_time).getTime() - new Date(b.join_time).getTime();
        });
        // 5. Update positions, wait times, and log position change explanations
        const waitTimes = [];
        for (let index = 0; index < scoredEntries.length; index++) {
            const entry = scoredEntries[index];
            const newPos = index + 1;
            const oldPos = entry.position || newPos;
            const waitResult = WaitTimeEngine.calculate({
                positionAhead: index,
                activeCountersCount,
                avgServiceDurationMinutes: avgDuration,
                isQueuePaused: isPaused,
            });
            waitTimes.push(waitResult.estimatedMinutes);
            // Check if position changed
            if (oldPos !== newPos) {
                let causalReason = '';
                if (newPos < oldPos) {
                    const spots = oldPos - newPos;
                    causalReason = `Advanced ${spots} spot${spots > 1 ? 's' : ''} as queue progressed and waiting time priority accrued.`;
                }
                else {
                    const spots = newPos - oldPos;
                    causalReason = `Shifted back ${spots} spot${spots > 1 ? 's' : ''} due to incoming urgent/priority triage entry (${triggerReason}).`;
                }
                // Insert explainable event
                await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, previous_position, new_position, reason, actor_id)
           VALUES ($1, $2, $3, 'POSITION_CHANGED', $4, $5, $6, $7)`, [uuidv4(), entry.id, queueId, oldPos, newPos, causalReason, actorId || null]);
                // Notify user if registered
                if (entry.user_id) {
                    await query(`INSERT INTO notifications (id, user_id, queue_entry_id, title, message, type)
             VALUES ($1, $2, $3, $4, $5, 'POSITION_UPDATE')`, [
                        uuidv4(),
                        entry.user_id,
                        entry.id,
                        `Position Update: #${newPos}`,
                        causalReason,
                    ]);
                }
            }
            // Update database record
            await query(`UPDATE queue_entries 
         SET position = $1,
             priority_score = $2,
             priority_reason = $3,
             estimated_wait_minutes = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`, [newPos, entry.newPriorityScore, entry.newPriorityReason, waitResult.estimatedMinutes, entry.id]);
        }
        // 6. Evaluate Fairness & take snapshot
        const snapshotsForFairness = scoredEntries.map((e, idx) => ({
            id: e.id,
            ticketNumber: e.ticket_number,
            position: idx + 1,
            minutesWaited: Math.max(0, Math.floor((Date.now() - new Date(e.join_time).getTime()) / 60000)),
            isUrgent: Boolean(e.is_urgent),
            hasAppointment: Boolean(e.has_appointment),
        }));
        const fairnessReport = FairnessEngine.evaluate(snapshotsForFairness);
        const avgWaitMinutes = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
        await this.saveSnapshot(queueId, scoredEntries.length, scoredEntries.length, fairnessReport.fairnessScore, activeCountersCount);
        // If critical fairness alert, record fairness_event
        if (fairnessReport.alerts.length > 0) {
            for (const alert of fairnessReport.alerts) {
                if (alert.severity === 'WARNING' || alert.severity === 'CRITICAL') {
                    await query(`INSERT INTO fairness_events (id, organization_id, queue_id, alert_type, severity, explanation, metric_snapshot)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                        uuidv4(),
                        queue.organization_id,
                        queueId,
                        alert.type,
                        alert.severity,
                        alert.message,
                        JSON.stringify(fairnessReport.metrics),
                    ]);
                }
            }
        }
        // 7. Real-Time Broadcast
        this.broadcastQueueUpdate(queueId);
    }
    static async saveSnapshot(queueId, queueLength, waitingCount, fairnessScore, activeCounters) {
        await query(`INSERT INTO queue_snapshots (id, queue_id, queue_length, waiting_count, fairness_score, active_counters)
       VALUES ($1, $2, $3, $4, $5, $6)`, [uuidv4(), queueId, queueLength, waitingCount, fairnessScore, activeCounters]);
    }
    static broadcastQueueUpdate(queueId) {
        const io = getSocketServer();
        if (!io)
            return;
        io.to(`queue:${queueId}`).emit('queue:updated', { queueId, timestamp: new Date() });
        io.emit('queue:reordered', { queueId });
    }
    /**
     * User joins queue
     */
    static async joinQueue(params) {
        const queueRes = await query(`SELECT q.*, count(qe.id) as current_count 
       FROM queues q
       LEFT JOIN queue_entries qe ON q.id = qe.queue_id AND qe.status = 'WAITING'
       WHERE q.id = $1
       GROUP BY q.id`, [params.queueId]);
        if (queueRes.rows.length === 0) {
            throw new Error('Queue not found.');
        }
        const queue = queueRes.rows[0];
        if (queue.status === 'CLOSED') {
            throw new Error('Queue is currently closed.');
        }
        const currentCount = parseInt(queue.current_count || '0', 10);
        if (currentCount >= queue.max_capacity) {
            throw new Error('This queue has reached its current capacity.');
        }
        // Check whether user already has an active entry in this queue (Requirement 6)
        if (params.userId) {
            const existingRes = await query(`SELECT id, ticket_number, position, estimated_wait_minutes, status
         FROM queue_entries
         WHERE user_id = $1 AND queue_id = $2 AND status IN ('WAITING', 'CALLED', 'IN_SERVICE')
         LIMIT 1`, [params.userId, params.queueId]);
            if (existingRes.rows.length > 0) {
                const existing = existingRes.rows[0];
                const err = new Error('You are already in this queue.');
                err.code = 'ALREADY_IN_QUEUE';
                err.statusCode = 409;
                err.data = {
                    alreadyInQueue: true,
                    entryId: existing.id,
                    ticketNumber: existing.ticket_number,
                    position: existing.position,
                    estimatedWaitMinutes: existing.estimated_wait_minutes,
                };
                throw err;
            }
        }
        // Increment token number
        const tokenRes = await query(`UPDATE queues 
       SET current_token_number = current_token_number + 1 
       WHERE id = $1 
       RETURNING current_token_number, prefix`, [params.queueId]);
        const tokenNum = tokenRes.rows[0].current_token_number;
        const prefix = tokenRes.rows[0].prefix || 'A';
        const ticketNumber = `${prefix}-${100 + tokenNum}`;
        const entryId = uuidv4();
        const joinTime = new Date();
        // Initial calculations
        const priorityResult = PriorityEngine.calculate({
            joinTime,
            isUrgent: params.isUrgent,
            hasAppointment: params.hasAppointment,
            serviceBasePriority: 10,
        });
        const initialPos = currentCount + 1;
        await query(`INSERT INTO queue_entries (
        id, ticket_number, queue_id, user_id, guest_name, guest_phone,
        status, priority_score, priority_reason, position, estimated_wait_minutes,
        is_urgent, has_appointment, notes, join_time
      ) VALUES ($1, $2, $3, $4, $5, $6, 'WAITING', $7, $8, $9, $10, $11, $12, $13, $14)`, [
            entryId,
            ticketNumber,
            params.queueId,
            params.userId || null,
            params.guestName || (params.userId ? 'Registered Member' : 'Guest Visitor'),
            params.guestPhone || null,
            priorityResult.score,
            priorityResult.reason,
            initialPos,
            initialPos * 15,
            Boolean(params.isUrgent),
            Boolean(params.hasAppointment),
            params.notes || null,
            joinTime,
        ]);
        // Record initial JOINED lifecycle event
        await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, previous_position, new_position, reason)
       VALUES ($1, $2, $3, 'JOINED', $4, $4, 'Ticket issued. Position assigned in queue.')`, [uuidv4(), entryId, params.queueId, initialPos]);
        // Recalculate queue so priorities and positions are accurately aligned
        await this.recalculateAndReorderQueue(params.queueId, 'New user arrival', params.userId);
        // Real-time broadcast
        const io = getSocketServer();
        if (io) {
            io.to(`queue:${params.queueId}`).emit('queue:user_joined', {
                queueId: params.queueId,
                ticketNumber,
                position: initialPos,
            });
        }
        return {
            entryId,
            ticketNumber,
            position: initialPos,
            priorityScore: priorityResult.score,
        };
    }
    /**
     * Staff calls next user to counter
     */
    static async callNext(queueId, counterId, staffId) {
        // 1. Fetch counter info
        const counterRes = await query(`SELECT * FROM counters WHERE id = $1`, [counterId]);
        if (counterRes.rows.length === 0) {
            throw new Error('Counter not found.');
        }
        const counter = counterRes.rows[0];
        // 2. Fetch highest-priority waiting entry (top position)
        const nextRes = await query(`SELECT * FROM queue_entries 
       WHERE queue_id = $1 AND status = 'WAITING'
       ORDER BY position ASC, priority_score DESC, join_time ASC
       LIMIT 1`, [queueId]);
        if (nextRes.rows.length === 0) {
            throw new Error('No waiting users currently in this queue.');
        }
        const nextEntry = nextRes.rows[0];
        const timeoutSec = 120; // 2 minutes configurable response timer
        const noShowDeadline = new Date(Date.now() + timeoutSec * 1000);
        // 3. Transition entry to CALLED
        await query(`UPDATE queue_entries 
       SET status = 'CALLED',
           counter_id = $1,
           staff_id = $2,
           called_time = CURRENT_TIMESTAMP,
           no_show_deadline = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`, [counterId, staffId, noShowDeadline, nextEntry.id]);
        // Update counter status to BUSY
        await query(`UPDATE counters SET status = 'BUSY', current_staff_id = $1 WHERE id = $2`, [
            staffId,
            counterId,
        ]);
        // Record CALLED event
        await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, previous_position, new_position, reason, actor_id)
       VALUES ($1, $2, $3, 'CALLED', $4, 0, $5, $6)`, [
            uuidv4(),
            nextEntry.id,
            queueId,
            nextEntry.position,
            `Called to Counter ${counter.counter_number} (${counter.name})`,
            staffId,
        ]);
        // Create user notification
        if (nextEntry.user_id) {
            await query(`INSERT INTO notifications (id, user_id, queue_entry_id, title, message, type)
         VALUES ($1, $2, $3, $4, $5, 'TURN_ARRIVED')`, [
                uuidv4(),
                nextEntry.user_id,
                nextEntry.id,
                'Your Turn Has Arrived!',
                `Please proceed immediately to Counter ${counter.counter_number} (${counter.name}).`,
            ]);
        }
        // 4. Reorder remaining waiting entries so line advances
        await this.recalculateAndReorderQueue(queueId, 'Next user called to service', staffId);
        // 5. Real-time broadcast
        const io = getSocketServer();
        if (io) {
            io.to(`queue:${queueId}`).emit('queue:called', {
                queueId,
                entryId: nextEntry.id,
                ticketNumber: nextEntry.ticket_number,
                counterNumber: counter.counter_number,
                counterName: counter.name,
                deadline: noShowDeadline,
            });
            if (nextEntry.user_id) {
                io.to(`user:${nextEntry.user_id}`).emit('user:turn_called', {
                    ticketNumber: nextEntry.ticket_number,
                    counterNumber: counter.counter_number,
                    counterName: counter.name,
                    deadline: noShowDeadline,
                });
            }
        }
        return {
            entry: nextEntry,
            counter,
            deadline: noShowDeadline,
        };
    }
    /**
     * User turn response: "I'm ready" or "Need more time"
     */
    static async respondTurn(entryId, action, userId) {
        const entryRes = await query(`SELECT * FROM queue_entries WHERE id = $1`, [entryId]);
        if (entryRes.rows.length === 0)
            throw new Error('Ticket entry not found.');
        const entry = entryRes.rows[0];
        if (entry.status !== 'CALLED') {
            throw new Error('Ticket is not currently in CALLED state.');
        }
        if (action === 'READY') {
            // Confirmed presence: clear deadline or acknowledge
            await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, reason, actor_id)
         VALUES ($1, $2, $3, 'POSITION_CHANGED', 'User confirmed ready for service at counter.', $4)`, [uuidv4(), entry.id, entry.queue_id, userId || null]);
            return { status: 'READY_ACKNOWLEDGED' };
        }
        else {
            // NEED MORE TIME: Postpone by 2 spots in queue without canceling
            await query(`UPDATE queue_entries 
         SET status = 'WAITING',
             called_time = NULL,
             no_show_deadline = NULL,
             position = 3,
             counter_id = NULL
         WHERE id = $1`, [entryId]);
            await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, previous_position, new_position, reason, actor_id)
         VALUES ($1, $2, $3, 'POSITION_CHANGED', 0, 3, 'User requested more time. Postponed by 2 spots without losing ticket.', $4)`, [uuidv4(), entry.id, entry.queue_id, userId || null]);
            await this.recalculateAndReorderQueue(entry.queue_id, 'User requested extra time');
            return { status: 'POSTPONED', newPosition: 3 };
        }
    }
    /**
     * Staff begins service for called ticket
     */
    static async startService(entryId, staffId) {
        const entryRes = await query(`SELECT * FROM queue_entries WHERE id = $1`, [entryId]);
        if (entryRes.rows.length === 0)
            throw new Error('Entry not found.');
        const entry = entryRes.rows[0];
        await query(`UPDATE queue_entries 
       SET status = 'IN_SERVICE',
           service_start_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [entryId]);
        // Record SERVICE_STARTED
        await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, reason, actor_id)
       VALUES ($1, $2, $3, 'SERVICE_STARTED', 'Service initiated at counter.', $4)`, [uuidv4(), entryId, entry.queue_id, staffId]);
        const io = getSocketServer();
        if (io) {
            io.to(`queue:${entry.queue_id}`).emit('queue:service_started', {
                entryId,
                ticketNumber: entry.ticket_number,
            });
        }
        return { status: 'IN_SERVICE' };
    }
    /**
     * Staff completes service
     */
    static async completeService(entryId, staffId, outcome = 'SUCCESS', notes) {
        const entryRes = await query(`SELECT * FROM queue_entries WHERE id = $1`, [entryId]);
        if (entryRes.rows.length === 0)
            throw new Error('Entry not found.');
        const entry = entryRes.rows[0];
        const startTime = entry.service_start_time ? new Date(entry.service_start_time) : new Date();
        const durationSeconds = Math.max(30, Math.floor((Date.now() - startTime.getTime()) / 1000));
        // Update entry status
        await query(`UPDATE queue_entries 
       SET status = 'COMPLETED',
           service_end_time = CURRENT_TIMESTAMP,
           notes = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`, [notes || null, entryId]);
        // Record completed session
        if (entry.counter_id) {
            await query(`INSERT INTO service_sessions (id, queue_entry_id, counter_id, staff_id, start_time, end_time, duration_seconds, notes, outcome)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8)`, [uuidv4(), entryId, entry.counter_id, staffId, startTime, durationSeconds, notes || null, outcome]);
            // Release counter back to ACTIVE
            await query(`UPDATE counters SET status = 'ACTIVE' WHERE id = $1`, [entry.counter_id]);
        }
        // Record lifecycle event
        await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, reason, actor_id)
       VALUES ($1, $2, $3, 'SERVICE_COMPLETED', 'Service fulfilled and ticket completed.', $4)`, [uuidv4(), entryId, entry.queue_id, staffId]);
        // Reorder queue
        await this.recalculateAndReorderQueue(entry.queue_id, 'Service fulfilled and completed', staffId);
        const io = getSocketServer();
        if (io) {
            io.to(`queue:${entry.queue_id}`).emit('queue:service_completed', {
                entryId,
                ticketNumber: entry.ticket_number,
            });
        }
        return { status: 'COMPLETED', durationSeconds };
    }
    /**
     * Mark ticket as NO-SHOW
     */
    static async markNoShow(entryId, staffId, reason = 'Did not respond within timer') {
        const entryRes = await query(`SELECT * FROM queue_entries WHERE id = $1`, [entryId]);
        if (entryRes.rows.length === 0)
            throw new Error('Entry not found.');
        const entry = entryRes.rows[0];
        await query(`UPDATE queue_entries 
       SET status = 'NO_SHOW',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [entryId]);
        if (entry.counter_id) {
            await query(`UPDATE counters SET status = 'ACTIVE' WHERE id = $1`, [entry.counter_id]);
        }
        await query(`INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, reason, actor_id)
       VALUES ($1, $2, $3, 'NO_SHOW', $4, $5)`, [uuidv4(), entryId, entry.queue_id, reason, staffId]);
        await this.recalculateAndReorderQueue(entry.queue_id, 'No-show marked', staffId);
        const io = getSocketServer();
        if (io) {
            io.to(`queue:${entry.queue_id}`).emit('queue:user_left', {
                entryId,
                reason: 'NO_SHOW',
            });
        }
        return { status: 'NO_SHOW' };
    }
}
