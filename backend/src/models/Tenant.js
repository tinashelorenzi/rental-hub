const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ssn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employmentStatus: {
    type: DataTypes.ENUM('employed', 'self-employed', 'unemployed', 'retired'),
    allowNull: false
  },
  employerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employmentStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  monthlyIncome: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  creditScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  previousAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  previousLandlord: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previousLandlordPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emergencyContactRelation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'inactive'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Tenant; 