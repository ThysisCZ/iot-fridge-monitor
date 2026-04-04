const jwt = require('jsonwebtoken');
const revokedTokenModel = require('../user/revokedTokenModel');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).send({ message: "Access token required." });
        }

        const token = authHeader.split(' ')[1];

        //verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        //check if token is revoked
        const revokedToken = await revokedTokenModel.findOne({ token: token });

        if (revokedToken) {
            return res.status(401).send({ message: "Session is already terminated." });
        }

        //attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid or expired token." });
    }
};