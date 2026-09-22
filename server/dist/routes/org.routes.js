import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
const router = Router();
// GET /organizations
router.get('/', async (req, res) => {
    try {
        const result = await query(`SELECT o.*, 
              COUNT(DISTINCT q.id) as queue_count,
              COUNT(DISTINCT s.id) as service_count,
              COUNT(DISTINCT c.id) as counter_count
       FROM organizations o
       LEFT JOIN queues q ON o.id = q.organization_id
       LEFT JOIN services s ON o.id = s.organization_id
       LEFT JOIN counters c ON o.id = c.organization_id
       GROUP BY o.id
       ORDER BY o.name ASC`);
        return res.json({ organizations: result.rows });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /organizations/:id
router.get('/:id', async (req, res) => {
    try {
        const orgRes = await query(`SELECT * FROM organizations WHERE id = $1 OR slug = $1`, [
            req.params.id,
        ]);
        if (orgRes.rows.length === 0)
            return res.status(404).json({ error: 'Organization not found.' });
        const org = orgRes.rows[0];
        const services = await query(`SELECT * FROM services WHERE organization_id = $1 ORDER BY name ASC`, [
            org.id,
        ]);
        const queues = await query(`SELECT q.*, s.name as service_name,
              COUNT(CASE WHEN qe.status = 'WAITING' THEN 1 END) as waiting_count,
              COUNT(CASE WHEN qe.status = 'IN_SERVICE' THEN 1 END) as in_service_count
       FROM queues q
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN queue_entries qe ON q.id = qe.queue_id
       WHERE q.organization_id = $1
       GROUP BY q.id, s.name
       ORDER BY q.created_at ASC`, [org.id]);
        const counters = await query(`SELECT c.*, u.full_name as staff_name 
       FROM counters c
       LEFT JOIN users u ON c.current_staff_id = u.id
       WHERE c.organization_id = $1 
       ORDER BY c.counter_number ASC`, [org.id]);
        return res.json({
            organization: org,
            services: services.rows,
            queues: queues.rows,
            counters: counters.rows,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /organizations
router.post('/', authMiddleware, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, type, address, contact, workingHours } = req.body;
        if (!name || !type) {
            return res.status(400).json({ error: 'Organization name and type are required.' });
        }
        const orgId = uuidv4();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + uuidv4().substring(0, 4);
        await query(`INSERT INTO organizations (id, name, slug, type, address, contact, working_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [orgId, name, slug, type, address || null, contact || null, workingHours || '09:00 - 18:00']);
        // Create a default service and queue for this organization
        const serviceId = uuidv4();
        await query(`INSERT INTO services (id, organization_id, name, category, avg_duration_minutes, base_priority)
       VALUES ($1, $2, 'General Assistance', 'STANDARD', 15, 10)`, [serviceId, orgId]);
        const queueId = uuidv4();
        await query(`INSERT INTO queues (id, organization_id, service_id, name, prefix, status, max_capacity)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 100)`, [queueId, orgId, serviceId, `${name} Main Queue`, type.charAt(0)]);
        // Create initial counter
        await query(`INSERT INTO counters (id, organization_id, queue_id, name, counter_number, status)
       VALUES ($1, $2, $3, 'Counter 1', 1, 'ACTIVE')`, [uuidv4(), orgId, queueId]);
        return res.status(201).json({
            message: 'Organization created successfully.',
            organization: { id: orgId, name, slug, type },
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PUT /organizations/:id
router.put('/:id', authMiddleware, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
    try {
        const { name, address, contact, working_hours } = req.body;
        await query(`UPDATE organizations 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           contact = COALESCE($3, contact),
           working_hours = COALESCE($4, working_hours),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`, [name, address, contact, working_hours, req.params.id]);
        return res.json({ message: 'Organization settings updated successfully.' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
