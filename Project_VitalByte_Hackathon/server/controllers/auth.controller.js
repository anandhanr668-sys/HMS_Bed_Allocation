import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // 2. Check status
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is inactive. Contact Administrator.' });
        }

        // 3. Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // 5. Audit Log
        await logAdminAction({
            userId: user.id,
            action: 'USER_LOGIN',
            module: 'AUTH',
            entityId: user.id.toString(),
            details: { email: user.email, role: user.role },
            ipAddress: req.ip
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Hospital Demo Mode / Dev Login
 * Rapid authentication for development and testing.
 */
export const devLogin = async (req, res) => {
    // SECURITY CONTROL: Only allow in DEV mode
    if (process.env.AUTH_MODE !== 'DEV') {
        return res.status(403).json({ error: 'Dev login is disabled in production environment.' });
    }

    const { role } = req.body;
    console.log(`[AUTH] Hospital Demo Mode Login attempt for role: ${role}`);

    try {
        // Find the first active user with the specified role
        const result = await query(
            'SELECT * FROM users WHERE role = $1 AND status = $2 LIMIT 1',
            [role, 'ACTIVE']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No active user found with role: ${role}` });
        }

        const user = result.rows[0];

        // Generate Token (Same logic as standard login)
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Audit Log for bypass login
        await logAdminAction({
            userId: user.id,
            action: 'DEV_AUTO_LOGIN',
            module: 'AUTH',
            entityId: user.id.toString(),
            details: { email: user.email, role: user.role, bypass: true },
            ipAddress: req.ip
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            }
        });
    } catch (err) {
        console.error('Dev login error:', err);
        res.status(500).json({ error: 'Server failure during bypass authentication.' });
    }
};
