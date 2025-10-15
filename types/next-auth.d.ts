import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      currency: string;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    currency: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    currency: string;
    accessToken: string;
  }
}
