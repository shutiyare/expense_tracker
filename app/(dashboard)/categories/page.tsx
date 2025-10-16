"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Tag,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import apiClient from "@/lib/axios";

interface Category {
  _id: string;
  name: string;
  type: "expense" | "income";
  color: string;
  icon: string;
  createdAt: string;
}

const PREDEFINED_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6366f1", // indigo
  "#84cc16", // lime
];

const PREDEFINED_ICONS = [
  "🏠",
  "🍔",
  "🚗",
  "💊",
  "🎬",
  "🛒",
  "📚",
  "🏃",
  "💻",
  "✈️",
  "🎮",
  "👕",
  "💄",
  "🔧",
  "📱",
  "🎵",
  "📺",
  "🏥",
  "🎯",
  "💡",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "expense" | "income",
    color: "#6366f1",
    icon: "📁",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/categories");
      // API returns { categories: [...], cached: boolean }
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingCategory) {
        await apiClient.put(`/api/categories/${editingCategory._id}`, formData);
      } else {
        await apiClient.post("/api/categories", formData);
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: "", type: "expense", color: "#6366f1", icon: "📁" });
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Failed to save category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await apiClient.delete(`/api/categories/${id}`);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "", type: "expense", color: "#6366f1", icon: "📁" });
  };

  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Organize your expenses and incomes with custom categories.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-2 border-purple-200 shadow-xl animate-slide-in">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Groceries"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Category Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "expense" | "income") =>
                      setFormData({ ...formData, type: value })
                    }
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-10 gap-2">
                  {PREDEFINED_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`p-2 text-lg border rounded hover:bg-accent ${
                        formData.icon === icon ? "ring-2 ring-primary" : ""
                      }`}
                      disabled={formLoading}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                        formData.color === color ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={formLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Tag className="mr-2 h-4 w-4" />
                      {editingCategory ? "Update Category" : "Create Category"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expense Categories */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl">
              Expense Categories ({expenseCategories.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategories.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No expense categories
              </h3>
              <p className="text-muted-foreground">
                Create categories to organize your expenses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {expenseCategories.map((category, index) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] animate-fade-in-up min-w-0"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">Expense</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Categories */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl">
              Income Categories ({incomeCategories.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeCategories.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No income categories
              </h3>
              <p className="text-muted-foreground">
                Create categories to organize your income sources.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {incomeCategories.map((category, index) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] animate-fade-in-up min-w-0"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">Income</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
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
