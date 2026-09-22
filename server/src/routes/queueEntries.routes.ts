import { Router } from 'express';
import { query } from '../db/index.js';
import { QueueEngine } from '../engines/queueEngine.js';
import {
  authMiddleware,
  optionalAuth,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

// GET /queue-entries/active (User active tickets)
router.get('/active', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query(
      `SELECT qe.*, q.name as queue_name, q.prefix, o.name as organization_name, o.slug as org_slug,
              c.name as counter_name, c.counter_number, s.name as service_name, s.description as service_description,
              (SELECT count(*) FROM queue_entries qe2 
               WHERE qe2.queue_id = qe.queue_id AND qe2.status = 'WAITING' AND qe2.position < qe.position
              ) as people_ahead
       FROM queue_entries qe
       JOIN queues q ON qe.queue_id = q.id
       JOIN organizations o ON q.organization_id = o.id
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN counters c ON qe.counter_id = c.id
       WHERE qe.user_id = $1 AND qe.status IN ('WAITING', 'CALLED', 'IN_SERVICE')
       ORDER BY qe.join_time DESC`,
      [req.user!.id]
    );

    return res.json({ activeTickets: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /queue-entries/history (User past ticket history)
router.get('/history', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query(
      `SELECT qe.*, q.name as queue_name, o.name as organization_name,
              s.duration_seconds
       FROM queue_entries qe
       JOIN queues q ON qe.queue_id = q.id
       JOIN organizations o ON q.organization_id = o.id
       LEFT JOIN service_sessions s ON s.queue_entry_id = qe.id
       WHERE qe.user_id = $1 AND qe.status IN ('COMPLETED', 'NO_SHOW', 'CANCELLED', 'EXPIRED')
       ORDER BY qe.created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );

    return res.json({ history: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /queue-entries/:id (Single ticket detail + full transparency timeline)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const entryId = String(req.params.id);
    const entryRes = await query(
      `SELECT qe.*, q.name as queue_name, q.prefix, o.name as organization_name, o.type as org_type,
              c.name as counter_name, c.counter_number, u.full_name as staff_name,
              (SELECT count(*) FROM queue_entries qe2 
               WHERE qe2.queue_id = qe.queue_id AND qe2.status = 'WAITING' AND qe2.position < qe.position
              ) as people_ahead
       FROM queue_entries qe
       JOIN queues q ON qe.queue_id = q.id
       JOIN organizations o ON q.organization_id = o.id
       LEFT JOIN counters c ON qe.counter_id = c.id
       LEFT JOIN users u ON qe.staff_id = u.id
       WHERE qe.id = $1`,
      [entryId]
    );

    if (entryRes.rows.length === 0) {
      return res.status(404).json({ error: 'Queue entry not found.' });
    }

    const entry = entryRes.rows[0];

    // Fetch complete transparent audit timeline
    const eventsRes = await query(
      `SELECT qe_ev.*, u.full_name as actor_name
       FROM queue_events qe_ev
       LEFT JOIN users u ON qe_ev.actor_id = u.id
       WHERE qe_ev.queue_entry_id = $1
       ORDER BY qe_ev.created_at ASC`,
      [entry.id]
    );

    return res.json({
      entry,
      timeline: eventsRes.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /queue-entries/:id/call (Staff calls user)
router.post(
  '/:id/call',
  authMiddleware,
  requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const entryId = String(req.params.id);
      const { counterId, queueId } = req.body;
      const staffId = req.user!.id;

      if (!counterId) return res.status(400).json({ error: 'Counter ID is required to call next.' });

      // If queueId not provided, look up from entry
      let targetQueueId = queueId;
      if (!targetQueueId) {
        const ent = await query('SELECT queue_id FROM queue_entries WHERE id = $1', [entryId]);
        if (ent.rows.length > 0) targetQueueId = ent.rows[0].queue_id;
      }

      const result = await QueueEngine.callNext(targetQueueId, counterId, staffId);
      return res.json({ message: 'Next user called successfully.', ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

// POST /queue-entries/:id/start (Staff starts service)
router.post(
  '/:id/start',
  authMiddleware,
  requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const entryId = String(req.params.id);
      const result = await QueueEngine.startService(entryId, req.user!.id);
      return res.json({ message: 'Service started.', ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

// POST /queue-entries/:id/complete (Staff completes service)
router.post(
  '/:id/complete',
  authMiddleware,
  requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const entryId = String(req.params.id);
      const { outcome, notes } = req.body;
      const result = await QueueEngine.completeService(
        entryId,
        req.user!.id,
        outcome || 'SUCCESS',
        notes
      );
      return res.json({ message: 'Service completed successfully.', ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

// POST /queue-entries/:id/no-show (Staff marks no-show)
router.post(
  '/:id/no-show',
  authMiddleware,
  requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const entryId = String(req.params.id);
      const { reason } = req.body;
      const result = await QueueEngine.markNoShow(entryId, req.user!.id, reason);
      return res.json({ message: 'Ticket marked as no-show.', ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

// POST /queue-entries/:id/respond (User responds to call: READY or NEED_TIME)
router.post('/:id/respond', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const entryId = String(req.params.id);
    const { action } = req.body;
    if (action !== 'READY' && action !== 'NEED_TIME') {
      return res.status(400).json({ error: "Action must be 'READY' or 'NEED_TIME'." });
    }

    const result = await QueueEngine.respondTurn(entryId, action, req.user?.id);
    return res.json({ message: 'Response received.', ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /queue-entries/:id/leave (User leaves/cancels ticket)
router.post('/:id/leave', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const entryId = String(req.params.id);
    const entryRes = await query('SELECT * FROM queue_entries WHERE id = $1', [entryId]);
    if (entryRes.rows.length === 0) return res.status(404).json({ error: 'Entry not found.' });
    const entry = entryRes.rows[0];

    await query(
      `UPDATE queue_entries SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [entryId]
    );

    await query(
      `INSERT INTO queue_events (id, queue_entry_id, queue_id, event_type, reason, actor_id)
       VALUES (gen_random_uuid(), $1, $2, 'CANCELLED', 'User voluntarily cancelled or left queue.', $3)`,
      [entry.id, entry.queue_id, req.user?.id || null]
    );

    await QueueEngine.recalculateAndReorderQueue(entry.queue_id, 'User cancelled ticket', req.user?.id);
    return res.json({ message: 'Successfully left queue.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /queue-entries/:id/urgent (Toggle triage emergency priority)
router.post(
  '/:id/urgent',
  authMiddleware,
  requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const entryId = String(req.params.id);
      const entryRes = await query('SELECT * FROM queue_entries WHERE id = $1', [entryId]);
      if (entryRes.rows.length === 0) return res.status(404).json({ error: 'Entry not found.' });
      const entry = entryRes.rows[0];

      const newUrgentState = !entry.is_urgent;
      await query(`UPDATE queue_entries SET is_urgent = $1 WHERE id = $2`, [
        newUrgentState,
        entryId,
      ]);

      await QueueEngine.recalculateAndReorderQueue(
        entry.queue_id,
        newUrgentState ? 'Urgent triage flag applied' : 'Urgent triage flag cleared',
        req.user?.id
      );

      return res.json({
        message: `Triage urgency set to ${newUrgentState}`,
        isUrgent: newUrgentState,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
