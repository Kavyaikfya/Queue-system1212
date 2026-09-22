import { Router } from 'express';
import { query } from '../db/index.js';
import { SimulatorEngine } from '../engines/simulatorEngine.js';
const router = Router();
// POST /simulator/run
router.post('/run', async (req, res) => {
    try {
        const { queueId, additionalUsers = 10, counterChange = 0, serviceDurationMultiplier = 1.0, pauseMinutes = 0, } = req.body;
        let queueLength = 8;
        let avgWaitMinutes = 18;
        let activeCounters = 2;
        let avgServiceMinutes = 12;
        if (queueId) {
            const qRes = await query(`SELECT q.*, s.avg_duration_minutes,
                (SELECT count(*) FROM queue_entries WHERE queue_id = q.id AND status = 'WAITING') as waiting_count,
                (SELECT count(*) FROM counters WHERE queue_id = q.id AND status IN ('ACTIVE', 'BUSY')) as counter_count
         FROM queues q
         LEFT JOIN services s ON q.service_id = s.id
         WHERE q.id = $1`, [queueId]);
            if (qRes.rows.length > 0) {
                const q = qRes.rows[0];
                queueLength = parseInt(q.waiting_count || '0', 10);
                activeCounters = Math.max(1, parseInt(q.counter_count || '1', 10));
                avgServiceMinutes = q.avg_duration_minutes || 12;
                avgWaitMinutes = Math.round(Math.ceil(queueLength / activeCounters) * avgServiceMinutes);
            }
        }
        const simulation = SimulatorEngine.runScenario({
            currentQueueLength: queueLength,
            currentAvgWaitMinutes: avgWaitMinutes,
            currentActiveCounters: activeCounters,
            currentAvgServiceMinutes: avgServiceMinutes,
            additionalUsers: Number(additionalUsers),
            counterChange: Number(counterChange),
            serviceDurationMultiplier: Number(serviceDurationMultiplier),
            pauseMinutes: Number(pauseMinutes),
        });
        return res.json(simulation);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
