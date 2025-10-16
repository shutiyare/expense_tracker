"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/axios";

interface AppStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency: string;
}

interface AppDataContextType {
  stats: AppStats;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AppStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    currency: "USD",
  });
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch both incomes and expenses in parallel for better performance
      const [incomesResponse, expensesResponse] = await Promise.all([
        apiClient.get("/api/incomes").catch((err) => {
          console.error("Error fetching incomes:", err);
          return { data: { data: [] } };
        }),
        apiClient.get("/api/expenses").catch((err) => {
          console.error("Error fetching expenses:", err);
          return { data: { data: [] } };
        }),
      ]);

      const incomes = incomesResponse.data.data || [];
      const expenses = expensesResponse.data.data || [];

      // Calculate totals efficiently
      const totalIncome = incomes.reduce(
        (sum: number, income: any) => sum + (income.amount || 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum: number, expense: any) => sum + (expense.amount || 0),
        0
      );

      const balance = totalIncome - totalExpenses;

      setStats({
        totalIncome,
        totalExpenses,
        balance,
        currency: "USD",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default values on error
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        currency: "USD",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchStats();
  };

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  return (
    <AppDataContext.Provider value={{ stats, loading, refreshData }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
