'use client';

import { ClerkProvider, UserButton } from "@clerk/nextjs"
import { DebtProvider } from "@/contexts/DebtContext"
import DebtInputDashboard from "@/components/debt-input-dashboard"
import MonthlyPaymentPlanner from "@/components/monthly-payment-planner"
import CreditCardPayoffCalculator from "@/components/credit-card-payoff-calculator"

export default function Home() {
  return (
    <DebtProvider>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Debt Management Dashboard</h1>
          <div className="flex items-center">
          
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <DebtInputDashboard />
            <CreditCardPayoffCalculator />
          </div>
          <MonthlyPaymentPlanner />
        </div>
      </div>
    </DebtProvider>
  )
}
