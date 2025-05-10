import { NextRequest, NextResponse } from "next/server";

// GET: Return sample debts
export async function GET() {
  const sampleData = [
    {
      id: "1",
      name: "Credit Card",
      balance: 1200,
      currentBalance: 1200,
      interestRate: 15.5,
      minimumPayment: 50,
      dueDate: new Date().toISOString(),
      extraPayment: null,
      payments: [],
    },
    {
      id: "2",
      name: "Student Loan",
      balance: 8000,
      currentBalance: 8000,
      interestRate: 4.5,
      minimumPayment: 100,
      dueDate: new Date().toISOString(),
      extraPayment: null,
      payments: [],
    }
  ];

  return NextResponse.json(sampleData);
}

// POST: Simulate saving a new debt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newDebt = {
      ...body,
      id: Date.now().toString(), // Simulate unique ID
      currentBalance: body.balance,
      payments: [],
    };

    return NextResponse.json(newDebt, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 400 }
    );
  }
}
