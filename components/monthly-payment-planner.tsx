// // components/monthly-payment-planner.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useDebt } from "../contexts/DebtContext";
// import type { Debt } from "../contexts/DebtContext";




// interface Payment {
//   id: string;
//   debtId: string;
//   userId: string;
//   amount: number;
//   date: string;
//   notes?: string;
// }

// interface PaymentPlan {
//   debtId: string;
//   debtName: string;
//   balance: number;
//   monthlyPayment: number;
//   monthsToPayoff: number;
//   totalInterest: number;
// }

// type PaymentStrategy = "avalanche" | "snowball" | "highest-payment" | "custom";

// export default function MonthlyPaymentPlanner() {
//   const { debts, isLoading, fetchDebts, setDebts } = useDebt();
//   const [strategy, setStrategy] = useState<PaymentStrategy>("avalanche");
//   const [selectedDebtId, setSelectedDebtId] = useState<string>("");
//   const [paymentAmount, setPaymentAmount] = useState<string>("");
//   const [paymentDate, setPaymentDate] = useState<string>(
//     new Date().toISOString().split("T")[0]
//   );
//   const [notes, setNotes] = useState<string>("");
//   const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [selectedDebtPayments, setSelectedDebtPayments] = useState<Payment[]>(
//     []
//   );
//   const [isDeleting, setIsDeleting] = useState<boolean>(false);

//   const selectedDebt = debts.find((debt) => debt.id === selectedDebtId);

//   // Fetch payments when a debt is selected
//   useEffect(() => {
//     if (!selectedDebtId) return;
//     fetch(`/api/payments?debtId=${selectedDebtId}`)
//       .then((res) => res.json())
//       .then((data) => setSelectedDebtPayments(data))
//       .catch((err) => console.error("Error fetching payments:", err));
//   }, [selectedDebtId]);

//   const handleLogPayment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedDebtId || !paymentAmount || isSubmitting) return;

//     setIsSubmitting(true);
//     try {
//       const payload = {
//         debtId: selectedDebtId,
//         amount: Number(paymentAmount),
//         date: paymentDate,
//         notes: notes || null,
//       };

//       const res = await fetch("/api/payments", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const ct = res.headers.get("content-type");
//         const errData = ct?.includes("application/json")
//           ? await res.json()
//           : {};
//         throw new Error(errData.error || "Failed to log");
//       }

//       const result = await res.json();
//       setPaymentAmount("");
//       setPaymentDate(new Date().toISOString().split("T")[0]);
//       setNotes("");

//       // ... after parsing `result` from /api/payments
//       if (result.updatedDebt?.payments) {
//         setSelectedDebtPayments(result.updatedDebt.payments);
//       }

//       // Compute and set the new debts list
//       const updatedDebts = debts.map((d) =>
//         d.id === result.updatedDebt.id ? result.updatedDebt : d
//       );
//       setDebts(updatedDebts);
//     } catch (err) {
//       console.error(err);
//       alert(err instanceof Error ? err.message : "Could not log payment");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const calculatePaymentPlan = (list: Debt[]): PaymentPlan[] => {
//     if (list.length === 0) return [];

//     const sorted = [...list].sort((a, b) => {
//       switch (strategy) {
//         case "avalanche":
//           return b.interestRate - a.interestRate;
//         case "snowball":
//           return a.currentBalance - b.currentBalance;
//         case "highest-payment":
//           return b.minimumPayment - a.minimumPayment;
//         case "custom":
//         default:
//           return 0;
//       }
//     });

//     return sorted.map((debt) => {
//       const r = debt.interestRate / 12 / 100;
//       const m = debt.minimumPayment + (debt.extraPayment || 0);
//       let bal = debt.currentBalance;
//       let ti = 0;
//       let mo = 0;
//       while (bal > 0 && mo < 1000) {
//         const interest = bal * r;
//         const principal = Math.min(m - interest, bal);
//         bal -= principal;
//         ti += interest;
//         mo++;
//       }
//       return {
//         debtId: debt.id,
//         debtName: debt.name,
//         balance: debt.currentBalance,
//         monthlyPayment: m,
//         monthsToPayoff: mo,
//         totalInterest: Number(ti.toFixed(2)),
//       };
//     });
//   };

//   const handleDeleteDebt = async (id: string) => {
//     if (!id) return;
//     setIsDeleting(true);
//     try {
//       const res = await fetch("/api/debts/delete", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ debtId: id }),
//       });
//       if (!res.ok) throw new Error("Delete failed");
//       await fetchDebts();
//       if (id === selectedDebtId) setSelectedDebtId("");
//     } catch (err) {
//       console.error(err);
//       alert("Could not delete debt");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const paymentPlan = calculatePaymentPlan(debts);
//   const totalBalance = debts.reduce((sum, d) => sum + d.currentBalance, 0);
//   const totalMonthly = debts.reduce(
//     (sum, d) => sum + d.minimumPayment + (d.extraPayment || 0),
//     0
//   );
//   const totalExtra = debts.reduce((sum, d) => sum + (d.extraPayment || 0), 0);

//   const getBtnClasses = (type: PaymentStrategy) =>
//     strategy === type
//       ? "ring-2 ring-indigo-500 scale-105"
//       : {
//           avalanche: "bg-red-50 border-red-200 text-red-700",
//           snowball: "bg-blue-50 border-blue-200 text-blue-700",
//           "highest-payment": "bg-green-50 border-green-200 text-green-700",
//           custom: "bg-yellow-50 border-yellow-200 text-yellow-700",
//         }[type];

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <h2 className="text-xl font-semibold mb-6">Monthly Payment Plan</h2>

//       {isLoading ? (
//         <p className="text-gray-500">Loading...</p>
//       ) : debts.length === 0 ? (
//         <p className="text-gray-500">
//           No debts found. Add some debts to get started.
//         </p>
//       ) : (
//         <div className="space-y-6">
//           {/* Strategy Selector */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Payment Strategy
//             </label>
//             <p className="text-sm text-gray-500 mb-2">
//               Choose how to prioritize your debts
//             </p>
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//               {[
//                 {
//                   type: "avalanche" as PaymentStrategy,
//                   title: "Avalanche",
//                   desc: "Highest interest first",
//                 },
//                 {
//                   type: "snowball" as PaymentStrategy,
//                   title: "Snowball",
//                   desc: "Smallest balance first",
//                 },
//                 {
//                   type: "highest-payment" as PaymentStrategy,
//                   title: "Highest Payment",
//                   desc: "Largest minimum",
//                 },
//                 {
//                   type: "custom" as PaymentStrategy,
//                   title: "Custom",
//                   desc: "Your order",
//                 },
//               ].map(({ type, title, desc }) => (
//                 <button
//                   key={type}
//                   onClick={() => setStrategy(type)}
//                   className={`h-24 rounded-lg border-2 p-3 transition-all duration-200 ${getBtnClasses(
//                     type
//                   )}`}
//                 >
//                   <div className="font-semibold">{title}</div>
//                   <div className="text-sm">{desc}</div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Summary Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-gray-50 p-4 rounded-lg text-center">
//               <div className="text-sm">Total Balance</div>
//               <div className="text-2xl font-bold">
//                 ${totalBalance.toFixed(2)}
//               </div>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg text-center">
//               <div className="text-sm">Monthly Payment</div>
//               <div className="text-2xl font-bold">
//                 ${totalMonthly.toFixed(2)}
//               </div>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg text-center">
//               <div className="text-sm">Total Extra</div>
//               <div className="text-2xl font-bold">${totalExtra.toFixed(2)}</div>
//             </div>
//           </div>

//           {/* Payment Plan Table */}
//           <div>
//             <h3 className="text-lg font-medium mb-2">Payment Schedule</h3>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                       Debt
//                     </th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                       Balance
//                     </th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                       Monthly
//                     </th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                       Months
//                     </th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                       Interest
//                     </th>
//                     <th className="px-4 py-2"></th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {paymentPlan.map((p) => (
//                     <tr key={p.debtId}>
//                       <td className="px-4 py-2">{p.debtName}</td>
//                       <td className="px-4 py-2">${p.balance.toFixed(2)}</td>
//                       <td className="px-4 py-2">
//                         ${p.monthlyPayment.toFixed(2)}
//                       </td>
//                       <td className="px-4 py-2">{p.monthsToPayoff}</td>
//                       <td className="px-4 py-2">
//                         ${p.totalInterest.toFixed(2)}
//                       </td>
//                       <td className="px-4 py-2 text-right">
//                         <button
//                           onClick={() => handleDeleteDebt(p.debtId)}
//                           disabled={isDeleting}
//                           className="text-red-600 hover:underline disabled:opacity-50"
//                         >
//                           {isDeleting ? "Deleting..." : "Delete"}
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Log Payment */}
//           <div className="mt-8 border-t pt-6">
//             <h3 className="text-lg font-semibold mb-4">Track & Log Payment</h3>

//             <div className="mb-4">
//               <select
//                 value={selectedDebtId}
//                 onChange={(e) => setSelectedDebtId(e.target.value)}
//                 className="w-full p-2 border rounded-lg"
//               >
//                 <option value="">Select a debt…</option>
//                 {debts.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {selectedDebt && (
//               <form onSubmit={handleLogPayment}>
//                 <div className="mb-3">
//                   <label className="block text-sm font-medium">Amount</label>
//                   <input
//                     type="number"
//                     value={paymentAmount}
//                     onChange={(e) => setPaymentAmount(e.target.value)}
//                     required
//                     className="w-full p-2 border rounded-lg"
//                     min="0.01"
//                     step="0.01"
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="block text-sm font-medium">Date</label>
//                   <input
//                     type="date"
//                     value={paymentDate}
//                     onChange={(e) => setPaymentDate(e.target.value)}
//                     required
//                     className="w-full p-2 border rounded-lg"
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="block text-sm font-medium">Notes</label>
//                   <textarea
//                     value={notes}
//                     onChange={(e) => setNotes(e.target.value)}
//                     className="w-full p-2 border rounded-lg"
//                     rows={2}
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   disabled={!paymentAmount || isSubmitting}
//                   className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                   {isSubmitting ? "Logging…" : "Log Payment"}
//                 </button>
//               </form>
//             )}
//           </div>

//           {/* Payment History */}
//           {selectedDebt && (
//             <div className="mt-6">
//               <div className="flex justify-between items-center">
//                 <h4 className="text-lg font-semibold">Payment History</h4>
//                 <button
//                   onClick={() => setShowPaymentHistory((v) => !v)}
//                   className="text-indigo-600 hover:underline"
//                 >
//                   {showPaymentHistory ? "Hide" : "Show"}
//                 </button>
//               </div>
//               {showPaymentHistory && (
//                 <div className="overflow-x-auto mt-2">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                           Date
//                         </th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                           Amount
//                         </th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
//                           Notes
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {selectedDebtPayments.map((p) => (
//                         <tr key={p.id}>
//                           <td className="px-4 py-2">
//                             {new Date(p.date).toLocaleDateString()}
//                           </td>
//                           <td className="px-4 py-2">${p.amount.toFixed(2)}</td>
//                           <td className="px-4 py-2">{p.notes || "—"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
// components/monthly-payment-planner.tsx
"use client";

import { useState, useEffect } from "react";
import { useDebt } from "../contexts/DebtContext";
import type { Debt } from "../contexts/DebtContext";




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
  const [selectedDebtId, setSelectedDebtId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [notes, setNotes] = useState<string>("");
  const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedDebtPayments, setSelectedDebtPayments] = useState<Payment[]>(
    []
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const selectedDebt = debts.find((debt) => debt.id === selectedDebtId);

  // Fetch payments when a debt is selected
  useEffect(() => {
    if (!selectedDebtId) return;
    fetch(`/api/payments?debtId=${selectedDebtId}`)
      .then((res) => res.json())
      .then((data) => setSelectedDebtPayments(data))
      .catch((err) => console.error("Error fetching payments:", err));
  }, [selectedDebtId]);

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !paymentAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        debtId: selectedDebtId,
        amount: Number(paymentAmount),
        date: paymentDate,
        notes: notes || null,
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type");
        const errData = ct?.includes("application/json")
          ? await res.json()
          : {};
        throw new Error(errData.error || "Failed to log");
      }

      const result = await res.json();
      setPaymentAmount("");
      setPaymentDate(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      setNotes("");

      // ... after parsing `result` from /api/payments
      if (result.updatedDebt?.payments) {
        setSelectedDebtPayments(result.updatedDebt.payments);
      }

      // Compute and set the new debts list
      const updatedDebts = debts.map((d) =>
        d.id === result.updatedDebt.id ? result.updatedDebt : d
      );
      setDebts(updatedDebts);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not log payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePaymentPlan = (list: Debt[]): PaymentPlan[] => {
    if (list.length === 0) return [];

    const sorted = [...list].sort((a, b) => {
      switch (strategy) {
        case "avalanche":
          return b.interestRate - a.interestRate;
        case "snowball":
          return a.currentBalance - b.currentBalance;
        case "highest-payment":
          return b.minimumPayment - a.minimumPayment;
        case "custom":
        default:
          return 0;
      }
    });

    return sorted.map((debt) => {
      const r = debt.interestRate / 12 / 100;
      const m = debt.minimumPayment + (debt.extraPayment || 0);
      let bal = debt.currentBalance;
      let ti = 0;
      let mo = 0;
      while (bal > 0 && mo < 1000) {
        const interest = bal * r;
        const principal = Math.min(m - interest, bal);
        bal -= principal;
        ti += interest;
        mo++;
      }
      return {
        debtId: debt.id,
        debtName: debt.name,
        balance: debt.currentBalance,
        monthlyPayment: m,
        monthsToPayoff: mo,
        totalInterest: Number(ti.toFixed(2)),
      };
    });
  };

  const handleDeleteDebt = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/debts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ debtId: id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchDebts();
      if (id === selectedDebtId) setSelectedDebtId("");
    } catch (err) {
      console.error(err);
      alert("Could not delete debt");
    } finally {
      setIsDeleting(false);
    }
  };

  const paymentPlan = calculatePaymentPlan(debts);
  const totalBalance = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalMonthly = debts.reduce(
    (sum, d) => sum + d.minimumPayment + (d.extraPayment || 0),
    0
  );
  const totalExtra = debts.reduce((sum, d) => sum + (d.extraPayment || 0), 0);

  const getBtnClasses = (type: PaymentStrategy) =>
    strategy === type
      ? "ring-2 ring-indigo-500 scale-105"
      : {
          avalanche: "bg-red-50 border-red-200 text-red-700",
          snowball: "bg-blue-50 border-blue-200 text-blue-700",
          "highest-payment": "bg-green-50 border-green-200 text-green-700",
          custom: "bg-yellow-50 border-yellow-200 text-yellow-700",
        }[type];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Monthly Payment Plan</h2>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : debts.length === 0 ? (
        <p className="text-gray-500">
          No debts found. Add some debts to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Strategy Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Strategy
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Choose how to prioritize your debts
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  type: "avalanche" as PaymentStrategy,
                  title: "Avalanche",
                  desc: "Highest interest first",
                },
                {
                  type: "snowball" as PaymentStrategy,
                  title: "Snowball",
                  desc: "Smallest balance first",
                },
                {
                  type: "highest-payment" as PaymentStrategy,
                  title: "Highest Payment",
                  desc: "Largest minimum",
                },
                {
                  type: "custom" as PaymentStrategy,
                  title: "Custom",
                  desc: "Your order",
                },
              ].map(({ type, title, desc }) => (
                <button
                  key={type}
                  onClick={() => setStrategy(type)}
                  className={`h-24 rounded-lg border-2 p-3 transition-all duration-200 ${getBtnClasses(
                    type
                  )}`}
                >
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm">Total Balance</div>
              <div className="text-2xl font-bold">
                ${totalBalance.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm">Monthly Payment</div>
              <div className="text-2xl font-bold">
                ${totalMonthly.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm">Total Extra</div>
              <div className="text-2xl font-bold">${totalExtra.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Plan Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Payment Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Debt
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Monthly
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Months
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Interest
                    </th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentPlan.map((p) => (
                    <tr key={p.debtId}>
                      <td className="px-4 py-2">{p.debtName}</td>
                      <td className="px-4 py-2">${p.balance.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        ${p.monthlyPayment.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">{p.monthsToPayoff}</td>
                      <td className="px-4 py-2">
                        ${p.totalInterest.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteDebt(p.debtId)}
                          disabled={isDeleting}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Payment */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Track & Log Payment</h3>

            <div className="mb-4">
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a debt…</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDebt && (
              <form onSubmit={handleLogPayment}>
                <div className="mb-3">
                  <label className="block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!paymentAmount || isSubmitting}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Logging…" : "Log Payment"}
                </button>
              </form>
            )}
          </div>

          {/* Payment History */}
          {selectedDebt && (
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Payment History</h4>
                <button
                  onClick={() => setShowPaymentHistory((v) => !v)}
                  className="text-indigo-600 hover:underline"
                >
                  {showPaymentHistory ? "Hide" : "Show"}
                </button>
              </div>
              {showPaymentHistory && (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDebtPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2">
                            {new Date(p.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">${p.amount.toFixed(2)}</td>
                          <td className="px-4 py-2">{p.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
