const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Categories are now owned by a user, so local seed data is attached to the
// demo user you log in as during development. Each carries an importance weight
// (bonus %) and a color used by the overview grid and contribution heatmap.
const DEMO_USER_EMAIL = "demo@lifetasker.local";
const DEMO_USER_NAME = "Demo User";

const defaultCategories = [
  { key: "TECH", name: "TECH", weightPercent: 20, color: "#6366f1" },
  { key: "SALUD", name: "SALUD", weightPercent: 15, color: "#10b981" },
  { key: "TRABAJO", name: "TRABAJO", weightPercent: 10, color: "#f59e0b" },
  { key: "FAMILIA", name: "FAMILIA", weightPercent: 0, color: "#ec4899" },
];

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
  });

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { userId_key: { userId: demoUser.id, key: category.key } },
      update: {
        name: category.name,
        weightPercent: category.weightPercent,
        color: category.color,
      },
      create: { ...category, userId: demoUser.id },
    });
  }

  console.log("Default categories seeded for the demo user.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
