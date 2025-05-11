"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import type { payments as PrismaPayment } from "@prisma/client";

import type { debt as PrismaDebt } from "@prisma/client"; 

// Local types
export interface Payment {
  id: string;
  debtId: string;
  userId?: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Debt
  extends Omit<
    PrismaDebt,
    | "interestRate"
    | "balance"
    | "currentBalance"
    | "minimumPayment"
    | "extraPayment"
    | "dueDate"
  > {
  type: string;
  name: string;
  interestRate: number;
  balance: number;
  currentBalance: number;
  minimumPayment: number;
  extraPayment: number;
  dueDate: string;
  payments?: Payment[];
}

interface DebtContextType {
  debts: Debt[];
  addDebt: (
    debt: Pick<
      Debt,
      | "type"
      | "name"
      | "balance"
      | "interestRate"
      | "minimumPayment"
      | "dueDate"
      | "extraPayment"
    >
  ) => Promise<void>;
  isLoading: boolean;
  fetchDebts: () => Promise<void>;
  error: string | null;
  setDebts: (debts: Debt[]) => void;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

// Helper: normalize raw PrismaDebt and payments
const normalizeDebt = (
  raw: PrismaDebt & { payments?: PrismaPayment[] }
): Debt => ({
  ...raw,
  type: raw.type ?? "",
  interestRate: raw.interestRate.toNumber(),
  balance: raw.balance.toNumber(),
  currentBalance: raw.currentBalance.toNumber(),
  minimumPayment: raw.minimumPayment.toNumber(),
  extraPayment: raw.extraPayment?.toNumber() ?? 0,
  dueDate: raw.dueDate.toISOString().split("T")[0],
  payments: raw.payments?.map((p) => ({
    id: p.id.toString(),
    debtId: p.debtId.toString(),
    userId: p.userId?.toString(),
    amount: p.amount.toNumber(),
    date: p.date?.toISOString().split("T")[0] ?? "",
    notes: p.notes ?? "",
  }))
  ,
});

export function DebtProvider({ children }: { children: ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded: isUserLoaded } = useUser();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDebts = async () => {
    if (!user) {
      setDebts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debts");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch debts");
      }
      const data: (PrismaDebt & { payments?: PrismaPayment[] })[] =
        await res.json();
      setDebts(data.map(normalizeDebt));
    } catch (err) {
      console.error("Error fetching debts:", err);
      setError(err instanceof Error ? err.message : "Failed to load debts.");
      setDebts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && isUserLoaded) {
      if (user) fetchDebts();
      else {
        setDebts([]);
        setIsLoading(false);
      }
    }
  }, [user, isUserLoaded, mounted]);

  const addDebt = async (
    newDebt: Pick<
      Debt,
      | "type"
      | "name"
      | "balance"
      | "interestRate"
      | "minimumPayment"
      | "dueDate"
      | "extraPayment"
    >
  ) => {
    if (!user) throw new Error("User must be authenticated");

    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDebt),
      });
      if (!res.ok) throw new Error("Failed to add debt");
      const added: PrismaDebt & { payments?: PrismaPayment[] } =
        await res.json();
      setDebts((prev) => {
        const normalized = normalizeDebt(added);
        const exists = prev.some((d) => d.id === normalized.id);
        return exists
          ? prev.map((d) => (d.id === normalized.id ? normalized : d))
          : [...prev, normalized];
      });
    } catch (err) {
      console.error("Error adding debt:", err);
      throw err;
    }
  };

  if (!mounted) return null;

  return (
    <DebtContext.Provider
      value={{ debts, addDebt, isLoading, fetchDebts, error, setDebts }}
    >
      {children}
    </DebtContext.Provider>
  );
}

export function useDebt() {
  const context = useContext(DebtContext);
  if (!context) throw new Error("useDebt must be used within DebtProvider");
  return context;
}
