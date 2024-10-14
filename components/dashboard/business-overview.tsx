"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTransactionStore } from '@/store/transactionStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BusinessData {
  name: string;
  expenses: number;
  income: number;
}

export function BusinessOverview() {
  const { transactions } = useTransactionStore();
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);

  useEffect(() => {
    const businessTotals = transactions.reduce((acc, transaction) => {
      if (transaction.businessId) {
        if (!acc[transaction.businessId]) {
          acc[transaction.businessId] = { expenses: 0, income: 0 };
        }
        if (transaction.amount < 0) {
          acc[transaction.businessId].expenses += Math.abs(transaction.amount);
        } else {
          acc[transaction.businessId].income += transaction.amount;
        }
      }
      return acc;
    }, {} as Record<string, { expenses: number; income: number }>);

    const formattedData = Object.entries(businessTotals).map(([name, data]) => ({
      name,
      expenses: parseFloat(data.expenses.toFixed(2)),
      income: parseFloat(data.income.toFixed(2)),
    }));

    setBusinessData(formattedData);
  }, [transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {businessData.map((business) => (
        <Card key={business.name}>
          <CardHeader>
            <CardTitle>{business.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={{
                labels: ['Expenses', 'Income'],
                datasets: [
                  {
                    data: [business.expenses, business.income],
                    backgroundColor: ['hsl(var(--destructive))', 'hsl(var(--primary))'],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw as number;
                        return `$${value.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: { 
                  y: { 
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `$${value}`
                    }
                  } 
                },
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
