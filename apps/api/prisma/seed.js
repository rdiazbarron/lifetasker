const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  { key: 'TECH', name: 'TECH' },
  { key: 'SALUD', name: 'SALUD' },
  { key: 'TRABAJO', name: 'TRABAJO' },
  { key: 'FAMILIA', name: 'FAMILIA' },
];

async function main() {
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { key: category.key },
      update: { name: category.name },
      create: category,
    });
  }

  console.log('Default categories seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
