// app/api/plaid/save-transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plaidClient } from "@/lib/plaid";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import dayjs from "dayjs";
import { randomUUID } from "crypto";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plaidItem = await prisma.userplaiditem.findUnique({
    where: { userId },
  });
  if (!plaidItem) {
    return NextResponse.json(
      { error: "Plaid account not found" },
      { status: 404 }
    );
  }

  const accessToken = decrypt(plaidItem.encryptedAccessToken);
  const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
  const endDate = dayjs().format("YYYY-MM-DD");

  const {
    data: { transactions },
  } = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  });

  for (const tx of transactions) {
    await prisma.plaidtransaction.upsert({
      where: { transactionId: tx.transaction_id },
      update: {
        // if you ever re‐save, these fields will get updated
        name: tx.name,
        amount: tx.amount,
        date: new Date(tx.date),
        category: tx.category?.[0] ?? null,
        // **NEW** fields:
        transaction_type: tx.transaction_type,
        pfc_primary: tx.personal_finance_category?.primary ?? null,
      },
      create: {
        id: randomUUID(),
        userId,
        transactionId: tx.transaction_id,
        account_id: tx.account_id,
        name: tx.name,
        amount: tx.amount,
        date: new Date(tx.date),
        category: tx.category?.[0] ?? null,
        // **NEW** fields:
        transaction_type: tx.transaction_type,
        pfc_primary: tx.personal_finance_category?.primary ?? null,
      },
    });
  }

  return NextResponse.json({ saved: transactions.length });
}
