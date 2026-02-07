import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { env } from "~/env";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [admin()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
