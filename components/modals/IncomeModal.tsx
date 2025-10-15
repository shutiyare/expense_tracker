"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import apiClient from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

interface IncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  income?: any; // For editing existing income
}

export function IncomeModal({
  open,
  onOpenChange,
  onSuccess,
  income,
}: IncomeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    source: "salary",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (income) {
        setFormData({
          title: income.title || "",
          amount: income.amount?.toString() || "",
          source: income.source || "salary",
          categoryId: income.categoryId?._id || income.categoryId || "",
          date: income.date
            ? new Date(income.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          notes: income.notes || "",
        });
      } else {
        resetForm();
      }
    }
  }, [open, income]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/categories?type=income");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      source: "salary",
      categoryId: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (income) {
        await apiClient.put(`/api/incomes/${income._id}`, submitData);
        toast({
          title: "Success!",
          description: "Income updated successfully.",
        });
      } else {
        await apiClient.post("/api/incomes", submitData);
        toast({
          title: "Success!",
          description: "Income created successfully.",
        });
      }

      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          `Failed to ${income ? "update" : "create"} income`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {income ? "Edit Income" : "Add New Income"}
          </DialogTitle>
          <DialogDescription>
            {income
              ? "Update your income details below."
              : "Fill in the details to record a new income."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-green-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Monthly Salary"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-green-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Income Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData({ ...formData, source: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">💼 Salary</SelectItem>
                  <SelectItem value="freelance">💻 Freelance</SelectItem>
                  <SelectItem value="investment">📈 Investment</SelectItem>
                  <SelectItem value="gift">🎁 Gift</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Additional notes (optional)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={loading}
              className="transition-all focus:ring-2 focus:ring-green-500"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {income ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {income ? "Update Income" : "Create Income"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
