"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

interface Debt {
    id: string;
    name: string;
    balance: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
    dueDate: Date;
    extraPayment: number | null;
    payments?: {
        id: string;
        amount: number;
        date: string;
        notes: string;
    }[];
}

interface DebtContextType {
    debts: Debt[];
    addDebt: (debt: Omit<Debt, 'id' | 'currentBalance'>) => Promise<void>;
    isLoading: boolean;
    fetchDebts: () => Promise<void>;
    error: string | null;
    setDebts: (debts: Debt[]) => void;
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export function DebtProvider({ children }: { children: ReactNode }) {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoaded: isUserLoaded } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchDebts = async () => {
        if (!user) {
            setDebts([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/debts');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch debts');
            }
            const data = await response.json();
            setDebts(data);
        } catch (error) {
            console.error('Error fetching debts:', error);
            setError(error instanceof Error ? error.message : 'Failed to load debts. Please try again.');
            setDebts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && isUserLoaded) {
            if (user) {
                fetchDebts();
            } else {
                setDebts([]);
                setIsLoading(false);
            }
        }
    }, [user, isUserLoaded, mounted]);

    const addDebt = async (newDebt: Omit<Debt, 'id' | 'currentBalance'>) => {
        if (!user) {
            throw new Error('User must be authenticated to add debts');
        }

        try {
            const response = await fetch('/api/debts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDebt),
            });

            if (!response.ok) throw new Error('Failed to add debt');
            
            const addedDebt = await response.json();
            
            // Update debts state by checking for duplicates
            setDebts(prevDebts => {
                // Check if the debt already exists
                const exists = prevDebts.some(debt => debt.id === addedDebt.id);
                if (exists) {
                    // If it exists, update it
                    return prevDebts.map(debt => 
                        debt.id === addedDebt.id ? addedDebt : debt
                    );
                } else {
                    // If it doesn't exist, add it
                    return [...prevDebts, addedDebt];
                }
            });
        } catch (error) {
            console.error('Error adding debt:', error);
            throw error;
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <DebtContext.Provider value={{ debts, addDebt, isLoading, fetchDebts, error, setDebts }}>
            {children}
        </DebtContext.Provider>
    );
}

export function useDebt() {
    const context = useContext(DebtContext);
    if (context === undefined) {
        throw new Error('useDebt must be used within a DebtProvider');
    }
    return context;
} 