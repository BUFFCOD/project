"use client";

import React from "react";
import Image from "next/image";

export const DebtConfidenceSection = () => {
  return (
    <section className="bg-white flex items-center flex-col py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-black dark:text-white">
            Tackle your debt with confidence.
          </h1>
          <p className="text-center text-gray-600 mt-4 text-sm font-semibold">
            Apply whichever payoff strategy you want
          </p>
        </div>
        <div className="flex flex-col items-center gap-8 mt-12">
          <div className="flex items-center gap-8">
            <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg">
              <Image
                src="/avalanche.png"
                alt="Avalanche Method"
                fill
                className="object-cover"
              />
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-black mb-2">Avalanche Method</h2>
              <p className="text-gray-600">
                Pay off debts with the highest interest rates first to minimize the total interest paid over time. It's the fastest way to save money on interest.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg">
              <Image
                src="/snowball.png"
                alt="Snowball Method"
                fill
                className="object-cover"
              />
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-black mb-2">Snowball Method</h2>
              <p className="text-gray-600">
                Start by paying off your smallest debts first for quick wins and momentum. It's a great motivational boost to stay committed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 