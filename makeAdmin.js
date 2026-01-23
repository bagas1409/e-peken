import { db } from "./src/config/db.js";
import { users, roles, userRoles } from "./src/config/schema.js";
import { eq } from "drizzle-orm";

const email = process.argv[2];

if (!email) {
    console.error("❌ Harap masukkan email: node makeAdmin.js email@contoh.com");
    process.exit(1);
}

async function run() {
    console.log(`🔍 Mencari user: ${email}...`);

    // 1. Cari User
    const userResults = await db.select().from(users).where(eq(users.email, email));
    const user = userResults[0];

    if (!user) {
        console.error("❌ User tidak ditemukan! Pastikan user sudah register.");
        process.exit(1);
    }

    // 2. Cari Role ADMIN
    const roleResults = await db.select().from(roles).where(eq(roles.name, "ADMIN"));
    const adminRole = roleResults[0];

    if (!adminRole) {
        console.error("❌ Role ADMIN tidak ditemukan! Jalankan 'node seed.js' dulu.");
        process.exit(1);
    }

    // 3. Update Role User
    console.log(`🔄 Mengubah ${user.name} menjadi ADMIN...`);

    await db.update(userRoles)
        .set({ roleId: adminRole.id })
        .where(eq(userRoles.userId, user.id));

    console.log("✅ SUKSES! User sekarang sudah jadi ADMIN.");
    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Terjadi error:", err);
    process.exit(1);
});
