'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const RootPage = () => {
  const { isSignedIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    // Use window.location for a hard redirect
    if (isSignedIn) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/home";
    }
  }, [isSignedIn]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default RootPage; 
