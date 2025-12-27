const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'temporary-secret-change-in-production';

/**
 * Generate JWT token for admin/DJ
 */
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware to protect routes
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const user = verifyToken(token);
    if (!user) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken
};
