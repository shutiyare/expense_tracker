"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const { data: session, status } = useSession();
  const { stats, loading: statsLoading } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (status === "loading") {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-blue-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-blue-200 rounded animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-blue-200 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-16 bg-gradient-to-r from-blue-50/95 to-indigo-50/95 border-b border-blue-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-64 z-50 backdrop-blur-md shadow-lg min-w-0">
      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden hover:bg-gray-100 h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <div className="hidden lg:flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ExpenseTracker
            </span>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile, visible on larger screens */}
        <div className="hidden xl:flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-blue-200 rounded-lg bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Quick Stats - Hidden on mobile and tablet */}
        <div className="hidden xl:flex items-center space-x-4">
          {statsLoading ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-sm font-medium text-gray-400">
                  Loading...
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                <span className="text-sm font-medium text-gray-400">
                  Loading...
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  +${stats.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  -${stats.totalExpenses.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 sm:h-10 sm:w-10 p-0"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-xs"
          >
            3
          </Badge>
        </Button>

        {/* User Avatar & Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
            >
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-gray-200">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}`}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs sm:text-sm">
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {getGreeting()}! 👋
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
