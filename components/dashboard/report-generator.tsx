"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { useTransactionStore } from '@/store/transactionStore';

export function ReportGenerator() {
  const [reportType, setReportType] = useState('');
  const [business, setBusiness] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [businesses, setBusinesses] = useState<string[]>([]);
  const { toast } = useToast();
  const { transactions } = useTransactionStore();

  useEffect(() => {
    const uniqueBusinesses = Array.from(new Set(transactions.map(t => t.businessId).filter(Boolean)));
    setBusinesses(uniqueBusinesses);
  }, [transactions]);

  useEffect(() => {
    console.log('Current state:', { reportType, business, startDate, endDate });
  }, [reportType, business, startDate, endDate]);

  const handleGenerateReport = () => {
    console.log('Generate Report button clicked');
    console.log('Current state:', { reportType, business, startDate, endDate });

    if (!reportType || !business || !startDate || !endDate) {
      console.log('Validation failed:', { reportType, business, startDate, endDate });
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Validation passed, filtering transactions');
    const filteredTransactions = transactions.filter(t => 
      t.businessId === business &&
      new Date(t.date) >= startDate &&
      new Date(t.date) <= endDate
    );
    console.log('Filtered transactions:', filteredTransactions);

    console.log('Generating CSV content');
    let csvContent = 'Date,Description,Amount\n';
    filteredTransactions.forEach(t => {
      if (
        (reportType === 'Income' && t.amount > 0) ||
        (reportType === 'Expense' && t.amount < 0) ||
        reportType === 'Full Report'
      ) {
        csvContent += `${t.date},${t.description},${t.amount}\n`;
      }
    });
    console.log('CSV content generated:', csvContent);

    console.log('Creating and downloading CSV file');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType.toLowerCase()}_${business}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('CSV file download initiated');
    } catch (error) {
      console.error('Error creating or downloading CSV:', error);
    }

    console.log('Showing success toast');
    toast({
      title: 'Report Generated',
      description: `${reportType} report for ${business} from ${startDate.toDateString()} to ${endDate.toDateString()} has been downloaded.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Financial Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Income">Income</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
              <SelectItem value="Full Report">Full Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="business">Business</Label>
          <Select value={business} onValueChange={setBusiness}>
            <SelectTrigger>
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date Range</Label>
          <div className="flex space-x-4">
            <DatePicker
              date={startDate}
              onDateChange={(date) => {
                console.log('Start date changed:', date);
                setStartDate(date);
              }}
            />
            <DatePicker
              date={endDate}
              onDateChange={(date) => {
                console.log('End date changed:', date);
                setEndDate(date);
              }}
            />
          </div>
        </div>
        <Button onClick={() => {
          handleGenerateReport();
        }}>
          Generate Report
        </Button>
      </CardContent>
    </Card>
  );
}