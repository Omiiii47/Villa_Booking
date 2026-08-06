const Admin = require('../models/Admin');

const listSalesTeam = async (req, res) => {
  try {
    const staff = await Admin.find({ role: 'sales' }).select('-password').sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSalesTeamMember = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    const member = await Admin.create({ name, email, password, role: 'sales' });
    res.status(201).json({ _id: member._id, name: member.name, email: member.email, role: member.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSalesTeamMember = async (req, res) => {
  try {
    const member = await Admin.findOneAndDelete({ _id: req.params.id, role: 'sales' });
    if (!member) {
      return res.status(404).json({ message: 'Sales team member not found' });
    }
    res.json({ message: 'Sales team member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listSalesTeam, createSalesTeamMember, deleteSalesTeamMember };