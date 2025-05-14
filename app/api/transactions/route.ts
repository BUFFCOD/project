// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";


// export async function GET() { 
//   const { userId } = await auth();
//   if (!userId)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   try {
//     // fetch last 50 transactions from the database
//     const transactions = await prisma.plaidtransaction.findMany({
//       where: { userId },
//       orderBy: { date: "desc" },
//       take: 50,
//     });

//     // optionally, you could fetch updated balances here, but we return transactions only
//     return NextResponse.json({ transactions });
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch transactions" },
//       { status: 500 }
//     );
//   }
// }

// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { auth }        from "@clerk/nextjs/server";
import prisma           from "@/lib/prisma";

export async function GET() {
  // 1) Enforce auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Load all your stored Plaid transactions
  const rows = await prisma.plaidtransaction.findMany({
    where:   { userId },
    orderBy: { date: "desc" },
  });

  // 3) Return every transaction — let the client bucket “Payment” vs expense/income
  return NextResponse.json({ transactions: rows });
}
