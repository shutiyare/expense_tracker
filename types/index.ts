// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  _id: string;
  userId: string;
  name: string;
  type: "expense" | "income";
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

// Expense Types
export interface Expense {
  _id: string;
  userId: string;
  categoryId?: Category | string;
  title: string;
  amount: number;
  paymentMethod: "cash" | "card" | "mobile_money" | "bank_transfer" | "other";
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDTO {
  categoryId?: string;
  title: string;
  amount: number;
  paymentMethod?: "cash" | "card" | "mobile_money" | "bank_transfer" | "other";
  date?: string;
  notes?: string;
}

// Income Types
export interface Income {
  _id: string;
  userId: string;
  categoryId?: Category | string;
  title: string;
  amount: number;
  source: "salary" | "freelance" | "investment" | "gift" | "other";
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeDTO {
  categoryId?: string;
  title: string;
  amount: number;
  source?: "salary" | "freelance" | "investment" | "gift" | "other";
  date?: string;
  notes?: string;
}

// Auth Types
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    currency: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency: string;
}

// Transaction (Union of Expense and Income)
export type Transaction = (Expense | Income) & {
  type: "expense" | "income";
};
