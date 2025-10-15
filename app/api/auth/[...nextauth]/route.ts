import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Connect to database
          await connectDB();

          // Find user
          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user) {
            console.error("User not found:", credentials.email);
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            console.error("Invalid password for user:", credentials.email);
            return null;
          }

          // Generate a JWT token for API authentication
          const token = jwt.sign(
            { 
              userId: user._id.toString(),
              email: user.email 
            },
            process.env.JWT_SECRET || "fallback-secret",
            { expiresIn: "7d" }
          );

          // Return user object for NextAuth
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            currency: user.currency,
            accessToken: token, // Store the JWT token
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.currency = (user as any).currency;
        token.accessToken = (user as any).accessToken; // Store accessToken in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).currency = token.currency;
        (session as any).accessToken = token.accessToken; // Expose accessToken in session
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email);
    },
    async signOut({ token, session }) {
      console.log("User signed out");
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
