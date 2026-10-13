const { seedDatabase } = require("../src/lib/seed.ts");
seedDatabase()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
