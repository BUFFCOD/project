"use client";

import { Loader2 } from "lucide-react";
import { UserButton, ClerkLoading, ClerkLoaded, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { HeaderLogo } from "@/components/header-logo";
import { Navigation } from "@/components/navigation";
import { WelcomeMsg } from "@/components/welcome-msg";

export const Header = () => {
    const pathname = usePathname();
    const { isSignedIn } = useClerk();
    const isHomePage = pathname === "/home";

    return (
        <header className="bg-gradient-to-b from-blue-700
         to-blue-500 px-4 py-8 lg:px-14 pb-36">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between mb-14">
                    <div className="flex items-center lg:gap-x-16">
                        <HeaderLogo />
                        {isSignedIn && <Navigation />}
                    </div>
                    {isSignedIn ? (
                        <ClerkLoaded>
                            <UserButton />
                        </ClerkLoaded>
                    ) : (
                        <div className="flex gap-3 items-center">
                            <Link href="/sign-up" passHref>
                                <Button asChild variant="outline" className="rounded-full cursor-pointer">
                                    <span>Get Started </span>
                                    </Button>
                            </Link>
                            <Link href="/sign-in" passHref>
                                <Button asChild className="rounded-full cursor-pointer">
                                    <span>Sign In </span>
                                    </Button>
                            </Link>
                        </div>
                    )}
                    <ClerkLoading>
                        <Loader2 className="size-8 animate-spin text-slate-400" />
                    </ClerkLoading>
                </div>
                {!isHomePage && <WelcomeMsg />}
            </div>
        </header>
    );
};