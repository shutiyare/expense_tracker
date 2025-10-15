"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { format } from "date-fns";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId?: {
    name: string;
    icon: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    currency: "USD",
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if we have a valid session
    const fetchData = async () => {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if (session) {
        fetchDashboardData();
      }
    };
    fetchData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch current month's data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
      });

      const [expensesRes, incomesRes] = await Promise.all([
        apiClient.get(`/api/expenses?${params.toString()}`).catch((err) => {
          console.error("Error fetching expenses:", err);
          return { data: { expenses: [] } };
        }),
        apiClient.get(`/api/incomes?${params.toString()}`).catch((err) => {
          console.error("Error fetching incomes:", err);
          return { data: { incomes: [] } };
        }),
      ]);

      const expenses = expensesRes.data.expenses || [];
      const incomes = incomesRes.data.incomes || [];

      const totalExpenses = expenses.reduce(
        (sum: number, expense: Transaction) => sum + expense.amount,
        0
      );
      const totalIncome = incomes.reduce(
        (sum: number, income: Transaction) => sum + income.amount,
        0
      );
      const balance = totalIncome - totalExpenses;

      setStats({
        totalIncome,
        totalExpenses,
        balance,
        currency: "USD",
      });

      // Get recent transactions (mix of expenses and incomes)
      const allTransactions = [
        ...expenses.map((expense: Transaction) => ({
          ...expense,
          type: "expense",
          amount: -expense.amount,
        })),
        ...incomes.map((income: Transaction) => ({
          ...income,
          type: "income",
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentTransactions(allTransactions);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 md:space-y-8 p-4 md:p-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base lg:text-lg">
              Welcome back! Here's your financial overview.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Income
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                ${stats.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-green-600 inline-flex items-center font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  This month
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Expenses
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-red-600">
                ${stats.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-red-600 inline-flex items-center font-medium">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  This month
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Balance
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl md:text-3xl font-bold ${
                  stats.balance >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                ${Math.abs(stats.balance).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span
                  className={`${
                    stats.balance >= 0 ? "text-green-600" : "text-red-600"
                  } font-medium`}
                >
                  {stats.balance >= 0 ? "Positive" : "Negative"} balance
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-xl md:text-2xl text-gray-900">
                Recent Transactions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-blue-50 text-blue-600"
              >
                <Link href="/expenses">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions yet</p>
                <Link href="/expenses">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <div
                    key={transaction._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-accent transition-all duration-200 hover:shadow-md hover:scale-[1.01] animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.amount > 0
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {transaction.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {transaction.categoryId?.icon}{" "}
                          {transaction.categoryId?.name || "Uncategorized"} •{" "}
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-base sm:text-lg font-semibold ${
                        transaction.amount > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}$
                      {Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <Link href="/expenses">
              <div className="h-20 md:h-24 p-3 md:p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-red-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-1 md:gap-2 group">
                <div className="p-1.5 md:p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </div>
                <span className="font-semibold text-xs md:text-sm text-gray-700 text-center">
                  Add Expense
                </span>
              </div>
            </Link>
            <Link href="/incomes">
              <div className="h-20 md:h-24 p-3 md:p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-green-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-1 md:gap-2 group">
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <span className="font-semibold text-xs md:text-sm text-gray-700 text-center">
                  Add Income
                </span>
              </div>
            </Link>
            <Link href="/categories">
              <div className="h-20 md:h-24 p-3 md:p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-1 md:gap-2 group">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                  <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-xs md:text-sm text-gray-700 text-center">
                  Categories
                </span>
              </div>
            </Link>
            <Link href="/reports">
              <div className="h-20 md:h-24 p-3 md:p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-1 md:gap-2 group">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-xs md:text-sm text-gray-700 text-center">
                  View Reports
                </span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
