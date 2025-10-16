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

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expense?: any; // For editing existing expense
}

export function ExpenseModal({
  open,
  onOpenChange,
  onSuccess,
  expense,
}: ExpenseModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    paymentMethod: "cash",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (expense) {
        setFormData({
          title: expense.title || "",
          amount: expense.amount?.toString() || "",
          paymentMethod: expense.paymentMethod || "cash",
          categoryId: expense.categoryId?._id || expense.categoryId || "",
          date: expense.date
            ? new Date(expense.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          notes: expense.notes || "",
        });
      } else {
        resetForm();
      }
    }
  }, [open, expense]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/categories?type=expense");
      // API returns { categories: [...], cached: boolean }
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      paymentMethod: "cash",
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

      if (expense) {
        await apiClient.put(`/api/expenses/${expense._id}`, submitData);
        toast({
          title: "Success!",
          description: "Expense updated successfully.",
        });
      } else {
        await apiClient.post("/api/expenses", submitData);
        toast({
          title: "Success!",
          description: "Expense created successfully.",
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
          `Failed to ${expense ? "update" : "create"} expense`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {expense
              ? "Update your expense details below."
              : "Fill in the details to record a new expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Grocery Shopping"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
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
                className="transition-all focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">
                    🏦 Bank Transfer
                  </SelectItem>
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
                className="transition-all focus:ring-2 focus:ring-red-500"
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
              className="transition-all focus:ring-2 focus:ring-red-500"
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
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {expense ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {expense ? "Update Expense" : "Create Expense"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
