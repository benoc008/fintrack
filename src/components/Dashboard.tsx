import React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  History,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { FinancialState, Transaction } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface DashboardProps {
  state: FinancialState;
}

export default function Dashboard({ state }: DashboardProps) {
  const currencies = Array.from(new Set(state.transactions.map(t => t.currency)));
  
  const totalsByCurrency = currencies.map(curr => {
    const currTransactions = state.transactions.filter(t => t.currency === curr);
    const balance = currTransactions.reduce((acc, t) => acc + t.amount, 0);
    const income = currTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = Math.abs(currTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0));
    
    return { currency: curr, balance, income, expenses };
  });

  const recentTransactions = [...state.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {totalsByCurrency.length > 0 ? (
        <div className="space-y-6">
          {totalsByCurrency.map((total, index) => (
            <div key={total.currency || index} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Badge variant="outline" className="bg-white font-bold text-xs">
                  {total.currency}
                </Badge>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Balance ({total.currency})</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(total.balance, total.currency)}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Income ({total.currency})</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(total.income, total.currency)}</div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expenses ({total.currency})</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-rose-600">{formatCurrency(total.expenses, total.currency)}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-white opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((t, index) => (
                  <TableRow key={t.id || index}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(t.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs uppercase tracking-wider">
                      {t.account}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(t.amount, t.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Upload your bank statements to see your financial history here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
