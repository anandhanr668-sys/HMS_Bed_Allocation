const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "LCNC_SUPER_SECRET_KEY";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken,
};
