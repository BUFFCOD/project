import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import type { CountryCode, Products } from "plaid";

// Dynamically use .env.local values
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

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "BudgetWize",
      products: ["auth", "transactions", "liabilities"] as Products[],
      country_codes: ["US"] as CountryCode[],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Link token creation error:", error);
    return NextResponse.json(
      { error: "Unable to create link token" },
      { status: 500 }
    );
  }
}
