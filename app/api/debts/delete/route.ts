// app/api/debts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // 1) Ensure the user is signed in
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json([], { status: 401 });
  }

  // 2) Fetch debts for this user
  const debts = await prisma.debt.findMany({
    where: { userId: session.userId },
  });

  // 3) Serialize Decimal → number and include userId
  const serialized = debts.map((d) => ({
    id: d.id,
    userId: d.userId,
    name: d.name,
    balance: d.balance.toNumber(),
    currentBalance: d.currentBalance.toNumber(),
    interestRate: d.interestRate.toNumber(),
    minimumPayment: d.minimumPayment.toNumber(),
    dueDate: d.dueDate,
    extraPayment: d.extraPayment?.toNumber() ?? null,
    payments: [], // or fetch & serialize related payments if needed
  }));

  return NextResponse.json(serialized);
}
