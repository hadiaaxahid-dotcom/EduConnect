const crypto = require('crypto');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const demoAccounts = [
  { name: 'Demo Admin', email: 'admin.demo@educonnect.test', role: 'admin' },
  { name: 'Demo Teacher', email: 'teacher.demo@educonnect.test', role: 'teacher' },
  { name: 'Demo Student', email: 'student.demo@educonnect.test', role: 'student' }
];

async function seedDemoUsers() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    for (const account of demoAccounts) {
      const existing = await User.findOne({ email: account.email }).select('_id role');
      if (existing) {
        console.log(`Skipped ${account.email}: account already exists; password was not changed.`);
        continue;
      }

      const password = crypto.randomBytes(18).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({ ...account, password: hashedPassword });
      console.log(`Created ${account.role}: ${account.email} | password: ${password}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoUsers().catch((error) => {
  console.error(`Demo account seeding failed: ${error.message}`);
  process.exitCode = 1;
});
