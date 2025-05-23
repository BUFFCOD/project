// export const runtime = "nodejs";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { plaidClient } from "@/lib/plaid";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL_NAME = "gemini-1.5-pro";
  if (!API_KEY)
    return NextResponse.json(
      { error: "Missing Gemini API key" },
      { status: 500 }
    );

  try {
    // 1) Fetch financial data context
    const transactions = await prisma.plaidtransaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    });

    const accounts: Array<{
      name: string;
      balances?: { available?: number; current?: number };
    }> = [];

    const item = await prisma.userplaiditem.findUnique({ where: { userId } });

    if (item) {
      const token = decrypt(item.encryptedAccessToken);
      const resp = await plaidClient.accountsGet({ access_token: token });

      const safeAccounts = resp.data.accounts.map((ac) => ({
        name: ac.name,
        balances: {
          available: ac.balances.available ?? undefined,
          current: ac.balances.current ?? undefined,
        },
      }));

      accounts.push(...safeAccounts);
    }

    // 2) Build context string for LLM
    const contextLines: string[] = [];

    if (accounts.length) {
      contextLines.push("Accounts:");
      accounts.forEach((a) =>
        contextLines.push(
          `- ${a.name}: $${(
            a.balances?.available ??
            a.balances?.current ??
            0
          ).toFixed(2)}`
        )
      );
    }

    if (transactions.length) {
      contextLines.push("Recent Transactions:");
      transactions.forEach((t) =>
        contextLines.push(
          `- ${t.name}: $${t.amount} on ${t.date
            .toISOString()
            .split("T")[0]}`
        )
      );
    }

    const financialContext = contextLines.join("\n");

    // 3) Read user message
    const { message } = await request.json();

    const systemInstruction = `You are a financial advisor. Use the provided Accounts and Recent Transactions to answer the user's question. Provide clear, actionable advice and include appropriate disclaimers.`;

    const userPrompt = financialContext
      ? `${systemInstruction}\n\n${message}\n\n${financialContext}`
      : `${systemInstruction}\n\n${message}`;

    // 4) Call Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    });

    const result = await response.response;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("Chat API Error:", e?.response?.data || e.message || e);
    return NextResponse.json(
      {
        error: "AI error",
        details: e?.response?.data?.error?.message || e.message || "Unknown",
      },
      { status: 500 }
    );
  }
}
