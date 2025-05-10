"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePlaidLink } from "react-plaid-link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"; // Import Recharts components

interface Account {
  account_id: string;
  name: string;
  subtype: string;
  mask: string;
  balances: {
    available?: number;
    current: number;
    iso_currency_code?: string;
  };
}

export default function CardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/plaid/accounts");
      if (!res.ok) {
        console.error(`Failed to fetch accounts: ${res.status}`);
        return;
      }
      const data: Account[] = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Get Plaid link token on load
  useEffect(() => {
    const createLinkToken = async () => {
      const res = await fetch("/api/create-link-token");
      const data = await res.json();
      setLinkToken(data.link_token);
    };
    createLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: async (public_token) => {
      await fetch("/api/plaid/set-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      alert("✅ Bank linked successfully!");
      fetchAccounts(); // Automatically fetch after linking
    },
    onExit: (err) => {
      if (err) console.error("❌ User exited Plaid Link:", err);
    },
  });

  const sharedButtonClass =
    "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition";

  // Data for bar chart
  const chartData = accounts.map((acc) => ({
    name: acc.name,
    balance: acc.balances.available ?? acc.balances.current,
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Your Linked Card</h1>

      {/* Unified Button Group */}
      <div className="self-start flex gap-4 mb-6">
        <button onClick={() => open()} disabled={!ready} className={sharedButtonClass}>
          Connect Bank Account
        </button>
        <button onClick={fetchAccounts} className={sharedButtonClass}>
          Fetch Cards
        </button>
      </div>

      {/* Overview Summary */}
      {accounts.length > 0 && (
        <div className="bg-white shadow rounded-xl p-4 w-full max-w-5xl mb-6">
          <h2 className="text-lg font-semibold mb-2">Account Overview</h2>
          <div className="flex justify-between text-gray-700">
            <div>Total Accounts: {accounts.length}</div>
            <div>
              Total Balance: $
              {accounts
                .reduce((sum, acc) => sum + (acc.balances.available ?? acc.balances.current), 0)
                .toFixed(2)}
            </div>
            <div>
              Avg. Balance: $
              {(
                accounts.reduce(
                  (sum, acc) => sum + (acc.balances.available ?? acc.balances.current),
                  0
                ) / accounts.length
              ).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Recharts Bar Chart */}
      {accounts.length > 0 && (
        <div className="bg-white shadow rounded-xl p-4 w-full max-w-5xl mb-6">
          <h2 className="text-lg font-semibold mb-4">Account Balances</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="balance" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cards Section */}
      <div className="flex w-full max-w-5xl gap-6">
        <div className="grid grid-cols-2 gap-6 w-full">
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="relative bg-white rounded-2xl shadow-lg overflow-hidden h-64 w-full"
            >
              <Image
                src="/card-front.png"
                alt="Generic Credit Card"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 text-white font-mono text-lg">
                **** **** **** {acc.mask}
              </div>
              <div className="absolute bottom-12 left-4 text-white font-semibold text-xl">
                {acc.name}
              </div>
              <div className="absolute bottom-4 left-4 text-white text-sm">
                Balance: {acc.balances.iso_currency_code ?? "USD"}$
                {(acc.balances.available ?? acc.balances.current).toFixed(2)}
              </div>
              <div className="absolute bottom-4 right-4 text-white font-bold text-xl">
                ${(acc.balances.available ?? acc.balances.current).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
