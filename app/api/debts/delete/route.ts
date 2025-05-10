import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { debtId } = await req.json();
        
        // Delete the debt directly using Prisma
        await prisma.debt.delete({
            where: {
                id: debtId,
                userId: session.userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting debt:', error);
        return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
    }
} 