const express = require('express');
const router = express.Router();
const { Property, User, Lease, Maintenance } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all properties (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, city, minPrice, maxPrice } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (type) where.type = type;
    if (city) where.city = city;
    if (minPrice || maxPrice) {
      where.rentAmount = {};
      if (minPrice) where.rentAmount[Op.gte] = minPrice;
      if (maxPrice) where.rentAmount[Op.lte] = maxPrice;
    }

    // If user is not admin, only show their properties
    if (req.user.role !== 'admin') {
      where.ownerId = req.user.id;
    }

    const properties = await Property.findAll({
      where,
      include: [
        { model: User, attributes: ['firstName', 'lastName', 'email'] },
        { model: Lease, where: { status: 'active' }, required: false },
        { model: Maintenance, where: { status: 'pending' }, required: false }
      ]
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

// Get single property
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['firstName', 'lastName', 'email'] },
        { model: Lease, include: ['Tenant'] },
        { model: Maintenance }
      ]
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has access to this property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});

// Create new property
router.post('/', authenticateToken, authorize('admin', 'property_company', 'landlord'), async (req, res) => {
  try {
    const property = await Property.create({
      ...req.body,
      ownerId: req.user.id
    });

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

// Update property
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has access to this property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await property.update(req.body);
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property', error: error.message });
  }
});

// Delete property
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has access to this property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await property.destroy();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting property', error: error.message });
  }
});

// Get property maintenance history
router.get('/:id/maintenance', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has access to this property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const maintenance = await Maintenance.findAll({
      where: { propertyId: req.params.id },
      include: [
        { model: User, as: 'reportedBy', attributes: ['firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance history', error: error.message });
  }
});

// Get property lease history
router.get('/:id/leases', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has access to this property
    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const leases = await Lease.findAll({
      where: { propertyId: req.params.id },
      include: ['Tenant']
    });

    res.json(leases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lease history', error: error.message });
  }
});

module.exports = router; 