import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { QueueEngine } from '../engines/queueEngine.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /counters
router.get('/', async (req, res) => {
  try {
    const { organizationId, queueId } = req.query;
    let sql = `
      SELECT c.*, u.full_name as staff_name, q.name as queue_name
      FROM counters c
      LEFT JOIN users u ON c.current_staff_id = u.id
      LEFT JOIN queues q ON c.queue_id = q.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND c.organization_id = $${params.length}`;
    }
    if (queueId) {
      params.push(queueId);
      sql += ` AND c.queue_id = $${params.length}`;
    }
    sql += ` ORDER BY c.counter_number ASC`;

    const result = await query(sql, params);
    return res.json({ counters: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /counters
router.post('/', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  try {
    const { organizationId, queueId, name, counterNumber } = req.body;
    if (!organizationId || !name || counterNumber === undefined) {
      return res.status(400).json({ error: 'Organization ID, name, and counter number are required.' });
    }

    const counterId = uuidv4();
    await query(
      `INSERT INTO counters (id, organization_id, queue_id, name, counter_number, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
      [counterId, organizationId, queueId || null, name, counterNumber]
    );

    return res.status(201).json({ message: 'Counter created successfully.', counterId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /counters/:id
router.put('/:id', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, currentStaffId, name } = req.body;
    const counterRes = await query(`SELECT * FROM counters WHERE id = $1`, [req.params.id]);
    if (counterRes.rows.length === 0) return res.status(404).json({ error: 'Counter not found.' });
    const counter = counterRes.rows[0];

    await query(
      `UPDATE counters 
       SET status = COALESCE($1, status),
           current_staff_id = COALESCE($2, current_staff_id),
           name = COALESCE($3, name)
       WHERE id = $4`,
      [status, currentStaffId, name, req.params.id]
    );

    // If status changed to/from OFFLINE or ACTIVE, recalculate wait times for its queue
    if (counter.queue_id && status && status !== counter.status) {
      await QueueEngine.recalculateAndReorderQueue(
        counter.queue_id,
        `Counter ${counter.counter_number} status changed to ${status}`,
        req.user?.id
      );
    }

    return res.json({ message: 'Counter updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
