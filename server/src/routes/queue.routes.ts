import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { QueueEngine } from '../engines/queueEngine.js';
import { FairnessEngine } from '../engines/fairnessEngine.js';
import {
  authMiddleware,
  optionalAuth,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

// GET /queues
router.get('/', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let sql = `
      SELECT q.*, o.name as organization_name, o.type as organization_type, s.name as service_name,
             COUNT(CASE WHEN qe.status = 'WAITING' THEN 1 END) as waiting_count,
             COUNT(CASE WHEN qe.status = 'IN_SERVICE' THEN 1 END) as in_service_count
      FROM queues q
      JOIN organizations o ON q.organization_id = o.id
      LEFT JOIN services s ON q.service_id = s.id
      LEFT JOIN queue_entries qe ON q.id = qe.queue_id
    `;
    const params: any[] = [];
    if (organizationId) {
      sql += ` WHERE q.organization_id = $1`;
      params.push(organizationId);
    }
    sql += ` GROUP BY q.id, o.name, o.type, s.name ORDER BY q.created_at ASC`;

    const result = await query(sql, params);
    return res.json({ queues: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /queues/:id
router.get('/:id', async (req, res) => {
  try {
    const queueRes = await query(
      `SELECT q.*, o.name as organization_name, o.type as organization_type, s.name as service_name, s.avg_duration_minutes
       FROM queues q
       JOIN organizations o ON q.organization_id = o.id
       LEFT JOIN services s ON q.service_id = s.id
       WHERE q.id = $1`,
      [req.params.id]
    );
    if (queueRes.rows.length === 0) return res.status(404).json({ error: 'Queue not found.' });
    const queue = queueRes.rows[0];

    // Fetch waiting entries
    const waitingEntries = await query(
      `SELECT qe.*, u.full_name as user_name, u.email as user_email
       FROM queue_entries qe
       LEFT JOIN users u ON qe.user_id = u.id
       WHERE qe.queue_id = $1 AND qe.status = 'WAITING'
       ORDER BY qe.position ASC`,
      [req.params.id]
    );

    // Fetch in-service entries
    const inServiceEntries = await query(
      `SELECT qe.*, c.name as counter_name, c.counter_number, u.full_name as staff_name
       FROM queue_entries qe
       LEFT JOIN counters c ON qe.counter_id = c.id
       LEFT JOIN users u ON qe.staff_id = u.id
       WHERE qe.queue_id = $1 AND qe.status IN ('CALLED', 'IN_SERVICE')
       ORDER BY qe.called_time DESC`,
      [req.params.id]
    );

    // Fetch counters
    const counters = await query(
      `SELECT c.*, u.full_name as staff_name
       FROM counters c
       LEFT JOIN users u ON c.current_staff_id = u.id
       WHERE c.queue_id = $1
       ORDER BY c.counter_number ASC`,
      [req.params.id]
    );

    // Compute live fairness score
    const snapshotsForFairness = waitingEntries.rows.map((e) => ({
      id: e.id,
      ticketNumber: e.ticket_number,
      position: e.position,
      minutesWaited: Math.max(0, Math.floor((Date.now() - new Date(e.join_time).getTime()) / 60000)),
      isUrgent: Boolean(e.is_urgent),
      hasAppointment: Boolean(e.has_appointment),
    }));

    const fairnessReport = FairnessEngine.evaluate(snapshotsForFairness);

    return res.json({
      queue,
      waitingEntries: waitingEntries.rows,
      inServiceEntries: inServiceEntries.rows,
      counters: counters.rows,
      fairness: fairnessReport,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /queues/:id/join
router.post('/:id/join', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { guestName, guestPhone, isUrgent, hasAppointment, notes } = req.body;
    const userId = req.user?.id;
    const queueId = String(req.params.id);

    const result = await QueueEngine.joinQueue({
      queueId,
      userId,
      guestName: guestName || req.user?.fullName,
      guestPhone,
      isUrgent: Boolean(isUrgent),
      hasAppointment: Boolean(hasAppointment),
      notes,
    });

    return res.status(201).json({
      message: 'Successfully joined queue.',
      ...result,
    });
  } catch (err: any) {
    if (err.code === 'ALREADY_IN_QUEUE') {
      return res.status(409).json({
        error: 'You are already in this queue.',
        alreadyInQueue: true,
        ...err.data,
      });
    }
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// POST /queues/:id/pause
router.post('/:id/pause', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'), async (req, res) => {
  try {
    const queueId = String(req.params.id);
    const current = await query(`SELECT status FROM queues WHERE id = $1`, [queueId]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Queue not found.' });

    const newStatus = current.rows[0].status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    await query(`UPDATE queues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
      newStatus,
      queueId,
    ]);

    await QueueEngine.recalculateAndReorderQueue(
      queueId,
      `Queue status updated to ${newStatus}`,
      (req as AuthenticatedRequest).user?.id
    );

    return res.json({ message: `Queue is now ${newStatus}.`, status: newStatus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /queues/:id/reorder
router.post('/:id/reorder', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'), async (req, res) => {
  try {
    const queueId = String(req.params.id);
    await QueueEngine.recalculateAndReorderQueue(
      queueId,
      'Manual admin reorder trigger',
      (req as AuthenticatedRequest).user?.id
    );
    return res.json({ message: 'Queue successfully recalculated and reordered.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /queues/:id (Save Configuration)
router.put('/:id', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const queueId = String(req.params.id);
    const { name, maxCapacity, operatingHours, priorityRulesJson, noShowTimeoutSec } = req.body;
    await query(
      `UPDATE queues 
       SET name = COALESCE($1, name),
           max_capacity = COALESCE($2, max_capacity),
           operating_hours = COALESCE($3, operating_hours),
           priority_rules_json = COALESCE($4, priority_rules_json),
           no_show_timeout_sec = COALESCE($5, no_show_timeout_sec),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        name,
        maxCapacity,
        operatingHours,
        typeof priorityRulesJson === 'object' ? JSON.stringify(priorityRulesJson) : priorityRulesJson,
        noShowTimeoutSec,
        queueId,
      ]
    );

    // Apply configuration changes to live queue
    await QueueEngine.recalculateAndReorderQueue(
      queueId,
      'Queue configuration updated by admin'
    );

    return res.json({ message: 'Queue configuration saved and applied dynamically.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
