// app/api/plaid/transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { plaidClient } from "@/lib/plaid";
import dayjs from "dayjs"; // install this with `npm i dayjs` if you haven’t

export async function GET() {
  try {
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

    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 100,
        offset: 0,
      },
    });

    return NextResponse.json(response.data.transactions);
  } catch (error: any) {
    console.error("PLAID TRANSACTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
