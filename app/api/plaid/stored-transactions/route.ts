// app/api/plaid/stored-transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { plaidClient } from "@/lib/plaid";
import crypto from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.userplaiditem.findUnique({
    where: { userId: userId.toString() },
  });
  if (!item) {
    return NextResponse.json(
      { error: "No Plaid account linked." },
      { status: 404 }
    );
  }

  const accessToken = decrypt(item.encryptedAccessToken);
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .split("T")[0];

  // fetch up to 250 txns from Plaid
  const {
    data: { transactions },
  } = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: { count: 250, offset: 0 },
  });

  // upsert into your MySQL via Prisma, including new fields
  await Promise.all(
    transactions.map((tx: any) =>
      prisma.plaidtransaction.upsert({
        where: { transactionId: tx.transaction_id },
        update: {
          name: tx.name,
          amount: tx.amount,
          date: new Date(tx.date),
          category: tx.category?.join(" > ") ?? null,
          iso_currency_code: tx.iso_currency_code ?? null,
          transaction_type: tx.transaction_type, // NEW
          pfc_primary: tx.personal_finance_category?.primary ?? null, // NEW
        },
        create: {
          id: crypto.randomUUID(),
          userId: userId.toString(),
          transactionId: tx.transaction_id,
          account_id: tx.account_id,
          name: tx.name,
          amount: tx.amount,
          date: new Date(tx.date),
          category: tx.category?.join(" > ") ?? null,
          iso_currency_code: tx.iso_currency_code ?? null,
          transaction_type: tx.transaction_type, // NEW
          pfc_primary: tx.personal_finance_category?.primary ?? null, // NEW
        },
      })
    )
  );

  return NextResponse.json({
    fetched: transactions.length,
    stored: transactions.length,
    sampleFirst: transactions.slice(0, 3),
  });
}
