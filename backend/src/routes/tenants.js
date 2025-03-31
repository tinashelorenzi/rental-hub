const express = require('express');
const router = express.Router();
const { Tenant, Lease, Property, User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all tenants (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, minIncome, maxIncome } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (minIncome || maxIncome) {
      where.monthlyIncome = {};
      if (minIncome) where.monthlyIncome[Op.gte] = minIncome;
      if (maxIncome) where.monthlyIncome[Op.lte] = maxIncome;
    }

    const tenants = await Tenant.findAll({
      where,
      include: [
        { model: Lease, include: [{ model: Property, include: ['User'] }] }
      ]
    });

    // Filter tenants based on user's role and access
    const filteredTenants = tenants.filter(tenant => {
      if (req.user.role === 'admin') return true;
      
      const hasAccess = tenant.Leases.some(lease => 
        lease.Property.ownerId === req.user.id
      );
      
      return hasAccess;
    });

    res.json(filteredTenants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenants', error: error.message });
  }
});

// Get single tenant
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: Lease, include: [{ model: Property, include: ['User'] }] }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if user has access to this tenant
    const hasAccess = tenant.Leases.some(lease => 
      lease.Property.ownerId === req.user.id
    );

    if (req.user.role !== 'admin' && !hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenant', error: error.message });
  }
});

// Create new tenant
router.post('/', authenticateToken, authorize('admin', 'property_company', 'landlord'), async (req, res) => {
  try {
    const tenant = await Tenant.create(req.body);
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error creating tenant', error: error.message });
  }
});

// Update tenant
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: Lease, include: [{ model: Property, include: ['User'] }] }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if user has access to this tenant
    const hasAccess = tenant.Leases.some(lease => 
      lease.Property.ownerId === req.user.id
    );

    if (req.user.role !== 'admin' && !hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await tenant.update(req.body);
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tenant', error: error.message });
  }
});

// Delete tenant
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: Lease, include: [{ model: Property, include: ['User'] }] }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if user has access to this tenant
    const hasAccess = tenant.Leases.some(lease => 
      lease.Property.ownerId === req.user.id
    );

    if (req.user.role !== 'admin' && !hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await tenant.destroy();
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tenant', error: error.message });
  }
});

// Get tenant's lease history
router.get('/:id/leases', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: Lease, include: [{ model: Property, include: ['User'] }] }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if user has access to this tenant
    const hasAccess = tenant.Leases.some(lease => 
      lease.Property.ownerId === req.user.id
    );

    if (req.user.role !== 'admin' && !hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(tenant.Leases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lease history', error: error.message });
  }
});

// Check tenant affordability
router.post('/:id/check-affordability', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const tenant = await Tenant.findByPk(req.params.id);
    const property = await Property.findByPk(propertyId);

    if (!tenant || !property) {
      return res.status(404).json({ message: 'Tenant or property not found' });
    }

    // Check if user has access to this tenant and property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Calculate affordability (30% of monthly income is a common rule)
    const monthlyRent = property.rentAmount;
    const monthlyIncome = tenant.monthlyIncome;
    const isAffordable = monthlyRent <= (monthlyIncome * 0.3);

    res.json({
      isAffordable,
      monthlyIncome,
      monthlyRent,
      percentageOfIncome: (monthlyRent / monthlyIncome) * 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking affordability', error: error.message });
  }
});

module.exports = router; 