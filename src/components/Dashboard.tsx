import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  History,
  TrendingUp,
  CreditCard,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { DEFAULT_CATEGORIES } from '../lib/types';

interface DashboardProps {
  state: FinancialState;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onAddCategory?: (category: string) => void;
}

export default function Dashboard({ state, onUpdateTransaction, onAddCategory }: DashboardProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterAccount, startDate, endDate]);

  const currencies = useMemo(() => Array.from(new Set(state.transactions.map(t => t.currency))), [state.transactions]);
  
  const allCategories = useMemo(() => {
    const fromTransactions = Array.from(new Set(state.transactions.map(t => t.category)));
    const customCats = state.customCategories || [];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats, ...fromTransactions])).sort();
  }, [state.transactions, state.customCategories]);

  const categories = useMemo(() => 
    Array.from(new Set(state.transactions.map(t => t.category))).sort(),
    [state.transactions]
  );

  const accounts = useMemo(() => 
    Array.from(new Set(state.transactions.map(t => t.account))).sort(),
    [state.transactions]
  );

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory(newCategoryName.trim());
      if (pendingTransactionId && onUpdateTransaction) {
        onUpdateTransaction(pendingTransactionId, { category: newCategoryName.trim() });
      }
      setNewCategoryName('');
      setPendingTransactionId(null);
      setIsNewCategoryDialogOpen(false);
    }
  };
  
  const totalsByCurrency = useMemo(() => currencies.map(curr => {
    const currTransactions = state.transactions.filter(t => t.currency === curr);
    const balance = currTransactions.reduce((acc, t) => acc + t.amount, 0);
    const income = currTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = Math.abs(currTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0));
    
    return { currency: curr, balance, income, expenses };
  }), [currencies, state.transactions]);

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesAccount = filterAccount === 'all' || t.account === filterAccount;
      
      let matchesDate = true;
      try {
        const tDate = parseISO(t.date);
        if (startDate && endDate) {
          matchesDate = isWithinInterval(tDate, { 
            start: startOfDay(parseISO(startDate)), 
            end: endOfDay(parseISO(endDate)) 
          });
        } else if (startDate) {
          matchesDate = tDate >= startOfDay(parseISO(startDate));
        } else if (endDate) {
          matchesDate = tDate <= endOfDay(parseISO(endDate));
        }
      } catch (e) {
        // If date is invalid, we just include it unless filters are set
        if (startDate || endDate) matchesDate = false;
      }

      return matchesCategory && matchesAccount && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, filterCategory, filterAccount, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const displayTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterAccount('all');
    setStartDate('');
    setEndDate('');
  };

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

      {/* Transactions Table */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {(filterCategory !== 'all' || filterAccount !== 'all' || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs gap-1">
                <X size={14} />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Account</label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">From</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="h-9 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">To</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="h-9 bg-white"
              />
            </div>
          </div>

          {displayTransactions.length > 0 ? (
            <div className="space-y-4">
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
                  {displayTransactions.map((t, index) => (
                    <TableRow key={t.id || index}>
                      <TableCell className="font-mono text-xs">
                        {(() => {
                          try {
                            return format(new Date(t.date), 'MMM dd, yyyy');
                          } catch (e) {
                            return t.date;
                          }
                        })()}
                      </TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>
                        <Select 
                          value={t.category} 
                          onValueChange={(value) => {
                            if (value === 'add-new') {
                              setPendingTransactionId(t.id);
                              setIsNewCategoryDialogOpen(true);
                            } else if (onUpdateTransaction) {
                              onUpdateTransaction(t.id, { category: value });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs border-none bg-transparent hover:bg-muted/50 px-2">
                            <Badge variant="secondary" className="font-normal pointer-events-none">
                              {t.category}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="add-new" className="text-blue-600 font-medium">
                              + Add New Category
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of <span className="font-medium">{filteredTransactions.length}</span> transactions
                  </p>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <div className="flex items-center justify-center h-8 px-3 text-xs font-medium border rounded-md bg-muted/20">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Try adjusting your filters or upload more statements.
              </p>
              {(filterCategory !== 'all' || filterAccount !== 'all' || startDate || endDate) && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a custom category to better organize your transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Category name (e.g., Subscriptions, Pets)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
