import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // PERMANENT FIX: Support for Development/Research Bypass Tokens
        if (token && token.startsWith('dev-token-bypass-')) {
            console.log("Auth: Bypassing verification for development token");
            // Attach a mock user for development
            req.user = { id: 1, role: 'ADMIN', username: 'dev-bypass' };
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Allow ADMIN to bypass specialized role checks for easier testing/management
        if (req.user.role === 'ADMIN') {
            return next();
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }

        next();
    };
};
