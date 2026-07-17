// server/src/seed.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from './features/auth/user.model.js';
import City from './features/city/city.model.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cinecosmos.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
    }

    // 2. Create Sample Cities
    const sampleCities = [
      { name: 'Mumbai', state: 'Maharashtra' },
      { name: 'Delhi', state: 'Delhi' },
      { name: 'Bengaluru', state: 'Karnataka' },
      { name: 'Hyderabad', state: 'Telangana' },
      { name: 'Chennai', state: 'Tamil Nadu' }
    ];

    for (const city of sampleCities) {
      const exists = await City.findOne({ name: city.name });
      if (!exists) {
        await City.create(city);
        console.log(`✅ City created: ${city.name}`);
      }
    }

    console.log('🌱 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
