import User from '../models/userModel';
import { encodePassword } from './userUtils';
import dotenv from 'dotenv';
dotenv.config();

export const initiateSuperAdmin = async () => {
  const name = process.env.SUPERADMIN_NAME;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('SuperAdmin credentials are not set in environment variables');
  }

  // Check if superadmin already exists
  const existing = await User.findOne({ email, isSuperAdmin: true });
  if (existing) {
     return ;
  }
  const hashedPassword = await encodePassword(password);
  const superAdmin = new User({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    isSuperAdmin: true,
    verified: true
  });
  await superAdmin.save();

}; 