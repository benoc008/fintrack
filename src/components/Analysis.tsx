import { useMemo, useState } from 'react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { FinancialState, Transaction } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AnalysisProps {
  state: FinancialState;
}

const COLORS = [
  '#000000', '#4B5563', '#9CA3AF', '#D1D5DB', 
  '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', 
  '#EC4899', '#F43F5E', '#F97316', '#EAB308'
];

export default function Analysis({ state }: AnalysisProps) {
  const currencies = useMemo(() => Array.from(new Set(state.transactions.map(t => t.currency))), [state.transactions]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencies[0] || 'USD');

  // Update selected currency if it's no longer in the list or if list was empty and now has items
  useMemo(() => {
    if (currencies.length > 0 && !currencies.includes(selectedCurrency)) {
      setSelectedCurrency(currencies[0]);
    }
  }, [currencies]);

  const filteredTransactions = useMemo(() => 
    state.transactions.filter(t => t.currency === selectedCurrency),
    [state.transactions, selectedCurrency]
  );

  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  
  // Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Monthly Trends
  const monthlyData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = new Date(sorted[0].date);
    const end = new Date();
    
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStr = format(month, 'MMM yyyy');
      const monthTransactions = filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = Math.abs(monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0));
      
      return {
        name: monthStr,
        income,
        expense,
        savings: income - expense
      };
    }).slice(-6); // Last 6 months
  }, [filteredTransactions]);

  // Outliers
  const outliers = useMemo(() => {
    const avg = expenses.reduce((acc, t) => acc + Math.abs(t.amount), 0) / (expenses.length || 1);
    return expenses
      .filter(t => Math.abs(t.amount) > avg * 3)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Financial Analysis</h2>
        {currencies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[120px] bg-white">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expense Breakdown ({selectedCurrency})</CardTitle>
            <CardDescription>Where your money goes by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${selectedCurrency} ${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Income vs Expenses ({selectedCurrency})</CardTitle>
            <CardDescription>Monthly financial performance</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Savings Development */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Savings Development ({selectedCurrency})</CardTitle>
          <CardDescription>Cumulative savings over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="savings" 
                stroke="#000000" 
                fillOpacity={1} 
                fill="url(#colorSavings)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Outliers */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Large Expenses (Outliers) - {selectedCurrency}</CardTitle>
          <CardDescription>Transactions significantly higher than your average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {outliers.map((t, index) => (
              <div key={t.id || index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                <div className="flex flex-col">
                  <span className="font-medium">{t.description}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(t.date), 'MMMM dd, yyyy')} • {t.category}</span>
                </div>
                <span className="font-bold text-rose-600">-{selectedCurrency} {Math.abs(t.amount).toFixed(2)}</span>
              </div>
            ))}
            {outliers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No significant outliers found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
