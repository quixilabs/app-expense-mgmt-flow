"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';

export function ReportGenerator() {
  const [reportType, setReportType] = useState('');
  const [business, setBusiness] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { toast } = useToast();

  const handleGenerateReport = () => {
    if (!reportType || !business || !startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    // Here you would typically generate the report on the backend
    // For this example, we'll just show a success message
    toast({
      title: 'Report Generated',
      description: `${reportType} report for ${business} from ${startDate.toDateString()} to ${endDate.toDateString()} has been generated.`,
    });

    // Simulating a download
    setTimeout(() => {
      const blob = new Blob(['Your report data would be here'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType.toLowerCase().replace(' ', '_')}_${business.toLowerCase().replace(' ', '_')}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }, 1000);
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
              <SelectItem value="Profit and Loss">Profit and Loss</SelectItem>
              <SelectItem value="Balance Sheet">Balance Sheet</SelectItem>
              <SelectItem value="Cash Flow">Cash Flow</SelectItem>
              <SelectItem value="Expense Report">Expense Report</SelectItem>
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
              <SelectItem value="Business A">Business A</SelectItem>
              <SelectItem value="Business B">Business B</SelectItem>
              <SelectItem value="Business C">Business C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date Range</Label>
          <div className="flex space-x-4">
            <DatePicker
              selected={startDate}
              onSelect={setStartDate}
              placeholderText="Start Date"
            />
            <DatePicker
              selected={endDate}
              onSelect={setEndDate}
              placeholderText="End Date"
            />
          </div>
        </div>
        <Button onClick={handleGenerateReport}>Generate Report</Button>
      </CardContent>
    </Card>
  );
}