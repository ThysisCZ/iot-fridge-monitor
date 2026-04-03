require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports.authenticateToken = (req, res, next) => {
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send({ success: false, message: 'Access token required.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        // Continue to next controller
        next();
    } catch (e) {
        return res.status(403).send({ success: false, message: 'Invalid or expired token.' });
    }
};