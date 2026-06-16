import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedAdmin(): Promise<void> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "admin@aurabasebd.com"));

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@1234", 10);
  await db.insert(usersTable).values({
    name: "Admin",
    email: "admin@aurabasebd.com",
    passwordHash,
    role: "admin",
    phone: "01858406619",
    isActive: true,
  });

  logger.info("Default admin user created: admin@aurabasebd.com / Admin@1234");
}
