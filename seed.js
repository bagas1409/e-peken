import { db } from "./src/config/db.js";
import { roles } from "./src/config/schema.js";

async function seed() {
    console.log("Seeding roles...");
    await db.insert(roles).values([
        { name: "USER" },
        { name: "UMKM" },
        { name: "ADMIN" },
    ]);
    console.log("Seeding done!");
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
