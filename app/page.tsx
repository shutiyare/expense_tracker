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
  RefreshCw,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { format } from "date-fns";
import { useAppData } from "@/contexts/AppDataContext";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const { stats, refreshData, loading: statsLoading } = useAppData();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [chartData, setChartData] = useState<{
    monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      balance: number;
    }>;
    categoryData: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    incomeExpenseData: Array<{
      name: string;
      amount: number;
      color: string;
    }>;
  }>({
    monthlyData: [],
    categoryData: [],
    incomeExpenseData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      // Fetch recent transactions
      const [incomesResponse, expensesResponse] = await Promise.all([
        apiClient.get("/api/incomes"),
        apiClient.get("/api/expenses"),
      ]);

      const allIncomes = incomesResponse.data.data || [];
      const allExpenses = expensesResponse.data.data || [];

      // Combine and sort by date
      const allTransactions = [
        ...allIncomes.map((income: any) => ({
          _id: income._id,
          title: income.title,
          amount: income.amount,
          date: income.date,
          categoryId: income.categoryId,
        })),
        ...allExpenses.map((expense: any) => ({
          _id: expense._id,
          title: expense.title,
          amount: -expense.amount,
          date: expense.date,
          categoryId: expense.categoryId,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecentTransactions(allTransactions.slice(0, 5));

      // Prepare chart data
      prepareChartData(allIncomes, allExpenses);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (incomes: any[], expenses: any[]) => {
    // Monthly trend data (last 6 months)
    const monthlyData = generateMonthlyData(incomes, expenses);

    // Category breakdown for expenses
    const categoryData = generateCategoryData(expenses);

    // Income vs Expense comparison
    const incomeExpenseData = generateIncomeExpenseData(incomes, expenses);

    setChartData({
      monthlyData,
      categoryData,
      incomeExpenseData,
    });
  };

  const generateMonthlyData = (incomes: any[], expenses: any[]) => {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthName = format(date, "MMM");

      const monthIncomes = incomes
        .filter((income) => {
          const incomeDate = new Date(income.date);
          return (
            incomeDate.getMonth() === date.getMonth() &&
            incomeDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, income) => sum + income.amount, 0);

      const monthExpenses = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === date.getMonth() &&
            expenseDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      months.push({
        month: monthName,
        income: monthIncomes,
        expenses: monthExpenses,
        balance: monthIncomes - monthExpenses,
      });
    }

    return months;
  };

  const generateCategoryData = (expenses: any[]) => {
    const categoryMap = new Map();

    expenses.forEach((expense) => {
      if (expense.categoryId) {
        const categoryName = expense.categoryId.name;
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + expense.amount);
      }
    });

    const colors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#8dd1e1",
      "#d084d0",
    ];

    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  const generateIncomeExpenseData = (incomes: any[], expenses: any[]) => {
    return [
      {
        name: "Income",
        amount: incomes.reduce((sum, income) => sum + income.amount, 0),
        color: "#22c55e",
      },
      {
        name: "Expenses",
        amount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        color: "#ef4444",
      },
    ];
  };

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#8dd1e1",
    "#d084d0",
  ];

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => {
              refreshData();
              fetchDashboardData();
            }}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/expenses">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Income
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
              ${stats.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-600 font-medium">This month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Expenses
            </CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
              ${stats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
              <span className="text-red-600 font-medium">This month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                stats.balance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              ${Math.abs(stats.balance).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span
                className={`font-medium ${
                  stats.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.balance >= 0 ? "Positive" : "Negative"} balance
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`,
                      name,
                    ]}
                    labelStyle={{ color: "#374151" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name} ${((percent as number) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Amount",
                    ]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Comparison */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Income vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chart-container" style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()}`,
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {chartData.incomeExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900">
              Recent Transactions
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-blue-50 text-blue-600 w-full sm:w-auto"
            >
              <Link href="/expenses">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-sm mb-4">
                Start tracking your finances by adding your first transaction
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/expenses">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Transaction
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div
                  key={transaction._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${
                        transaction.amount > 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.amount > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
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
                    className={`text-lg sm:text-xl font-bold ${
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
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Link href="/expenses">
              <div className="h-24 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-red-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-semibold text-sm text-gray-700 text-center">
                  Add Expense
                </span>
              </div>
            </Link>
            <Link href="/incomes">
              <div className="h-24 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-green-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-semibold text-sm text-gray-700 text-center">
                  Add Income
                </span>
              </div>
            </Link>
            <Link href="/categories">
              <div className="h-24 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-sm text-gray-700 text-center">
                  Categories
                </span>
              </div>
            </Link>
            <Link href="/reports">
              <div className="h-24 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-lg hover:border-purple-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold text-sm text-gray-700 text-center">
                  View Reports
                </span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
