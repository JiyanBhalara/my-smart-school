// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error:  "/login",
    newUser: "/onboarding",   // ← send new OAuth users here
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user?.password) throw new Error("Invalid credentials");
        const valid = await compare(creds.password, user.password);
        if (!valid) throw new Error("Invalid credentials");
        return user;
      },
    }),
  ],

  callbacks: {
    // 1️⃣ On sign-in, copy user.id into token.id
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // 2️⃣ Make token.id available as session.user.id
    async session({ session, token }) {
    if (!session.user) {
      // this should never happen, but keep TS happy
      throw new Error("No user in session");
    }
    session.user.id = token.id as string;
    return session;
  },
    // 3️⃣ Always redirect back to app root (or override as needed)
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
