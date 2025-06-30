import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetTestPasswords() {
  console.log('🔄 Resetting test user passwords...');
  
  const testUsers = [
    { email: 'student@fau.edu', password: 'student123' },
    { email: 'pizza@fau.edu', password: 'restaurant123' },
    { email: 'admin@biteclub.com', password: 'admin123' }
  ];
  
  for (const testUser of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const updatedUser = await prisma.user.update({
        where: { email: testUser.email },
        data: { passwordHash: hashedPassword },
        select: { email: true, role: true }
      });
      
      console.log(`✅ Updated password for ${updatedUser.email} (${updatedUser.role})`);
    } catch (error) {
      console.error(`❌ Failed to update ${testUser.email}:`, error);
    }
  }
  
  console.log('\n🎉 Test user passwords updated!');
  console.log('You can now login with:');
  console.log('  - Student: student@fau.edu / student123');
  console.log('  - Restaurant: pizza@fau.edu / restaurant123');
  console.log('  - Admin: admin@biteclub.com / admin123');
  
  await prisma.$disconnect();
}

resetTestPasswords().catch(console.error);