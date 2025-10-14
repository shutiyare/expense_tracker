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
    fetchDashboardData();
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
        apiClient.get(`/api/expenses?${params.toString()}`),
        apiClient.get(`/api/incomes?${params.toString()}`),
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-600 inline-flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                8% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats.balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.balance >= 0 ? "Positive" : "Negative"} balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/expenses">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions yet</p>
              <Button className="mt-4" asChild>
                <Link href="/expenses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Transaction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
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
                    <div>
                      <p className="font-medium">{transaction.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.categoryId?.icon}{" "}
                        {transaction.categoryId?.name || "Uncategorized"} •{" "}
                        {format(new Date(transaction.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-20" asChild>
            <Link href="/expenses/new">
              <div className="flex flex-col items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>Add Expense</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link href="/incomes/new">
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Add Income</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link href="/categories">
              <div className="flex flex-col items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span>Manage Categories</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link href="/reports">
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>View Reports</span>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
