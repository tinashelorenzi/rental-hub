const express = require('express');
const router = express.Router();
const { Lease, Property, Tenant, User, Payment } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all leases (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, propertyId, tenantId } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    if (tenantId) where.tenantId = tenantId;

    const leases = await Lease.findAll({
      where,
      include: [
        { model: Property, include: ['User'] },
        { model: Tenant },
        { model: Payment }
      ]
    });

    // Filter leases based on user's role and access
    const filteredLeases = leases.filter(lease => {
      if (req.user.role === 'admin') return true;
      return lease.Property.ownerId === req.user.id;
    });

    res.json(filteredLeases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leases', error: error.message });
  }
});

// Get single lease
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] },
        { model: Tenant },
        { model: Payment }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(lease);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lease', error: error.message });
  }
});

// Create new lease
router.post('/', authenticateToken, authorize('admin', 'property_company', 'landlord'), async (req, res) => {
  try {
    const { propertyId, tenantId, ...leaseData } = req.body;

    // Check if property exists and user has access
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (req.user.role !== 'admin' && property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Check if property is available
    if (property.status !== 'available') {
      return res.status(400).json({ message: 'Property is not available for lease' });
    }

    // Create lease
    const lease = await Lease.create({
      ...leaseData,
      propertyId,
      tenantId,
      status: 'pending'
    });

    // Update property status
    await property.update({ status: 'reserved' });

    res.status(201).json(lease);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lease', error: error.message });
  }
});

// Update lease
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await lease.update(req.body);
    res.json(lease);
  } catch (error) {
    res.status(500).json({ message: 'Error updating lease', error: error.message });
  }
});

// Delete lease
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Update property status back to available
    await lease.Property.update({ status: 'available' });

    await lease.destroy();
    res.json({ message: 'Lease deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lease', error: error.message });
  }
});

// Get lease payments
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] },
        { model: Payment }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(lease.Payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// Record payment
router.post('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const payment = await Payment.create({
      ...req.body,
      leaseId: lease.id
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
});

// Generate lease document
router.post('/:id/generate-document', authenticateToken, async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id, {
      include: [
        { model: Property, include: ['User'] },
        { model: Tenant }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if user has access to this lease
    if (req.user.role !== 'admin' && lease.Property.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Here you would typically generate a PDF document
    // For now, we'll just return the lease data
    res.json({
      message: 'Lease document generated successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating lease document', error: error.message });
  }
});

module.exports = router; 