const express = require('express');
const router = express.Router();
const { Maintenance, Property, User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all maintenance requests (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, propertyId } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (propertyId) where.propertyId = propertyId;

    const maintenance = await Maintenance.findAll({
      where,
      include: [
        { model: Property, include: ['User'] },
        { model: User, as: 'reportedBy', attributes: ['firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    // Filter maintenance requests based on user's role and access
    const filteredMaintenance = maintenance.filter(request => {
      if (req.user.role === 'admin') return true;
      return request.Property.ownerId === req.user.id;
    });

    res.json(filteredMaintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance requests', error: error.message });
  }
});

// Get single maintenance request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] },
        { model: User, as: 'reportedBy', attributes: ['firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user has access to this maintenance request
    if (req.user.role !== 'admin' && maintenance.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance request', error: error.message });
  }
});

// Create new maintenance request
router.post('/', authenticateToken, authorize('admin', 'property_company', 'landlord'), async (req, res) => {
  try {
    const { propertyId, ...maintenanceData } = req.body;

    // Check if property exists and user has access
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const maintenance = await Maintenance.create({
      ...maintenanceData,
      propertyId,
      reportedBy: req.user.id,
      status: 'pending'
    });

    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error creating maintenance request', error: error.message });
  }
});

// Update maintenance request
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user has access to this maintenance request
    if (req.user.role !== 'admin' && maintenance.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await maintenance.update(req.body);
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance request', error: error.message });
  }
});

// Delete maintenance request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user has access to this maintenance request
    if (req.user.role !== 'admin' && maintenance.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await maintenance.destroy();
    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting maintenance request', error: error.message });
  }
});

// Assign maintenance request
router.put('/:id/assign', authenticateToken, authorize('admin', 'property_company'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user has access to this maintenance request
    if (req.user.role !== 'admin' && maintenance.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await maintenance.update({
      assignedTo,
      status: 'in_progress'
    });

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning maintenance request', error: error.message });
  }
});

// Complete maintenance request
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { cost, notes } = req.body;
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user has access to this maintenance request
    if (req.user.role !== 'admin' && maintenance.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await maintenance.update({
      status: 'completed',
      completedDate: new Date(),
      cost,
      notes: notes || maintenance.notes
    });

    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Error completing maintenance request', error: error.message });
  }
});

module.exports = router; 