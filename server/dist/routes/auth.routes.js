import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authMiddleware, generateToken, } from '../middleware/auth.js';
const router = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['USER', 'STAFF', 'ORG_ADMIN', 'SUPER_ADMIN']).optional(),
    phone: z.string().optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userId = uuidv4();
        const role = data.role || 'USER';
        await query(`INSERT INTO users (id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`, [userId, data.email, hashedPassword, data.fullName, role, data.phone || null]);
        const tokenUser = {
            id: userId,
            email: data.email,
            fullName: data.fullName,
            role: role,
        };
        const token = generateToken(tokenUser);
        return res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: tokenUser,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Registration failed.' });
    }
});
// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await query(`SELECT id, email, password_hash, full_name, role, phone FROM users WHERE email = $1`, [data.email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password credentials.' });
        }
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password credentials.' });
        }
        const tokenUser = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
        };
        const token = generateToken(tokenUser);
        return res.json({
            message: 'Login successful.',
            token,
            user: tokenUser,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Login failed.' });
    }
});
// POST /auth/logout
router.post('/logout', (req, res) => {
    return res.json({ message: 'Logged out successfully.' });
});
// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email is required.' });
    const userRes = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
        // Return friendly generic response for security
        return res.json({ message: 'If an account exists, a password reset instruction link has been sent.' });
    }
    // Simulated reset code for demonstration
    return res.json({
        message: 'Reset token generated.',
        demoResetToken: 'RESET-' + uuidv4().substring(0, 8).toUpperCase(),
    });
});
// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
    return res.json({ message: 'Password has been successfully updated. You may now log in.' });
});
// GET /auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
    const userRes = await query(`SELECT id, email, full_name, role, phone, created_at FROM users WHERE id = $1`, [req.user.id]);
    if (userRes.rows.length === 0)
        return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: userRes.rows[0] });
});
// PUT /auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { fullName, phone } = req.body;
    await query(`UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [fullName, phone, req.user.id]);
    return res.json({ message: 'Profile updated successfully.' });
});
// POST /auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
        return res.status(400).json({ error: 'Current password does not match.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    return res.json({ message: 'Password updated successfully.' });
});
export default router;
