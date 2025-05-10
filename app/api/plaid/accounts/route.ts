import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { plaidClient } from "@/lib/plaid";
import type { AccountBase } from "plaid"; // ✅ Use Plaid's official Account type

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ No userId from Clerk.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authenticated userId:", userId);

    const plaidItem = await prisma.userplaiditem.findUnique({
      where: { userId },
    });

    if (!plaidItem) {
      console.error("❌ No Plaid item found for user:", userId);
      return NextResponse.json(
        { error: "Plaid account not found" },
        { status: 404 }
      );
    }

    const accessToken = decrypt(plaidItem.encryptedAccessToken);
    console.log("🔓 Decrypted Plaid token:", accessToken.slice(0, 4) + "...");

    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts: AccountBase[] = response.data.accounts;

    console.log("✅ Accounts fetched:", accounts.length);

    // Return full account details including balances
    return NextResponse.json(accounts);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("🔥 PLAID ACCOUNTS ERROR:", message);

    return NextResponse.json(
      { error: "Failed to fetch accounts", message },
      { status: 500 }
    );
  }
}
