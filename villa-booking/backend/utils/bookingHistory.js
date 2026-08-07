const Admin = require('../models/Admin');

const addHistory = (booking, { actor, actorType = 'sales', action, note = '', changes }) => {
  booking.history.push({
    actor: actor || 'system',
    actorType,
    action,
    note: note || '',
    changes: changes !== undefined ? changes : undefined,
    at: new Date(),
  });
};

const notifyAllSales = async (payload) => {
  const salesMembers = await Admin.find({ role: 'sales' }).select('_id');
  const tasks = salesMembers.map((s) =>
    require('./notify').notify({ ...payload, recipientType: 'sales', recipient: s._id })
  );
  await Promise.allSettled(tasks);
};

module.exports = { addHistory, notifyAllSales };