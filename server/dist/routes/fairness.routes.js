import { Router } from 'express';
import { query } from '../db/index.js';
import { FairnessEngine } from '../engines/fairnessEngine.js';
const router = Router();
// GET /fairness/status
router.get('/status', async (req, res) => {
    try {
        const { queueId } = req.query;
        let entriesSql = `SELECT * FROM queue_entries WHERE status = 'WAITING'`;
        const params = [];
        if (queueId) {
            entriesSql += ` AND queue_id = $1`;
            params.push(queueId);
        }
        entriesSql += ` ORDER BY position ASC`;
        const entriesRes = await query(entriesSql, params);
        const snapshots = entriesRes.rows.map((e) => ({
            id: e.id,
            ticketNumber: e.ticket_number,
            position: e.position,
            minutesWaited: Math.max(0, Math.floor((Date.now() - new Date(e.join_time).getTime()) / 60000)),
            isUrgent: Boolean(e.is_urgent),
            hasAppointment: Boolean(e.has_appointment),
        }));
        const report = FairnessEngine.evaluate(snapshots);
        // Fetch recent logged fairness alerts from database
        const dbAlerts = await query(`SELECT * FROM fairness_events ORDER BY created_at DESC LIMIT 10`);
        return res.json({
            report,
            recentEvents: dbAlerts.rows,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /fairness/replay (Replay timeline data for Queue Replay player)
router.get('/replay', async (req, res) => {
    try {
        const { queueId } = req.query;
        let eventsSql = `
      SELECT qe_ev.*, qe.ticket_number, qe.guest_name, qe.is_urgent, q.name as queue_name
      FROM queue_events qe_ev
      JOIN queue_entries qe ON qe_ev.queue_entry_id = qe.id
      JOIN queues q ON qe_ev.queue_id = q.id
    `;
        const params = [];
        if (queueId) {
            eventsSql += ` WHERE qe_ev.queue_id = $1`;
            params.push(queueId);
        }
        eventsSql += ` ORDER BY qe_ev.created_at ASC LIMIT 100`;
        const eventsRes = await query(eventsSql, params);
        // Format events into sequential simulation steps
        let currentQueueSize = 0;
        const replayFrames = eventsRes.rows.map((ev, index) => {
            if (ev.event_type === 'JOINED')
                currentQueueSize++;
            if (['SERVICE_COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(ev.event_type)) {
                currentQueueSize = Math.max(0, currentQueueSize - 1);
            }
            return {
                step: index + 1,
                timestamp: ev.created_at,
                eventType: ev.event_type,
                ticketNumber: ev.ticket_number,
                name: ev.guest_name,
                isUrgent: ev.is_urgent,
                previousPosition: ev.previous_position,
                newPosition: ev.new_position,
                reason: ev.reason,
                queueSizeAfter: currentQueueSize,
            };
        });
        return res.json({
            totalFrames: replayFrames.length,
            frames: replayFrames,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
