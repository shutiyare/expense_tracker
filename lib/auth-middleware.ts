import { NextRequest } from "next/server";
import { getUserFromRequest } from "./auth";

export function requireAuth(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function redirectIfAuthenticated(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (user) {
    return true; // User is authenticated, should redirect
  }
  return false;
}
