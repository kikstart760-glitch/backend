const jwt = require('jsonwebtoken');

// ✅ AUTH MIDDLEWARE
const middleware = (req, res, next) => {
  const authentication = req.headers.authorization;

  if (!authentication || !authentication.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authentication.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not found' });
  }

  try {
    // ✅ FIXED SECRET
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ✅ FIXED VARIABLE NAME
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ✅ ROLE AUTHORIZATION
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions"
      });
    }
    next();
  };
};

// ✅ ACCESS TOKEN
const generateAccessToken = (userdata) => {
  return jwt.sign(
    userdata,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

// ✅ REFRESH TOKEN
const generateRefreshToken = (userdata) => {
  return jwt.sign(
    userdata,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  middleware,
  authorizeRoles,
  generateAccessToken,
  generateRefreshToken
};