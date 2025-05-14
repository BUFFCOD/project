// app/api/debts/route.ts
import { NextResponse } from "next/server";
import { auth }          from "@clerk/nextjs/server";
import prisma            from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json([], { status: 401 });
  }

  const debts = await prisma.debt.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = debts.map((d) => ({
    id:             d.id,
    userId:         d.userId,
    name:           d.name,
    balance:        d.balance.toNumber(),
    currentBalance: d.currentBalance.toNumber(),
    interestRate:   d.interestRate.toNumber(),
    minimumPayment: d.minimumPayment.toNumber(),
    dueDate:        d.dueDate,
    extraPayment:   d.extraPayment?.toNumber() ?? null,
    type:           d.type,
    createdAt:      d.createdAt,
    updatedAt:      d.updatedAt,
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    type,           // dropdown value
    name,           // text‐input override
    balance,
    interestRate,
    minimumPayment,
    dueDate,
    extraPayment,
  } = await req.json();

  // Validate required fields
  if (
    balance == null ||
    interestRate == null ||
    minimumPayment == null ||
    !dueDate ||
    (!type && !name)
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Use typed-in name if provided, otherwise fall back to type
  const finalName     = name?.trim() || type;
  const currentBalance = balance; // initialize current balance to full balance

  const debt = await prisma.debt.create({
    data: {
      userId:         session.userId,
      name:           finalName,
      balance,
      currentBalance,
      interestRate,
      minimumPayment,
      dueDate:      new Date(dueDate),
      extraPayment: extraPayment ?? null,
      type:         type ?? null,
    },
  });

  // Serialize Decimal fields
  return NextResponse.json(
    {
      ...debt,
      balance:        debt.balance.toNumber(),
      currentBalance: debt.currentBalance.toNumber(),
      interestRate:   debt.interestRate.toNumber(),
      minimumPayment: debt.minimumPayment.toNumber(),
      extraPayment:   debt.extraPayment?.toNumber() ?? null,
    },
    { status: 201 }
  );
}
