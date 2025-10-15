"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Tag,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Incomes", href: "/incomes", icon: TrendingUp },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-gradient-to-b from-white to-blue-50/30 shadow-lg">
        <div className="flex h-16 items-center border-b border-blue-100 px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ExpenseTracker
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-blue-100 p-4 space-y-3">
          {session?.user && (
            <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 h-16 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 z-50 flex items-center justify-between px-4 shadow-sm">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Wallet className="h-5 w-5 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ExpenseTracker
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 bg-background/80 backdrop-blur-sm">
            <div className="fixed left-0 top-16 bottom-0 w-64 border-r bg-card p-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="absolute bottom-4 left-4 right-4 space-y-3">
                {session?.user && (
                  <div className="px-3 py-2 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
