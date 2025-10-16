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
  TrendingUp,
  Calendar,
  Loader2,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { format } from "date-fns";
import { IncomeModal } from "@/components/modals/IncomeModal";
import { useToast } from "@/hooks/use-toast";

interface Income {
  _id: string;
  title: string;
  amount: number;
  source: string;
  date: string;
  notes: string;
  categoryId?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/incomes");
      setIncomes(response.data.data || []);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch incomes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      await apiClient.delete(`/api/incomes/${id}`);
      setIncomes(incomes.filter((income) => income._id !== id));
      toast({
        title: "Success",
        description: "Income deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingIncome(null);
    fetchIncomes();
  };

  const filteredIncomes = incomes.filter((income) => {
    const matchesSearch =
      income.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterSource === "all" || income.source === filterSource;
    return matchesSearch && matchesFilter;
  });

  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const incomeSources = [...new Set(incomes.map((income) => income.source))];

  const getSourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      salary: "bg-blue-100 text-blue-800",
      freelance: "bg-green-100 text-green-800",
      business: "bg-purple-100 text-purple-800",
      investment: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[source.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Incomes
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Track and manage your income sources
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={fetchIncomes}
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
          <Button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Income
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
              ${totalIncomes.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From {incomes.length} income source
              {incomes.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Amount
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
              $
              {incomes.length > 0
                ? (totalIncomes / incomes.length).toLocaleString()
                : "0"}
            </div>
            <p className="text-xs text-gray-500 mt-2">Per income source</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Income Sources
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
              {incomeSources.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">Unique sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search incomes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {incomeSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">Incomes Table</CardTitle>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredIncomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No incomes found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || filterSource !== "all"
                  ? "Try adjusting your filters"
                  : "Click 'Add Income' to create your first income"}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-auto min-w-[120px]">
                        Title
                      </TableHead>
                      <TableHead className="hidden sm:table-cell w-auto">
                        Category
                      </TableHead>
                      <TableHead className="hidden md:table-cell w-auto">
                        Source
                      </TableHead>
                      <TableHead className="hidden lg:table-cell w-auto">
                        Date
                      </TableHead>
                      <TableHead className="text-right w-auto min-w-[80px]">
                        Amount
                      </TableHead>
                      <TableHead className="text-right w-auto min-w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomes.map((income) => (
                      <TableRow key={income._id}>
                        <TableCell className="font-medium max-w-[120px]">
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-gray-900 text-sm truncate"
                              title={income.title}
                            >
                              {income.title}
                            </p>
                            {income.notes && (
                              <p
                                className="text-xs text-gray-500 mt-1 truncate"
                                title={income.notes}
                              >
                                {income.notes}
                              </p>
                            )}
                            {/* Mobile-only info */}
                            <div className="sm:hidden mt-2 space-y-1">
                              {income.categoryId && (
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-700 text-xs truncate max-w-[100px]"
                                >
                                  <span className="mr-1">
                                    {income.categoryId.icon}
                                  </span>
                                  <span className="truncate">
                                    {income.categoryId.name}
                                  </span>
                                </Badge>
                              )}
                              <div className="text-xs text-gray-500">
                                {format(new Date(income.date), "MMM dd")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[100px]">
                          {income.categoryId ? (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-700 text-xs truncate"
                              title={income.categoryId.name}
                            >
                              <span className="mr-1">
                                {income.categoryId.icon}
                              </span>
                              <span className="truncate">
                                {income.categoryId.name}
                              </span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-gray-400 text-xs"
                            >
                              Uncategorized
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[80px]">
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {income.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-600 text-xs">
                          {format(new Date(income.date), "MMM dd")}
                        </TableCell>
                        <TableCell className="text-right min-w-[80px]">
                          <span className="text-sm sm:text-base font-semibold text-green-600">
                            ${income.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right min-w-[100px]">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(income)}
                              className="hover:bg-blue-50 hover:text-blue-600 h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(income._id)}
                              disabled={deleteLoading === income._id}
                              className="hover:bg-red-50 hover:text-red-600 h-7 w-7 p-0"
                            >
                              {deleteLoading === income._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <IncomeModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleModalSuccess}
        income={editingIncome}
      />
    </div>
  );
}
