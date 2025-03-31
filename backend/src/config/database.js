const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for logging
const logStream = fs.createWriteStream(path.join(logsDir, 'debug.log'), { flags: 'a' });

// Custom logging function
const log = (message, error = false) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message); // Still show in console
  logStream.write(logMessage);
  if (error) {
    logStream.write(error.stack ? error.stack + '\n' : error + '\n');
    if (error.cause) {
      logStream.write(`Cause: ${error.cause}\n`);
    }
    if (error.code) {
      logStream.write(`Error Code: ${error.code}\n`);
    }
  }
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: (msg) => log(`[Sequelize] ${msg}`),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      }
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    log('Database connection has been established successfully.');
  } catch (error) {
    log('Unable to connect to the database:', error);
    process.exit(1);
  }
};

testConnection();

module.exports = sequelize; 