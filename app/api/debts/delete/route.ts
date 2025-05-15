// // app/api/debts/route.ts
// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function GET() {
//   // 1) Ensure the user is signed in
//   const session = await auth();
//   if (!session?.userId) {
//     return NextResponse.json([], { status: 401 });
//   }

//   // 2) Fetch debts for this user
//   const debts = await prisma.debt.findMany({
//     where: { userId: session.userId },
//   });

//   // 3) Serialize Decimal → number and include userId
//   const serialized = debts.map((d) => ({
//     id: d.id,
//     userId: d.userId,
//     name: d.name,
//     balance: d.balance.toNumber(),
//     currentBalance: d.currentBalance.toNumber(),
//     interestRate: d.interestRate.toNumber(),
//     minimumPayment: d.minimumPayment.toNumber(),
//     dueDate: d.dueDate,
//     extraPayment: d.extraPayment?.toNumber() ?? null,
//     payments: [], // or fetch & serialize related payments if needed
//   }));

//   return NextResponse.json(serialized);
// }
// app/api/debts/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { debtId } = await req.json();

    if (!debtId) {
      return new NextResponse("Missing debtId", { status: 400 });
    }

    const existingDebt = await prisma.debt.findUnique({
      where: { id: debtId },
    });

    if (!existingDebt) {
      return new NextResponse("Debt not found", { status: 404 });
    }

    // Delete related payments first to avoid foreign key constraint issues
    await prisma.debt_payment.deleteMany({ where: { debtId } });

    // Now delete the debt record
    await prisma.debt.delete({ where: { id: debtId } });

    return new NextResponse("Debt deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete failed:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Delete failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}