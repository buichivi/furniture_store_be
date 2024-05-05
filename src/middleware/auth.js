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

const verifyTokenAndAmin = (req, res, next) => {
    try {
        const authorizedHeader = req.headers.authorization;
        const token = authorizedHeader && authorizedHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const { userId, admin } = jwt.verify(token, process.env.SECRET_KEY);
        if (!admin) {
            return res
                .status(403)
                .json({ error: `You don't have permission to access` });
        }
        req.userId = userId;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
};
module.exports = { verifyToken, verifyTokenAndAmin };
