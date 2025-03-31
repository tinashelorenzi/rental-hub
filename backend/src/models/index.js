const sequelize = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Tenant = require('./Tenant');
const Lease = require('./Lease');
const Maintenance = require('./Maintenance');
const Payment = require('./Payment');

// Initialize models
const models = {
  User,
  Property,
  Tenant,
  Lease,
  Maintenance,
  Payment
};

// Add associations to models object
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  ...models,
  sequelize
}; 