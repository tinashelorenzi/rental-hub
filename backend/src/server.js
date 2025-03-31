require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const formidable = require('express-formidable');
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { sequelize, User } = require('./models');
const routes = require('./routes');
const fs = require('fs');
const path = require('path');

// Register Sequelize adapter
AdminJS.registerAdapter(AdminJSSequelize);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for logging
const logStream = fs.createWriteStream(path.join(logsDir, 'debug.log'), { flags: 'a' });

// Custom logging function
const log = (message, error = false) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage); // Use process.stdout instead of console.log
  logStream.write(logMessage);
  if (error) {
    const errorStr = error.stack ? error.stack + '\n' : error + '\n';
    process.stdout.write(errorStr);
    logStream.write(errorStr);
    if (error.cause) {
      const causeStr = `Cause: ${error.cause}\n`;
      process.stdout.write(causeStr);
      logStream.write(causeStr);
    }
    if (error.code) {
      const codeStr = `Error Code: ${error.code}\n`;
      process.stdout.write(codeStr);
      logStream.write(codeStr);
    }
  }
};

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error);
  logStream.end();
  process.exit(1);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection at:', promise);
  log('Reason:', reason);
  if (reason instanceof Error) {
    log('Error Stack:', reason.stack);
    log('Error Name:', reason.name);
    log('Error Message:', reason.message);
  }
  logStream.end();
  process.exit(1);
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidable({
  maxFileSize: process.env.MAX_FILE_SIZE,
  uploadDir: process.env.UPLOAD_DIR
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize AdminJS
const adminJs = new AdminJS({
  databases: [sequelize],
  rootPath: '/admin',
  resources: [
    {
      resource: User,
      options: {
        navigation: {
          name: 'User Management',
          icon: 'User',
        },
        properties: {
          password: {
            isVisible: {
              list: false,
              edit: true,
              filter: false,
              show: false,
            },
          },
        },
      },
    },
    {
      resource: require('./models/Property'),
      options: {
        navigation: {
          name: 'Property Management',
          icon: 'Home',
        },
      },
    },
    {
      resource: require('./models/Tenant'),
      options: {
        navigation: {
          name: 'Tenant Management',
          icon: 'Users',
        },
      },
    },
    {
      resource: require('./models/Lease'),
      options: {
        navigation: {
          name: 'Lease Management',
          icon: 'FileText',
        },
      },
    },
    {
      resource: require('./models/Maintenance'),
      options: {
        navigation: {
          name: 'Maintenance',
          icon: 'Tool',
        },
      },
    },
    {
      resource: require('./models/Payment'),
      options: {
        navigation: {
          name: 'Payments',
          icon: 'CreditCard',
        },
      },
    },
  ],
  branding: {
    companyName: 'Rental Hub',
    logo: false,
    favicon: '/favicon.ico',
  },
});

// Create admin router with environment-based authentication
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: async (email, password) => {
      try {
        log(`Attempting to authenticate user: ${email}`);
        
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
          log(`Successfully authenticated admin user: ${email}`);
          return {
            email: process.env.ADMIN_EMAIL,
            title: 'Admin User',
            role: 'admin'
          };
        }

        log(`Authentication failed for user: ${email}`);
        return null;
      } catch (error) {
        log('Authentication error:', error);
        return null;
      }
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET,
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }
);

// Mount admin router before other routes
app.use(adminJs.options.rootPath, adminRouter);

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  log('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;

// Sync database and start server
const startServer = async () => {
  try {
    log('Starting database synchronization...');
    log('Database configuration:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Don't log the password
    });
    
    await sequelize.sync({ alter: true });
    log('Database synchronized successfully');

    app.listen(PORT, () => {
      log(`Server is running on port ${PORT}`);
      log(`AdminJS dashboard available at http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    log('Unable to start server:', error);
    logStream.end();
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  log('Shutting down server...');
  logStream.end();
  process.exit(0);
});

startServer(); 