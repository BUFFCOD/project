// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// // GET /api/payments?debtId=…
// export async function GET(request: Request) {
//   try {
//     const session = await auth();
//     if (!session?.userId) {
//       return NextResponse.json(
//         { error: "Unauthorized - Please sign in" },
//         { status: 401 }
//       );
//     }

//     const url = new URL(request.url);
//     const debtId = url.searchParams.get("debtId");
//     if (!debtId) {
//       return NextResponse.json(
//         { error: "Missing debtId query parameter" },
//         { status: 400 }
//       );
//     }

//     // Ensure the debt belongs to this user
//     const record = await prisma.debt.findUnique({
//       where: { id: debtId },
//       select: {
//         userId: true,
//         payments: {
//           orderBy: { date: "desc" },
//         },
//       },
//     });

//     if (!record || record.userId !== session.userId) {
//       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }

//     // Serialize Decimals
//     const serialized = record.payments.map((p) => ({
//       id: p.id,
//       debtId: p.debtId,
//       userId: p.userId,
//       amount: p.amount.toNumber(),
//       date: p.date.toISOString(),
//       notes: p.notes,
//     }));

//     return NextResponse.json(serialized);
//   } catch (err) {
//     console.error("[PAYMENTS_GET] Error details:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch payments" },
//       { status: 500 }
//     );
//   }
// }

// // POST /api/payments
// export async function POST(req: Request) {
//   try {
//     const session = await auth();
//     if (!session || !session.userId) {
//       return new NextResponse(
//         JSON.stringify({
//           error: "Unauthorized - Please sign in to continue",
//           details: "No valid user session found",
//         }),
//         {
//           status: 401,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     const { debtId, amount, date, notes } = await req.json();
//     if (!debtId || !amount) {
//       return new NextResponse(
//         JSON.stringify({
//           error: "Missing required fields",
//           details: "Both debtId and amount are required",
//         }),
//         {
//           status: 400,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       // Verify ownership
//       const debt = await tx.debt.findFirst({
//         where: {
//           id: String(debtId),
//           userId: session.userId,
//         },
//       });
//       if (!debt) throw new Error("Debt not found or unauthorized");

//       // Prevent duplicate
//       const existing = await tx.debt_payment.findFirst({
//         where: {
//           debtId: String(debtId),
//           amount: Number(amount),
//           date: date ? new Date(date) : new Date(),
//           userId: session.userId,
//         },
//       });
//       if (existing) {
//         throw new Error(
//           "A payment with the same amount and date already exists"
//         );
//       }

//       // Create payment
//       const payment = await tx.debt_payment.create({
//         data: {
//           debtId: String(debtId),
//           userId: session.userId,
//           amount: Number(amount),
//           date: date ? new Date(date) : new Date(),
//           notes: notes || null,
//         },
//       });

//       // Update debt balance
//       const updatedDebt = await tx.debt.update({
//         where: { id: String(debtId) },
//         data: {
//           currentBalance: { decrement: Number(amount) },
//         },
//       });

//       // Fetch all payments now
//       const allPayments = await tx.debt_payment.findMany({
//         where: {
//           debtId: String(debtId),
//           userId: session.userId,
//         },
//         orderBy: { date: "desc" },
//       });

//       return {
//         updatedDebt: {
//           ...updatedDebt,
//           balance: Number(updatedDebt.balance),
//           currentBalance: Number(updatedDebt.currentBalance),
//           interestRate: Number(updatedDebt.interestRate),
//           minimumPayment: Number(updatedDebt.minimumPayment),
//           extraPayment: updatedDebt.extraPayment
//             ? Number(updatedDebt.extraPayment)
//             : null,
//           dueDate: updatedDebt.dueDate,
//           payments: allPayments.map((p) => ({
//             id: p.id,
//             debtId: p.debtId,
//             userId: p.userId,
//             amount: p.amount.toNumber(),
//             date: p.date.toISOString(),
//             notes: p.notes,
//           })),
//         },
//       };
//     });

//     return NextResponse.json(result);
//   } catch (err: unknown) {
//     console.error("[PAYMENTS_POST] Error details:", err);
//     const error = err instanceof Error ? err : new Error("Unknown error");
//     return new NextResponse(
//       JSON.stringify({
//         error: error.message,
//         details: error.stack,
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/payments?debtId=…
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const debtId = url.searchParams.get("debtId");
    if (!debtId) {
      return NextResponse.json(
        { error: "Missing debtId query parameter" },
        { status: 400 }
      );
    }

    // Ensure the debt belongs to this user
    const record = await prisma.debt.findUnique({
      where: { id: debtId },
      select: {
        userId: true,
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!record || record.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Serialize Decimals
    const serialized = record.payments.map((p) => ({
      id: p.id,
      debtId: p.debtId,
      userId: p.userId,
      amount: p.amount.toNumber(),
      date: p.date.toISOString(),
      notes: p.notes,
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[PAYMENTS_GET] Error details:", err);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized - Please sign in to continue",
          details: "No valid user session found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { debtId, amount, date, notes } = await req.json();
    if (!debtId || !amount) {
      return new NextResponse(
        JSON.stringify({
          error: "Missing required fields",
          details: "Both debtId and amount are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify ownership
      const debt = await tx.debt.findFirst({
        where: {
          id: String(debtId),
          userId: session.userId,
        },
      });
      if (!debt) throw new Error("Debt not found or unauthorized");

      // Prevent duplicate
      const existing = await tx.debt_payment.findFirst({
        where: {
          debtId: String(debtId),
          date: date ? new Date(date + 'T00:00:00') : new Date(),
          userId: session.userId,
        },
      });
      if (existing) {
        throw new Error(
          "A payment already exists for this date"
        );
      }

      // Create payment
      const payment = await tx.debt_payment.create({
        data: {
          debtId: String(debtId),
          userId: session.userId,
          amount: Number(amount),
          date: date ? new Date(date + 'T00:00:00') : new Date(),
          notes: notes || null,
        },
      });

      // Update debt balance
      const updatedDebt = await tx.debt.update({
        where: { id: String(debtId) },
        data: {
          currentBalance: { decrement: Number(amount) },
        },
      });

      // Fetch all payments now
      const allPayments = await tx.debt_payment.findMany({
        where: {
          debtId: String(debtId),
          userId: session.userId,
        },
        orderBy: { date: "desc" },
      });

      return {
        updatedDebt: {
          ...updatedDebt,
          balance: Number(updatedDebt.balance),
          currentBalance: Number(updatedDebt.currentBalance),
          interestRate: Number(updatedDebt.interestRate),
          minimumPayment: Number(updatedDebt.minimumPayment),
          extraPayment: updatedDebt.extraPayment
            ? Number(updatedDebt.extraPayment)
            : null,
          dueDate: updatedDebt.dueDate,
          payments: allPayments.map((p) => ({
            id: p.id,
            debtId: p.debtId,
            userId: p.userId,
            amount: p.amount.toNumber(),
            date: p.date.toISOString(),
            notes: p.notes,
          })),
        },
      };
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[PAYMENTS_POST] Error details:", err);
    const error = err instanceof Error ? err : new Error("Unknown error");
    return new NextResponse(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
