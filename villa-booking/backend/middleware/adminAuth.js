const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const verifyAdminToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }
    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminProtect = async (req, res, next) => {
  await verifyAdminToken(req, res, () => {
    if (req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, admin role required' });
    }
    next();
  });
};

const salesProtect = async (req, res, next) => {
  await verifyAdminToken(req, res, () => {
    if (req.admin.role !== 'sales') {
      return res.status(403).json({ message: 'Not authorized, sales role required' });
    }
    next();
  });
};

module.exports = { adminProtect, salesProtect };
