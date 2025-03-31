const User = require('./User');
const Property = require('./Property');
const Tenant = require('./Tenant');
const Lease = require('./Lease');
const Maintenance = require('./Maintenance');
const Payment = require('./Payment');

// User relationships
User.hasMany(Property, { foreignKey: 'ownerId' });
Property.belongsTo(User, { foreignKey: 'ownerId' });

User.hasMany(Maintenance, { foreignKey: 'reportedBy' });
Maintenance.belongsTo(User, { foreignKey: 'reportedBy' });

User.hasMany(Maintenance, { foreignKey: 'assignedTo' });
Maintenance.belongsTo(User, { foreignKey: 'assignedTo' });

// Property relationships
Property.hasMany(Lease);
Lease.belongsTo(Property);

Property.hasMany(Maintenance);
Maintenance.belongsTo(Property);

// Tenant relationships
Tenant.hasMany(Lease);
Lease.belongsTo(Tenant);

// Lease relationships
Lease.hasMany(Payment);
Payment.belongsTo(Lease);

module.exports = {
  User,
  Property,
  Tenant,
  Lease,
  Maintenance,
  Payment
}; 