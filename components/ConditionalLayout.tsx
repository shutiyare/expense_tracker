"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Loader2 } from "lucide-react";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Pages that should not have the navbar and sidebar padding
  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 relative">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-16">
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 w-full max-w-none lg:max-w-7xl lg:mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
