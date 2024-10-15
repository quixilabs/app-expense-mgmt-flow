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
import { getTransactions, getBusinesses, Transaction, Business } from '@/utils/storeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BusinessData {
  id: string;
  name: string;
  expenses: number;
  income: number;
}

export function BusinessOverview() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [transactionData, businessData] = await Promise.all([
          getTransactions(),
          getBusinesses()
        ]);
        setTransactions(transactionData);
        setBusinesses(businessData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const businessMap = new Map(businesses.map(b => [b.id, b.name]));
    const businessTotals = transactions.reduce((acc, transaction) => {
      if (transaction.business_id) {
        if (!acc[transaction.business_id]) {
          acc[transaction.business_id] = { 
            id: transaction.business_id,
            name: businessMap.get(transaction.business_id) || 'Unknown Business',
            expenses: 0, 
            income: 0 
          };
        }
        if (Number(transaction.amount) < 0) {
          acc[transaction.business_id].expenses += Math.abs(Number(transaction.amount));
        } else {
          acc[transaction.business_id].income += Number(transaction.amount);
        }
      }
      return acc;
    }, {} as Record<string, BusinessData>);

    const formattedData = Object.values(businessTotals).map(data => ({
      ...data,
      expenses: parseFloat(data.expenses.toFixed(2)),
      income: parseFloat(data.income.toFixed(2)),
    }));

    setBusinessData(formattedData);
  }, [transactions, businesses]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {businessData.map((business) => (
        <Card key={business.id}>
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
