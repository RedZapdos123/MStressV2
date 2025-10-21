const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mstress-secret-key-2024';

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

/**
 * Middleware to verify admin role
 */
const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    next();
  });
};

/**
 * Middleware to verify human_reviewer or admin role
 */
const requireReviewer = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!['human_reviewer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Reviewer role required.'
      });
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireReviewer,
  JWT_SECRET
};

