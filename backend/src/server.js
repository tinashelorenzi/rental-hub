require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const session = require('express-session');
const { sequelize } = require('./models');
const routes = require('./routes');
const { authenticateAdmin } = require('./middleware/auth');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// AdminJS configuration
const adminJs = new AdminJS({
  databases: [sequelize],
  rootPath: '/admin',
  resources: [
    {
      resource: require('./models/User'),
      options: {
        navigation: {
          name: 'User Management',
          icon: 'User',
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
          icon: 'Money',
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

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: authenticateAdmin,
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET,
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  }
);

app.use(adminJs.options.rootPath, adminRouter);

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`AdminJS is available at http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  }); 