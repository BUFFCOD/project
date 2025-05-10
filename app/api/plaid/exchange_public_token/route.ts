// /app/api/plaid/exchange_public_token/route.ts (or under pages/api if you're not using app router)

import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Configure Plaid Client
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});
const plaidClient = new PlaidApi(config);

// In-memory storage for demo (use a real DB/session store later)
let access_token: string | null = null;

export async function POST(req: NextRequest) {
  const { public_token } = await req.json();

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    access_token = response.data.access_token;
    return NextResponse.json({ access_token }); // For debug/demo
  } catch (error) {
    console.error("Exchange error:", error);
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
