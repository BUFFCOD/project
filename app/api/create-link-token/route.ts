import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import type { CountryCode, Products } from "plaid";

// Check for required environment variables
const requiredEnv = ["PLAID_ENV", "PLAID_CLIENT_ID", "PLAID_SECRET"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
});

// Setup Plaid configuration
const plaidEnv = process.env.PLAID_ENV || "production";
const clientId = process.env.PLAID_CLIENT_ID || "";
const secret = process.env.PLAID_SECRET || "";

const config = new Configuration({
  basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": clientId,
      "PLAID-SECRET": secret,
    },
  },
});

const plaidClient = new PlaidApi(config);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "BudgetWize",
      products: ["transactions", "liabilities"] as Products[],
      country_codes: ["US"] as CountryCode[],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error("🔴 Plaid linkTokenCreate failed:", {
      message: error?.response?.data || error.message || error,
    });

    return NextResponse.json(
      {
        error: "Unable to create link token. See logs for details.",
      },
      { status: 500 }
    );
  }
}
