// NextAuth credentials configuration and API authorization helpers.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations/auth";

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.avatarUrl,
    role: user.role
  };
}

export { hashPassword, verifyPassword };

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? "local-development-auth-secret-change-me" : undefined),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user) return null;
        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return publicUser(user);
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role?: Role }).role ?? "MEMBER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = (token.role as Role) ?? "MEMBER";
      }
      return session;
    }
  }
});

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(roles?: Role[]) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new ApiAuthError("Authentication required.", 401);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiAuthError("Authentication required.", 401);
  if (roles && !roles.includes(user.role)) throw new ApiAuthError("Insufficient permissions.", 403);
  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
