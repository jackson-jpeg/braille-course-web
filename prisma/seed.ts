import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.section.upsert({
    where: { label: 'Section A' },
    update: {},
    create: { label: 'Section A', maxCapacity: 5 },
  });

  await prisma.section.upsert({
    where: { label: 'Section B' },
    update: {},
    create: { label: 'Section B', maxCapacity: 5 },
  });

  console.log('Seeded Section A and Section B');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
