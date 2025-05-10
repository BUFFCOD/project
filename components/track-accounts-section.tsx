"use client";

import React from "react";
import Image from "next/image";

export const TrackAccountsSection = () => {
  return (
    <section className="bg-white flex items-center flex-col py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-black dark:text-white">
            Track Your Accounts
          </h1>
        </div>
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg">
          <Image
            src="/accounts.png"
            alt="Accounts Overview"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
        <p className="text-center text-gray-600 mt-4 text-sm font-semibold">
          Connect your accounts with Plaid and track all your account balances in one place
        </p>
      </div>
    </section>
  );
}; 