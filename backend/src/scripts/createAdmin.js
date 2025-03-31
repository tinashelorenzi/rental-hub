require('dotenv').config();
const { User } = require('../models');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentalhub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await existingAdmin.update({ password: hashedPassword });
      console.log('Admin user password updated successfully');
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdminUser(); 