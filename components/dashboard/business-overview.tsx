"use client"

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BusinessOverview() {
  const businesses = [
    { name: 'Business A', expenses: 5000, income: 8000 },
    { name: 'Business B', expenses: 3000, income: 6000 },
    { name: 'Business C', expenses: 2000, income: 4000 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
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
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}