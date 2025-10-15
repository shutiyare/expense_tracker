"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingDown,
  Calendar,
  Loader2,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { format } from "date-fns";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes: string;
  categoryId?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/expenses");
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      setDeleteLoading(id);
      await apiClient.delete(`/api/expenses/${id}`);
      setExpenses(expenses.filter((expense) => expense._id !== id));
      toast({
        title: "Deleted!",
        description: "Expense deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.notes &&
        expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod =
      filterMethod === "all" || expense.paymentMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const paymentMethods = Array.from(
    new Set(expenses.map((e) => e.paymentMethod))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Expenses
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Track and manage your expenses
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExpenses}
            disabled={loading}
            className="hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Expenses
            </CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-600">
              ${totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {filteredExpenses.length} transaction(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Amount
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              $
              {filteredExpenses.length > 0
                ? (totalExpenses / filteredExpenses.length).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-2">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Payment Methods
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {paymentMethods.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">Different methods used</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">Expenses Table</CardTitle>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No expenses found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || filterMethod !== "all"
                  ? "Try adjusting your filters"
                  : "Click 'Add Expense' to create your first expense"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {expense.title}
                          </p>
                          {expense.notes && (
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px]">
                              {expense.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.categoryId ? (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700"
                          >
                            <span className="mr-1">
                              {expense.categoryId.icon}
                            </span>
                            {expense.categoryId.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">
                            Uncategorized
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {expense.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-lg font-semibold text-red-600">
                          ${expense.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense._id)}
                            disabled={deleteLoading === expense._id}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            {deleteLoading === expense._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          fetchExpenses();
          handleModalClose();
        }}
        expense={editingExpense}
      />
    </div>
  );
}
