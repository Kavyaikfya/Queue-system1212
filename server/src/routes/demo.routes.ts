import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { QueueEngine } from '../engines/queueEngine.js';
import { getSocketServer } from '../socket.js';

const router = Router();

const sampleNames = [
  'Emma Watson', 'Liam Johnson', 'Olivia Williams', 'Noah Brown',
  'Ava Jones', 'Lucas Garcia', 'Isabella Miller', 'Mason Davis',
  'Mia Rodriguez', 'Ethan Martinez', 'Harper Hernandez', 'James Lopez'
];

async function getDefaultQueueId(): Promise<string> {
  const q = await query(`SELECT id FROM queues WHERE status = 'ACTIVE' LIMIT 1`);
  if (q.rows.length === 0) throw new Error('No active queue found.');
  return q.rows[0].id;
}

// POST /demo/add-users
router.post('/add-users', async (req, res) => {
  try {
    const { count = 5, queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    const created = [];
    for (let i = 0; i < count; i++) {
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + ` (Demo ${Math.floor(Math.random() * 900) + 100})`;
      const hasAppt = Math.random() > 0.6;
      const resJoin = await QueueEngine.joinQueue({
        queueId: targetQueueId,
        guestName: randomName,
        guestPhone: '+1-555-' + Math.floor(1000 + Math.random() * 9000),
        hasAppointment: hasAppt,
        notes: '[DEMO MODE] Automated simulation user',
      });
      created.push(resJoin);
    }

    return res.json({
      message: `Simulated ${count} users joining queue.`,
      users: created,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /demo/simulate-urgent
router.post('/simulate-urgent', async (req, res) => {
  try {
    const { queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    const urgentJoin = await QueueEngine.joinQueue({
      queueId: targetQueueId,
      guestName: 'EMERGENCY: Urgent Patient Case',
      guestPhone: '+1-911-0000',
      isUrgent: true,
      notes: '[DEMO MODE] Urgent triage arrival test',
    });

    return res.json({
      message: 'Simulated urgent high-priority ticket entry. Queue reordered with explainable reason logged.',
      ticket: urgentJoin,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /demo/simulate-service
router.post('/simulate-service', async (req, res) => {
  try {
    const { queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    // Check if there is an in-service entry to complete
    const inService = await query(
      `SELECT * FROM queue_entries WHERE queue_id = $1 AND status = 'IN_SERVICE' LIMIT 1`,
      [targetQueueId]
    );

    if (inService.rows.length > 0) {
      const staffRes = await query(`SELECT id FROM users WHERE role IN ('STAFF', 'ORG_ADMIN') LIMIT 1`);
      const staffId = staffRes.rows[0]?.id || 'demo-staff';
      await QueueEngine.completeService(inService.rows[0].id, staffId, 'SUCCESS', 'Demo simulated service completion');
      return res.json({ message: `Simulated service completion for ${inService.rows[0].ticket_number}.` });
    }

    // Otherwise call next and complete immediately
    const counterRes = await query(`SELECT id FROM counters WHERE queue_id = $1 LIMIT 1`, [targetQueueId]);
    if (counterRes.rows.length === 0) return res.status(400).json({ error: 'No counter available.' });
    
    const staffRes = await query(`SELECT id FROM users WHERE role IN ('STAFF', 'ORG_ADMIN') LIMIT 1`);
    const staffId = staffRes.rows[0]?.id || 'demo-staff';

    const callResult = await QueueEngine.callNext(targetQueueId, counterRes.rows[0].id, staffId);
    await QueueEngine.startService(callResult.entry.id, staffId);
    await QueueEngine.completeService(callResult.entry.id, staffId, 'SUCCESS', 'Demo simulated auto-service completion');

    return res.json({ message: `Simulated service lifecycle for ticket ${callResult.entry.ticket_number}.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /demo/simulate-noshow
router.post('/simulate-noshow', async (req, res) => {
  try {
    const { queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    // Check if any is CALLED
    let calledRes = await query(
      `SELECT * FROM queue_entries WHERE queue_id = $1 AND status = 'CALLED' LIMIT 1`,
      [targetQueueId]
    );

    const staffRes = await query(`SELECT id FROM users WHERE role IN ('STAFF', 'ORG_ADMIN') LIMIT 1`);
    const staffId = staffRes.rows[0]?.id || 'demo-staff';

    if (calledRes.rows.length === 0) {
      const counterRes = await query(`SELECT id FROM counters WHERE queue_id = $1 LIMIT 1`, [targetQueueId]);
      if (counterRes.rows.length > 0) {
        const called = await QueueEngine.callNext(targetQueueId, counterRes.rows[0].id, staffId);
        calledRes = { rows: [called.entry] } as any;
      }
    }

    if (calledRes.rows.length > 0) {
      await QueueEngine.markNoShow(calledRes.rows[0].id, staffId, 'Demo simulated response timeout');
      return res.json({ message: `Simulated no-show for ticket ${calledRes.rows[0].ticket_number}.` });
    }

    return res.status(400).json({ error: 'No waiting users available to call and mark no-show.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /demo/simulate-counter-fail
router.post('/simulate-counter-fail', async (req, res) => {
  try {
    const { queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    const activeCounter = await query(
      `SELECT * FROM counters WHERE queue_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [targetQueueId]
    );

    if (activeCounter.rows.length === 0) {
      // Toggle offline back to active
      await query(`UPDATE counters SET status = 'ACTIVE' WHERE queue_id = $1`, [targetQueueId]);
      await QueueEngine.recalculateAndReorderQueue(targetQueueId, 'Counter restored to ACTIVE');
      return res.json({ message: 'All counters restored to ACTIVE. Wait times recalculated.' });
    }

    await query(`UPDATE counters SET status = 'OFFLINE' WHERE id = $1`, [activeCounter.rows[0].id]);
    await QueueEngine.recalculateAndReorderQueue(
      targetQueueId,
      `Counter ${activeCounter.rows[0].counter_number} went OFFLINE`
    );

    return res.json({
      message: `Counter ${activeCounter.rows[0].counter_number} marked OFFLINE. Estimated wait times automatically updated.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /demo/reset
router.post('/reset', async (req, res) => {
  try {
    const { queueId } = req.body;
    const targetQueueId = queueId || (await getDefaultQueueId());

    // Clear demo waiting entries
    await query(`DELETE FROM queue_entries WHERE queue_id = $1 AND notes LIKE '%DEMO MODE%'`, [
      targetQueueId,
    ]);

    // Restore counters
    await query(`UPDATE counters SET status = 'ACTIVE' WHERE queue_id = $1`, [targetQueueId]);

    // Reorder
    await QueueEngine.recalculateAndReorderQueue(targetQueueId, 'Demo reset to initial baseline');

    return res.json({ message: 'Demo mode reset successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
