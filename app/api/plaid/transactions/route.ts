// app/api/plaid/transactions/route.ts
import { NextResponse } from "next/server";
import { auth }        from "@clerk/nextjs/server";
import prisma           from "@/lib/prisma";
import { decrypt }      from "@/lib/encryption";
import { plaidClient }  from "@/lib/plaid";
import dayjs            from "dayjs";
import crypto           from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1) Fetch from Plaid
  const accessToken = decrypt((await prisma.userplaiditem.findUnique({ where: { userId } }))!.encryptedAccessToken);
  const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
  const endDate   = dayjs().format("YYYY-MM-DD");

  const { data: { transactions } } = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date:   startDate,
    end_date:     endDate,
    options:      { count: 100, offset: 0 },
  });

  // 2) Upsert into DB with the new fields
  await Promise.all(transactions.map((tx: any) =>
    prisma.plaidtransaction.upsert({
      where: { transactionId: tx.transaction_id },
      update: {
        name:              tx.name,
        amount:            tx.amount,
        date:              new Date(tx.date),
        category:          tx.category?.join(" > ") ?? null,
        iso_currency_code: tx.iso_currency_code ?? null,
        transaction_type:  tx.transaction_type,
        pfc_primary:       tx.personal_finance_category?.primary ?? null,
      },
      create: {
        id:                crypto.randomUUID(),
        userId,
        transactionId:     tx.transaction_id,
        account_id:        tx.account_id,
        name:              tx.name,
        amount:            tx.amount,
        date:              new Date(tx.date),
        category:          tx.category?.join(" > ") ?? null,
        iso_currency_code: tx.iso_currency_code ?? null,
        transaction_type:  tx.transaction_type,
        pfc_primary:       tx.personal_finance_category?.primary ?? null,
      },
    })
  ));

  // 3) Return the DB-backed rows, not the raw Plaid response
  const stored = await prisma.plaidtransaction.findMany({
    where:   { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ transactions: stored });
}
