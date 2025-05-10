"use client";

import { useState } from "react";
import { useDebt } from "../contexts/DebtContext";
import { useUser } from '@clerk/nextjs';

const DEBT_TYPES = [
    "Credit Card",
    "Student Loan",
    "Personal Loan",
    "Auto Loan",
    "Mortgage",
    "Medical Debt",
    "Other"
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
            setError('You must be logged in to add a debt');
            return;
        }

        try {
            // Use the context's addDebt method directly
            await addDebt({
                name: formData.name || formData.type,
                balance: parseFloat(formData.balance),
                interestRate: parseFloat(formData.interestRate),
                minimumPayment: parseFloat(formData.minimumPayment),
                dueDate: new Date(formData.dueDate),
                extraPayment: formData.extraPayment ? parseFloat(formData.extraPayment) : null,
                type: formData.type,
            });

            // Reset form
            setFormData({
                type: "",
                name: "",
                balance: "",
                interestRate: "",
                minimumPayment: "",
                dueDate: "",
                extraPayment: "",
            });
        } catch (err) {
            setError(err.message || 'Failed to add debt. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Add New Debt</h2>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Debt Type
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="block w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    >
                        <option value="">Select a debt type</option>
                        {DEBT_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Custom Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="e.g., Chase Sapphire, Wells Fargo Student Loan"
                    />
                </div>

                <div className="space-y-2">
                    <div>
                        <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                            Balance
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="balance"
                                name="balance"
                                value={formData.balance}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow numbers and one decimal point
                                    if (/^\d*\.?\d*$/.test(value)) {
                                        setFormData({ ...formData, balance: value });
                                    }
                                }}
                                onBlur={(e) => {
                                    // Format to 2 decimal places when focus is lost
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value)) {
                                        setFormData({ ...formData, balance: value.toFixed(2) });
                                    }
                                }}
                                className="block w-full h-10 pl-7 pr-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Interest Rate (APR)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            value={formData.interestRate}
                            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                            className="block w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Minimum Payment
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            value={formData.minimumPayment}
                            onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                            className="block w-full h-10 pl-7 pr-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Due Date
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="block w-full h-10 pl-10 pr-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Select the date your payment is due each month
                        </p>
                        {formData.dueDate && (
                            <p className="mt-1 text-xs text-indigo-600">
                                Next payment due: {new Date(formData.dueDate + 'T00:00:00').toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Extra Monthly Payment (Optional)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            value={formData.extraPayment}
                            onChange={(e) => setFormData({ ...formData, extraPayment: e.target.value })}
                            className="block w-full h-10 pl-7 pr-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isLoading ? 'Adding...' : 'Add Debt'}
                </button>
            </form>
        </div>
    );
} 