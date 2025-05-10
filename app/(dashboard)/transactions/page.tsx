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
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

// Define transaction type
interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  card?: string;
}

// Category color mapping (inspired by Bank of America)
const CATEGORY_COLORS: Record<string, string> = {
  "Education": "#6a0dad",          // Purple
  "Dining": "#c0392b",             // Red
  "Groceries": "#27ae60",          // Green
  "Transportation": "#2980b9",     // Blue
  "Shopping & Entertainment": "#f39c12", // Orange
  "Health": "#1abc9c",             // Teal
  "Cash, Checks & Misc": "#d35400", // Dark Orange
  "Personal & Family Care": "#145a32", // Dark Green
  "Home & Utilities": "#2e86c1",   // Medium Blue
  "Finance": "#8e44ad",            // Violet
  "Restaurants & Dining": "#e74c3c", // Bright Red
  "Other": "#7f8c8d"               // Gray fallback
};

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCard, setFilterCard] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("All");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          console.warn("API returned invalid transactions:", data);
          setTransactions([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch transactions:", err);
        setTransactions([]);
      });
  }, []);

  // Defensive filter logic
  const filteredTransactions = Array.isArray(transactions)
    ? transactions.filter((tx) => {
        const byCard = filterCard === "All" || tx.card === filterCard;

        const byDate = (() => {
          if (filterDate === "All") return true;
          const now = new Date();
          const txDate = new Date(tx.date);
          const days = filterDate === "7" ? 7 : filterDate === "30" ? 30 : 90;
          const cutoff = new Date(now.setDate(now.getDate() - days));
          return txDate >= cutoff;
        })();

        return byCard && byDate;
      })
    : [];

  const categoryTotals = filteredTransactions.reduce<Record<string, number>>(
    (acc, tx) => {
      const category = tx.category || "Other";
      acc[category] = (acc[category] || 0) + tx.amount;
      return acc;
    },
    {}
  );

  const categoryData = Object.entries(categoryTotals).map(
    ([category, amount]) => ({
      name: category,
      value: amount,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"],
    })
  );

  const allCards = Array.from(
    new Set(transactions.map((tx) => tx.card).filter(Boolean))
  );

  // Generate dynamic monthly income/spending from real transactions
  function getMonthLabel(date: string): string {
    return new Date(date).toLocaleString("default", { month: "short" });
  }

  const monthlyMap: Record<string, { income: number; spending: number }> = {};

  transactions.forEach((tx) => {
    const month = getMonthLabel(tx.date);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, spending: 0 };
    }
    if (tx.amount >= 0) {
      monthlyMap[month].income += tx.amount;
    } else {
      monthlyMap[month].spending += Math.abs(tx.amount);
    }
  });

  const cashFlowData = Object.entries(monthlyMap).map(([month, { income, spending }]) => ({
    month,
    income,
    spending,
  }));
  
  return (
    <div className="space-y-6 p-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium">Filter by Card:</label>
          <select
            className="ml-2 border rounded px-2 py-1"
            value={filterCard}
            onChange={(e) => setFilterCard(e.target.value)}
          >
            <option value="All">All</option>
            {allCards.map((card) => (
              <option key={card} value={card}>
                {card}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Filter by Date:</label>
          <select
            className="ml-2 border rounded px-2 py-1"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="All">All Time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="relative w-[300px] h-[300px]">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-sm text-gray-500">Total Spending</div>
              <div className="text-xl font-bold">
                ${categoryData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                in {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          <PieChart width={300} height={300}>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              dataKey="value"
              label
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </CardContent>
      </Card>

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Amount</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={categoryData}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {categoryData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Shortfall/Surplus Labels */}
          <div className="mt-4 flex justify-around text-sm font-medium text-center">
            {cashFlowData.map((entry) => {
              const diff = entry.income - entry.spending;
              const isSurplus = diff >= 0;
              const label = isSurplus
                ? `Surplus $${diff.toFixed(2)}`
                : `Shortfall $${Math.abs(diff).toFixed(2)}`;
              return (
                <div key={entry.month} className={`w-20 ${isSurplus ? "text-green-600" : "text-red-600"}`}>
                  <div className="text-xs text-gray-500">{entry.month}</div>
                  {label}
                </div>
              );
            })}
          </div>

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
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{tx.name}</TableCell>
                  <TableCell>${tx.amount.toFixed(2)}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell>{tx.card || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#20B2AA" name="Income" />
              <Bar dataKey="spending" fill="#1E90FF" name="Spending" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
};

export default TransactionsPage;
