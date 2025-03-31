const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const propertyRoutes = require('./properties');
const tenantRoutes = require('./tenants');
const leaseRoutes = require('./leases');
const maintenanceRoutes = require('./maintenance');

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/tenants', tenantRoutes);
router.use('/leases', leaseRoutes);
router.use('/maintenance', maintenanceRoutes);

module.exports = router; 