'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#4B0082', '#FFD700', '#FFA500', '#228B22', '#FF4500', '#00CED1'];

type Props = {
  data: {
    category: string;
    amount: number;
  }[];
};

export default function CategorySpendingChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-xl font-semibold">Spending by Category</h2>
      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
      <p className="mt-2 text-gray-600 font-medium">
        Total Spending: ${total.toFixed(2)}
      </p>
    </div>
  );
}
