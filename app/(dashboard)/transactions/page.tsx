// app/(dashboard)/transactions/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../../components/ui/table";
import {
  PieChart,
  Pie,
  Sector,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string | null;
  card?: string;
  transaction_type: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
    confidence_level: string;
  };
}

// Helper to detect payments (full & abbreviated)
const isPaymentName = (name: string) => {
  const u = name.toUpperCase();
  return u.includes("PAYMENT") || u.includes("PYMNT");
};

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCard, setFilterCard] = useState("All");
  const [filterDate, setFilterDate] = useState("All");

  // Hover state for pie
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const onPieEnter = (_: any, index: number) => setActiveIndex(index);

  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/plaid/transactions");
        const res = await fetch("/api/transactions");
        const { transactions } = await res.json();
        setTxns(transactions);
      } catch {
        setTxns([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-4 text-center">Loading…</p>;

  const isIncome = (t: Transaction) =>
    t.transaction_type !== "place" ||
    t.personal_finance_category?.primary === "INCOME";

  const filtered = txns.filter((t) => {
    const okCard = filterCard === "All" || t.card === filterCard;
    const okDate =
      filterDate === "All"
        ? true
        : new Date(t.date) >= new Date(Date.now() - Number(filterDate) * 864e5);
    return okCard && okDate;
  });

  // Totals for donut
  const totalPayment = filtered
    .filter((t) => isPaymentName(t.name))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => !isPaymentName(t.name) && !isIncome(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const pieData = [
    { name: "Expense", value: totalExpense },
    { name: "Payment", value: totalPayment },
  ];
  const PIE_COLORS = ["#7f8c8d", "#34495e"];

  // Category breakdown for bar chart
  const categoryTotals = filtered.reduce<Record<string, number>>((acc, t) => {
    if (isPaymentName(t.name)) {
      acc.Payment = (acc.Payment || 0) + t.amount;
    } else if (!isIncome(t)) {
      const cat = t.category || "Other";
      acc[cat] = (acc[cat] || 0) + t.amount;
    }
    return acc;
  }, {});
  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: PIE_COLORS[name === "Payment" ? 1 : 0],
  }));

  // Unique cards
  const allCards = Array.from(
    new Set(txns.map((t) => t.card).filter(Boolean))
  ) as string[];

  // Cash flow
  const monthly: Record<string, { income: number; spending: number }> = {};
  txns.forEach((t) => {
    const m = new Date(t.date).toLocaleString("default", { month: "short" });
    if (!monthly[m]) monthly[m] = { income: 0, spending: 0 };
    if (isIncome(t)) monthly[m].income += t.amount;
    else monthly[m].spending += t.amount;
  });
  const cashFlowData = Object.entries(monthly)
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Dynamic month/year label
  let labelMonthYear = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  if (filtered.length > 0) {
    const latest = new Date(filtered[0].date);
    labelMonthYear = latest.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6 p-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="border rounded px-2 py-1"
          value={filterCard}
          onChange={(e) => setFilterCard(e.target.value)}
        >
          <option>All</option>
          {allCards.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        >
          <option value="All">All Time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Two-slice Donut with smooth hover */}
      <Card>
        <CardHeader>
          <CardTitle>Spending vs. Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            {/* Center Text */}
            <div className="text-center">
              <div className="text-sm text-gray-500">Total Outflow</div>
              <div className="text-3xl font-bold">
                ${totalExpense.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">in {labelMonthYear}</div>
            </div>

            {/* Pie Chart */}
            <div className="w-[300px] h-[300px] relative">
              <PieChart width={300} height={300}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={(props: any) => (
                    <Sector
                      cx={props.cx}
                      cy={props.cy}
                      innerRadius={props.innerRadius}
                      outerRadius={props.outerRadius + 10}
                      startAngle={props.startAngle}
                      endAngle={props.endAngle}
                      fill={PIE_COLORS[props.index]!}
                    />
                  )}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={() => setActiveIndex(-1)}
                  labelLine={false}
                  label={({ percent }) => `${(percent! * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 16 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Amount</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="value">
                {categoryData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Card</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>${t.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {isPaymentName(t.name) ? "Payment" : t.category || "Other"}
                  </TableCell>
                  <TableCell>{t.card || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#20B2AA" />
              <Bar dataKey="spending" name="Spending" fill="#1E90FF" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
