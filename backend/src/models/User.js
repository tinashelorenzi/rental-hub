const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'property_company', 'landlord', 'staff'),
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'Users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  try {
    if (!this.password) {
      console.error('No password hash found for user');
      return false;
    }
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
};

// Define associations
User.associate = (models) => {
  User.hasMany(models.Property, {
    foreignKey: 'ownerId',
    as: 'properties'
  });

  User.hasMany(models.Maintenance, {
    foreignKey: 'reportedBy',
    as: 'reportedMaintenance'
  });

  User.hasMany(models.Maintenance, {
    foreignKey: 'assignedTo',
    as: 'assignedMaintenance'
  });

  // Self-referential relationship for company hierarchy
  User.belongsTo(User, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  User.hasMany(User, {
    foreignKey: 'parentId',
    as: 'children'
  });
};

module.exports = User; 