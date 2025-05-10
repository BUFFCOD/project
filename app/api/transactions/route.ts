import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";


export async function GET() { 
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // fetch last 50 transactions from the database
    const transactions = await prisma.plaidtransaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    });

    // optionally, you could fetch updated balances here, but we return transactions only
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
