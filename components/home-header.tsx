
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

const HomeHeader = () => {
    return (
        <header className="p-5 flex justify-between items-center border-b shadow-sm">
            <div className="flex items-center">
                <Image src="/homelogo.svg" alt="BudgetWize Logo" width={50} height={50} />
                <span className="text-blue-500 font-bold text-xl">BudgetWize</span>
            </div>
            <div className="flex gap-3 items-center">
                <Link href="/sign-up">
                    <Button variant="outline" className="rounded-full">Get Started</Button>
                </Link>
                <Link href="/sign-in">
                    <Button className="rounded-full">Sign In</Button>
                </Link>
            </div>
        </header>
    );
};

export default HomeHeader; 