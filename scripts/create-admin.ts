/**
 * Creates (or resets the password of) an admin account.
 *
 *   npm run admin:create -- --email head@example.edu --name "Event Head"
 *
 * The password is read from the ADMIN_PASSWORD environment variable if set,
 * otherwise it is prompted for interactively (input hidden). No default or
 * hard-coded password exists anywhere in the project.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { passwordPolicyError } from "../lib/auth/password-policy";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) {
    console.error('Usage: npm run admin:create -- --email you@example.edu --name "Your Name"');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden("Password: ");
    const confirm = await promptHidden("Confirm password: ");
    if (password !== confirm) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
  }
  const problem = passwordPolicyError(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { name, passwordHash, isActive: true },
      create: { email, name, passwordHash },
    });
    // Resetting a password signs the admin out everywhere.
    await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });
    console.log(`✓ admin ready: ${admin.email} (${admin.name})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
