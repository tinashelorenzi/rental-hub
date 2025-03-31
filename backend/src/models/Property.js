const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('apartment', 'house', 'commercial', 'land'),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bathrooms: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true
  },
  squareFootage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  depositAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'rented', 'maintenance', 'reserved'),
    defaultValue: 'available'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'Properties',
  timestamps: true,
  underscored: true
});

// Define associations
Property.associate = (models) => {
  Property.belongsTo(models.User, {
    foreignKey: 'ownerId',
    as: 'owner'
  });

  Property.hasMany(models.Lease, {
    foreignKey: 'propertyId',
    as: 'leases'
  });

  Property.hasMany(models.Maintenance, {
    foreignKey: 'propertyId',
    as: 'maintenanceRequests'
  });
};

module.exports = Property; 