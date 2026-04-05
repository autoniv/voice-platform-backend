// ============================================================
//  middleware/auth.js  —  Verifies JWT on every protected route
// ============================================================
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  try {
    // Expect header:  Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing from Authorization header.' });
    }

    // Verify and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { userId, email, plan }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};
