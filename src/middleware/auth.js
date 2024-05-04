const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
    try {
        const authorizedHeader = req.headers.authorization;
        const token = authorizedHeader && authorizedHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
};
module.exports = verifyToken;
