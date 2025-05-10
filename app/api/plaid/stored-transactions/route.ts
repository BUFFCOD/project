import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { plaidClient } from "@/lib/plaid";
import { decrypt } from "@/lib/encryption"; // Ensure you have a decryption function
import crypto from "crypto";


export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plaidItem = await prisma.userplaiditem.findUnique({
    where: { userId },
  });

  if (!plaidItem)
    return NextResponse.json(
      { error: "No Plaid account linked." },
      { status: 404 }
    );

  const accessToken = decrypt(plaidItem.encryptedAccessToken);

  const now = new Date();
  const start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: start.toISOString().split("T")[0],
    end_date: now.toISOString().split("T")[0],
  });

  const transactions = response.data.transactions;

  for (const tx of transactions) {
    await prisma.plaidtransaction.upsert({
      where: { transactionId: tx.transaction_id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        transactionId: tx.transaction_id,
        name: tx.name,
        amount: tx.amount,
        date: new Date(tx.date),
        account_id: tx.account_id,
        userId,
        category: tx.category?.[0] ?? "Uncategorized",
        iso_currency_code: tx.iso_currency_code,
      },
    });


  }

  // ✅ Move the return inside the function
  return NextResponse.json(transactions);
}
