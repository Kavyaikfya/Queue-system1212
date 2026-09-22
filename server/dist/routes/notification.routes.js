import { Router } from 'express';
import { query } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
// GET /notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await query(`SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`, [req.user.id]);
        const unreadCountRes = await query(`SELECT count(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`, [req.user.id]);
        return res.json({
            notifications: result.rows,
            unreadCount: parseInt(unreadCountRes.rows[0].count, 10),
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PUT /notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
        return res.json({ message: 'Notification marked as read.' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PUT /notifications/read-all
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [req.user.id]);
        return res.json({ message: 'All notifications marked as read.' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
export default router;
