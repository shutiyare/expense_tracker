import axios from "axios";
import { getSession } from "next-auth/react";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      // Get the session from NextAuth
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Import signOut dynamically to avoid SSR issues
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: true, callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
