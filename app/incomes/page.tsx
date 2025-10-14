"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { format } from "date-fns";

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
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/incomes");
      setIncomes(response.data.incomes || []);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income?")) return;

    try {
      setDeleteLoading(id);
      await apiClient.delete(`/api/incomes/${id}`);
      setIncomes(incomes.filter((income) => income._id !== id));
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("Failed to delete income");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredIncomes = incomes.filter((income) => {
    const matchesSearch =
      income.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource =
      filterSource === "all" || income.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);

  const getSourceColor = (source: string) => {
    const colors = {
      salary: "bg-green-100 text-green-800",
      freelance: "bg-blue-100 text-blue-800",
      investment: "bg-purple-100 text-purple-800",
      gift: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[source as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading incomes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incomes</h1>
          <p className="text-muted-foreground mt-1">
            Track your income sources and earnings.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/incomes/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Link>
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ${totalIncomes.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {incomes.length} income source{incomes.length !== 1 ? "s" : ""}{" "}
            recorded
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search incomes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Sources</option>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="investment">Investment</option>
              <option value="gift">Gift</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Incomes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Incomes ({filteredIncomes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No incomes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterSource !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Start tracking your income by adding your first income source."}
              </p>
              <Button asChild>
                <Link href="/incomes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Income
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncomes.map((income) => (
                <div
                  key={income._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {income.title}
                        </h3>
                        {income.categoryId && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: income.categoryId.color + "20",
                              color: income.categoryId.color,
                            }}
                          >
                            {income.categoryId.icon} {income.categoryId.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(income.date), "MMM dd, yyyy")}
                        </div>
                        <Badge
                          className={`text-xs ${getSourceColor(income.source)}`}
                        >
                          {income.source}
                        </Badge>
                      </div>
                      {income.notes && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {income.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        +${income.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/incomes/edit/${income._id}`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(income._id)}
                        disabled={deleteLoading === income._id}
                      >
                        {deleteLoading === income._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
