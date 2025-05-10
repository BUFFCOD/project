"use client";

import { useState, useEffect } from "react";
import { useDebt } from "../contexts/DebtContext";

interface Debt {
    id: string;
    userId: string;
    name: string;
    balance: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
    dueDate: string;
    extraPayment?: number;
    payments?: Payment[];
}

interface Payment {
    id: string;
    debtId: string;
    userId: string;
    amount: number;
    date: string;
    notes?: string;
}

interface PaymentPlan {
    debtId: string;
    debtName: string;
    balance: number;
    monthlyPayment: number;
    monthsToPayoff: number;
    totalInterest: number;
}

type PaymentStrategy = "avalanche" | "snowball" | "highest-payment" | "custom";

export default function MonthlyPaymentPlanner() {
    const { debts, isLoading, fetchDebts, setDebts } = useDebt();
    const [strategy, setStrategy] = useState<PaymentStrategy>("avalanche");
    const [selectedDebtId, setSelectedDebtId] = useState<string>('');
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');
    const [simulatedMonths, setSimulatedMonths] = useState<number>(0);
    const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [selectedDebtPayments, setSelectedDebtPayments] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const selectedDebt = debts.find(debt => debt.id === selectedDebtId);
    
    // Fetch payments when a debt is selected
    useEffect(() => {
        if (selectedDebtId) {
            fetch(`/api/payments?debtId=${selectedDebtId}`)
                .then(res => res.json())
                .then(data => setSelectedDebtPayments(data))
                .catch(err => console.error('Error fetching payments:', err));
        }
    }, [selectedDebtId]);

    const handleLogPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDebtId || !paymentAmount || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const paymentData = {
                debtId: selectedDebtId,
                amount: Number(paymentAmount),
                date: paymentDate,
                notes: notes || null,
            };
            
            console.log('Logging payment with data:', paymentData);
            
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to log payment');
                } else {
                    throw new Error('Failed to log payment');
                }
            }

            const result = await response.json();
            console.log('Payment logged successfully:', result);
            
            // Reset form
            setPaymentAmount('');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setNotes('');
            
            // Update the payments list with the updated debt's payments
            if (result.updatedDebt?.payments) {
                setSelectedDebtPayments(result.updatedDebt.payments);
            }

            // Update the debts list with the updated debt
            setDebts((prevDebts: Debt[]) => {
                const updatedDebts = prevDebts.map((debt: Debt) => 
                    debt.id === result.updatedDebt.id ? result.updatedDebt : debt
                );
                return updatedDebts;
            });
        } catch (error) {
            console.error('Error logging payment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to log payment. Please try again.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculatePaymentPlan = (debtsList: Debt[]): PaymentPlan[] => {
        if (debtsList.length === 0) return [];

        // Sort debts based on strategy
        const sortedDebts = [...debtsList].sort((a, b) => {
            switch (strategy) {
                case "avalanche":
                    return b.interestRate - a.interestRate;
                case "snowball":
                    return a.currentBalance - b.currentBalance;
                case "highest-payment":
                    return b.minimumPayment - a.minimumPayment;
                case "custom":
                    return 0;
                default:
                    return 0;
            }
        });

        return sortedDebts.map(debt => {
            const monthlyRate = debt.interestRate / 12 / 100; // Convert APR to monthly rate
            const monthlyPayment = Number(debt.minimumPayment) + Number(debt.extraPayment || 0);
            
            // Calculate months to payoff using the formula for loan amortization
            let balance = Number(debt.currentBalance);
            let totalInterest = 0;
            let months = 0;

            while (balance > 0 && months < 1000) {
                const interest = balance * monthlyRate;
                const principal = Math.min(monthlyPayment - interest, balance);
                balance = Math.max(0, balance - principal);
                totalInterest += interest;
                months++;
            }

            return {
                debtId: debt.id,
                debtName: debt.name,
                balance: Number(debt.currentBalance),
                monthlyPayment: Number(debt.minimumPayment) + Number(debt.extraPayment || 0),
                monthsToPayoff: months,
                totalInterest: Number(totalInterest.toFixed(2)),
            };
        });
    };

    const handleStrategyChange = (newStrategy: PaymentStrategy) => {
        setStrategy(newStrategy);
    };

    const handleDeleteDebt = async (debtId: string) => {
        if (!debtId) return;
        
        setIsDeleting(true);
        try {
            const response = await fetch('/api/debts/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ debtId }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete debt');
            }

            // Refresh the debts list
            await fetchDebts();
            
            // If the deleted debt was selected, clear the selection
            if (selectedDebtId === debtId) {
                setSelectedDebtId('');
            }
        } catch (error) {
            console.error('Error deleting debt:', error);
            alert('Failed to delete debt. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const paymentPlan = calculatePaymentPlan(debts);
    const totalMinimumPayment = Number(debts.reduce((sum, debt) => sum + Number(debt.minimumPayment), 0));
    const totalExtraPayment = Number(debts.reduce((sum, debt) => sum + Number(debt.extraPayment || 0), 0));
    const totalBalance = Number(debts.reduce((sum, debt) => sum + Number(debt.currentBalance), 0));

    const getStrategyColor = (strategyType: PaymentStrategy) => {
        switch (strategyType) {
            case "avalanche":
                return "bg-red-50 border-red-200 text-red-700 hover:bg-red-100";
            case "snowball":
                return "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100";
            case "highest-payment":
                return "bg-green-50 border-green-200 text-green-700 hover:bg-green-100";
            case "custom":
                return "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100";
            default:
                return "";
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Monthly Payment Plan</h2>
            
            {isLoading ? (
                <p className="text-gray-500">Loading your debts...</p>
            ) : debts.length === 0 ? (
                <p className="text-gray-500">No debts found. Add some debts to see your payment plan.</p>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Payment Strategy
                            </label>
                            <p className="text-sm text-gray-500 mt-1">Choose a strategy to optimize your debt repayment plan</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { 
                                    type: "avalanche", 
                                    title: "Avalanche", 
                                    desc: "Highest Interest First", 
                                    benefit: "Saves the most on interest" 
                                },
                                { 
                                    type: "snowball", 
                                    title: "Snowball", 
                                    desc: "Smallest Balance First", 
                                    benefit: "Quick wins for motivation" 
                                },
                                { 
                                    type: "highest-payment", 
                                    title: "Highest Payment", 
                                    desc: "Largest Minimum Payment", 
                                    benefit: "Reduces monthly obligations" 
                                },
                                { 
                                    type: "custom", 
                                    title: "Custom", 
                                    desc: "Maintain Original Order", 
                                    benefit: "Choose your own priority" 
                                }
                            ].map(({ type, title, desc, benefit }) => (
                                <button
                                    key={type}
                                    onClick={() => handleStrategyChange(type as PaymentStrategy)}
                                    className={`h-28 rounded-lg border-2 p-3 transition-all duration-200 ${
                                        strategy === type
                                            ? "ring-2 ring-offset-2 ring-indigo-500 scale-105"
                                            : getStrategyColor(type as PaymentStrategy)
                                    }`}
                                >
                                    <div className="flex items-start gap-3 h-full">
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="font-semibold text-base mb-1 truncate">{title}</div>
                                            <div className="text-sm opacity-80 leading-tight break-words">{desc}</div>
                                            <div className="text-xs mt-2 opacity-60 leading-tight break-words">{benefit}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700">Total Balance</h3>
                            <p className="text-2xl font-bold text-indigo-600">${totalBalance.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700">Total Monthly Payment</h3>
                            <p className="text-2xl font-bold text-indigo-600">${(totalMinimumPayment + totalExtraPayment).toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700">Total Extra Payment</h3>
                            <p className="text-2xl font-bold text-indigo-600">${totalExtraPayment.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium mb-4">Payment Schedule</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Debt Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monthly Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Months to Payoff
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Interest
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paymentPlan.map((plan) => (
                                        <tr key={plan.debtId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {plan.debtName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${plan.balance.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${plan.monthlyPayment.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {plan.monthsToPayoff}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${plan.totalInterest.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDeleteDebt(plan.debtId)}
                                                    disabled={isDeleting}
                                                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Tracking Section */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Track Payment Progress</h3>
                        
                        <div className="mb-6 bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border-2 border-gray-200 shadow-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Debt</label>
                            <select
                                value={selectedDebtId}
                                onChange={(e) => setSelectedDebtId(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white shadow-sm"
                            >
                                <option value="">Select a debt</option>
                                {debts.map(debt => (
                                    <option key={debt.id} value={debt.id}>
                                        {debt.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedDebt && (
                            <form onSubmit={handleLogPayment} className="space-y-4 bg-white p-4 rounded-lg border-2 border-gray-200 shadow-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Log New Payment</h4>
                                
                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Payment Progress</span>
                                        <span>
                                            {selectedDebt && selectedDebt.balance && selectedDebt.currentBalance
                                                ? `${Math.round((1 - Number(selectedDebt.currentBalance) / Number(selectedDebt.balance)) * 100)}%`
                                                : '0%'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                                            style={{ 
                                                width: `${selectedDebt && selectedDebt.balance && selectedDebt.currentBalance
                                                    ? Math.min(100, Math.round((1 - Number(selectedDebt.currentBalance) / Number(selectedDebt.balance)) * 100))
                                                    : 0}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Remaining: ${Number(selectedDebt?.currentBalance || 0).toFixed(2)}</span>
                                        <span>Total: ${Number(selectedDebt?.balance || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Total Payments: ${selectedDebtPayments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Minimum Payment Date */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payment Due Date</label>
                                    <div className="text-sm text-gray-600">
                                        {selectedDebt?.dueDate ? new Date(selectedDebt.dueDate).toLocaleDateString() : 'Not set'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full p-2 border rounded-lg shadow-sm"
                                        placeholder="Enter payment amount"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full p-2 border rounded-lg shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-2 border rounded-lg shadow-sm"
                                        placeholder="Add any notes about this payment"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!selectedDebtId || !paymentAmount || isSubmitting}
                                    >
                                        {isSubmitting ? 'Logging...' : 'Log Payment'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Payment History Section */}
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold">Payment History</h4>
                                <button
                                    onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    {showPaymentHistory ? 'Hide History' : 'Show History'}
                                </button>
                            </div>

                            {showPaymentHistory && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedDebtPayments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(payment.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${Number(payment.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {payment.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 