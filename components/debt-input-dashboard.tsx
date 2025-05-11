// components/debt-input-dashboard.tsx
"use client";

import { useState } from "react";
import { useDebt } from "../contexts/DebtContext";
import { useUser } from "@clerk/nextjs";

const DEBT_TYPES = [
  "Credit Card",
  "Student Loan",
  "Personal Loan",
  "Auto Loan",
  "Mortgage",
  "Medical Debt",
  "Other",
];

export default function DebtInputDashboard() {
  const { addDebt, isLoading } = useDebt();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    balance: "",
    interestRate: "",
    minimumPayment: "",
    dueDate: "",
    extraPayment: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in to add a debt");
      return;
    }

    try {
      await addDebt({
        type: formData.type, // ← Added here
        name: formData.name || formData.type,
        balance: parseFloat(formData.balance),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment),
        dueDate: formData.dueDate, // string "YYYY-MM-DD"
        extraPayment: formData.extraPayment
          ? parseFloat(formData.extraPayment)
          : 0, // always a number
      });

      setFormData({
        type: "",
        name: "",
        balance: "",
        interestRate: "",
        minimumPayment: "",
        dueDate: "",
        extraPayment: "",
      });
    } catch (err: unknown) {
      const errorObj =
        err instanceof Error
          ? err
          : new Error(
              typeof err === "string"
                ? err
                : "Failed to add debt. Please try again."
            );
      setError(errorObj.message);
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Add New Debt</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debt Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Debt Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
            required
          >
            <option value="">Select a debt type</option>
            {DEBT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Custom Name (Optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
            placeholder="e.g., Chase Sapphire"
          />
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => {
                if (/^\d*\.?\d*$/.test(e.target.value)) {
                  setFormData({ ...formData, balance: e.target.value });
                }
              }}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  setFormData({
                    ...formData,
                    balance: v.toFixed(2),
                  });
                }
              }}
              className="w-full pl-7 h-10 pr-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interest Rate (APR)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.interestRate}
              onChange={(e) =>
                setFormData({ ...formData, interestRate: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>

        {/* Minimum Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minimum Payment
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.minimumPayment}
              onChange={(e) =>
                setFormData({ ...formData, minimumPayment: e.target.value })
              }
              className="w-full pl-7 h-10 pr-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            className="w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        {/* Extra Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Extra Monthly Payment (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.extraPayment}
              onChange={(e) =>
                setFormData({ ...formData, extraPayment: e.target.value })
              }
              className="w-full pl-7 h-10 pr-3 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Adding..." : "Add Debt"}
        </button>
      </form>
    </div>
  );
}
