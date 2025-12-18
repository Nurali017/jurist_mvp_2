import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@jurist.kz' },
    update: {},
    create: {
      email: 'admin@jurist.kz',
      passwordHash,
      fullName: 'Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
