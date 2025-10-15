"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Loader2,
  Download,
  Filter,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId?: {
    _id: string;
    name: string;
    color: string;
  };
}

interface Income {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId?: {
    _id: string;
    name: string;
    color: string;
  };
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: any; // Add index signature for Recharts compatibility
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#84cc16",
];

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("current_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, [dateRange, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (dateRange === "custom") {
        if (startDate && endDate) {
          params.append("startDate", startDate);
          params.append("endDate", endDate);
        }
      } else {
        const now = new Date();
        let start, end;

        switch (dateRange) {
          case "current_month":
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
          case "last_month":
            start = startOfMonth(subMonths(now, 1));
            end = endOfMonth(subMonths(now, 1));
            break;
          case "last_3_months":
            start = startOfMonth(subMonths(now, 3));
            end = endOfMonth(now);
            break;
          default:
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        params.append("startDate", start.toISOString().split("T")[0]);
        params.append("endDate", end.toISOString().split("T")[0]);
      }

      const [expensesRes, incomesRes] = await Promise.all([
        apiClient.get(`/api/expenses?${params.toString()}`),
        apiClient.get(`/api/incomes?${params.toString()}`),
      ]);

      setExpenses(expensesRes.data.expenses || []);
      setIncomes(incomesRes.data.incomes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const balance = totalIncomes - totalExpenses;

  // Group expenses by category
  const expenseByCategory: CategoryData[] = expenses.reduce((acc, expense) => {
    const categoryName = expense.categoryId?.name || "Uncategorized";
    const existing = acc.find((item) => item.name === categoryName);

    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({
        name: categoryName,
        value: expense.amount,
        color: expense.categoryId?.color || "#6366f1",
      });
    }

    return acc;
  }, [] as CategoryData[]);

  // Group incomes by category
  const incomeByCategory: CategoryData[] = incomes.reduce((acc, income) => {
    const categoryName = income.categoryId?.name || "Uncategorized";
    const existing = acc.find((item) => item.name === categoryName);

    if (existing) {
      existing.value += income.amount;
    } else {
      acc.push({
        name: categoryName,
        value: income.amount,
        color: income.categoryId?.color || "#22c55e",
      });
    }

    return acc;
  }, [] as CategoryData[]);

  // Monthly data for line chart
  const monthlyData = expenses.reduce((acc, expense) => {
    const month = format(new Date(expense.date), "MMM");
    const existing = acc.find((item) => item.month === month);

    if (existing) {
      existing.expenses += expense.amount;
    } else {
      acc.push({
        month,
        expenses: expense.amount,
        incomes: 0,
      });
    }

    return acc;
  }, [] as { month: string; expenses: number; incomes: number }[]);

  // Add income data to monthly data
  incomes.forEach((income) => {
    const month = format(new Date(income.date), "MMM");
    const existing = monthlyData.find((item) => item.month === month);

    if (existing) {
      existing.incomes += income.amount;
    } else {
      monthlyData.push({
        month,
        expenses: 0,
        incomes: income.amount,
      });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your financial data with detailed reports and charts.
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value);
                if (value !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <>
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncomes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {incomes.length} income{incomes.length !== 1 ? "s" : ""} recorded
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
              ${totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}{" "}
              recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? "Positive" : "Negative"} balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, ""]} />
                <Line
                  type="monotone"
                  dataKey="incomes"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
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
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No expense data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="space-y-3">
                {expenseByCategory
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${category.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {((category.value / totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No expense categories found
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Income Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <div className="space-y-3">
                {incomeByCategory
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${category.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {((category.value / totalIncomes) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No income categories found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
