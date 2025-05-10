import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plaidClient } from "@/lib/plaid";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import dayjs from "dayjs";

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plaidItem = await prisma.userplaiditem.findUnique({
    where: { userId },
  });
  if (!plaidItem)
    return NextResponse.json(
      { error: "Plaid account not found" },
      { status: 404 }
    );

  const accessToken = decrypt(plaidItem.encryptedAccessToken);

  const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
  const endDate = dayjs().format("YYYY-MM-DD");

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  });

  const transactions = response.data.transactions;

  for (const tx of transactions) {
    await prisma.plaidTransaction.upsert({
      where: { transactionId: tx.transaction_id },
      update: {},
      create: {
        userId,
        transactionId: tx.transaction_id,
        account_id: tx.account_id,
        name: tx.name,
        amount: tx.amount,
        date: new Date(tx.date),
        category: tx.category?.[0] || null,
        merchant: tx.merchant_name || null,
      },
    });
  }

  return NextResponse.json({ saved: transactions.length });
}
