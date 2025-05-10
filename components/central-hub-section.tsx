"use client";

import React from "react";
import Image from "next/image";

export const CentralHubSection = () => {
  return (
    <section className="bg-gray-50 flex items-center flex-col py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-black dark:text-white">
            Your central hub for tracking payments and debt payoff planning.
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/dashboardpayment.png"
              alt="Dashboard Overview"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/monthlypayment.png"
              alt="Monthly Payment Planner"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/progress.png"
              alt="Progress Tracking"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}; 