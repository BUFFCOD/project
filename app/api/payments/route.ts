import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.userId) {
            return new NextResponse(JSON.stringify({ 
                error: 'Unauthorized - Please sign in to continue',
                details: 'No valid user session found'
            }), { 
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const body = await req.json();
        const { debtId, amount, date, notes } = body;

        if (!debtId || !amount) {
            return new NextResponse(JSON.stringify({ 
                error: 'Missing required fields',
                details: 'Both debtId and amount are required'
            }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Start a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Verify and get the current debt
            const debt = await tx.debt.findFirst({
                where: { 
                    id: String(debtId),
                    userId: String(session.userId)
                }
            });

            if (!debt) {
                throw new Error('Debt not found or unauthorized');
            }

            // Check if a payment with the same amount and date already exists
            const existingPayment = await tx.debt_payment.findFirst({
                where: {
                    debtId: String(debtId),
                    amount: Number(amount),
                    date: date ? new Date(date) : new Date(),
                    userId: String(session.userId)
                }
            });

            if (existingPayment) {
                throw new Error('A payment with the same amount and date already exists');
            }

            // Create the payment
            const payment = await tx.debt_payment.create({
                data: {
                    debtId: String(debtId),
                    userId: String(session.userId),
                    amount: Number(amount),
                    date: date ? new Date(date) : new Date(),
                    notes: notes || null
                }
            });

            // Update the debt balance
            const updatedDebt = await tx.debt.update({
                where: { 
                    id: String(debtId),
                    userId: String(session.userId)
                },
                data: {
                    currentBalance: {
                        decrement: Number(amount)
                    }
                }
            });

            // Get all payments for this debt
            const allPayments = await tx.debt_payment.findMany({
                where: {
                    debtId: String(debtId),
                    userId: String(session.userId)
                },
                orderBy: {
                    date: 'desc'
                }
            });

            // Format the response
            return {
                updatedDebt: {
                    ...updatedDebt,
                    currentBalance: Number(updatedDebt.currentBalance),
                    balance: Number(updatedDebt.balance),
                    interestRate: Number(updatedDebt.interestRate),
                    minimumPayment: Number(updatedDebt.minimumPayment),
                    extraPayment: updatedDebt.extraPayment ? Number(updatedDebt.extraPayment) : null,
                    dueDate: updatedDebt.dueDate,
                    payments: allPayments.map(payment => ({
                        ...payment,
                        amount: Number(payment.amount),
                        date: new Date(payment.date).toISOString(),
                        notes: payment.notes || null
                    }))
                }
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[PAYMENTS_POST] Error details:', error);
        return new NextResponse(JSON.stringify({ 
            error: error.message,
            details: error.stack
        }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.userId) {
            return new NextResponse(JSON.stringify({ 
                error: 'Unauthorized - Please sign in to continue',
                details: 'No valid user session found'
            }), { 
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const { searchParams } = new URL(req.url);
        const debtId = searchParams.get('debtId');

        if (!debtId) {
            return new NextResponse(JSON.stringify({ 
                error: 'Missing required parameter',
                details: 'debtId is required'
            }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const payments = await prisma.debt_payment.findMany({
            where: {
                userId: String(session.userId),
                debtId: String(debtId)
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Format the payments to ensure consistent data types
        const formattedPayments = payments.map(payment => ({
            ...payment,
            date: new Date(payment.date).toISOString(),
            amount: Number(payment.amount),
            notes: payment.notes || null
        }));

        return NextResponse.json(formattedPayments);
    } catch (error) {
        console.error('[PAYMENTS_GET] Error details:', error);
        return new NextResponse(JSON.stringify({ 
            error: error.message,
            details: error.stack
        }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 