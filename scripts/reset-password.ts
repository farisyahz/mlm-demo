import { db } from "~/server/db";
import { user, account } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hash password using scrypt (same as Better Auth)
 * Format: {hash}.{salt} (both in hex)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt.toString("hex")}`;
}

async function resetPassword() {
  // Get email and password from command line arguments
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: bun run scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  try {
    console.log(`Looking for user with email: ${email}`);

    // Find user by email
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!foundUser) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`Found user: ${foundUser.name} (ID: ${foundUser.id})`);

    // Find the account record for this user
    const userAccount = await db.query.account.findFirst({
      where: eq(account.userId, foundUser.id),
    });

    if (!userAccount) {
      console.error(`Account record not found for user ${email}`);
      process.exit(1);
    }

    console.log(`Found account record (ID: ${userAccount.id})`);

    // Hash the new password
    console.log("Hashing new password...");
    const hashedPassword = await hashPassword(newPassword);

    // Update the password in the account table
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(account.id, userAccount.id));

    console.log(`✅ Password successfully reset for ${email}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  }
}

resetPassword()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
