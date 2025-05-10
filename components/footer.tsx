"use client";

import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="BudgetWize Logo" height={28} width={28} />
            <p className="font-semibold text-white text-2xl ml-2.5">
              BudgetWize
            </p>
          </div>
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <Link href="/sign-up" className="text-gray-300 hover:text-white transition-colors">
              Get Started
            </Link>
            <Link href="/sign-in" className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="https://www.youtube.com/watch?v=your-tutorial-video-id" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
              Tutorial Video
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <p className="text-gray-300">Email: budgetwizesup@gmail.com</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} BudgetWize. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}; 