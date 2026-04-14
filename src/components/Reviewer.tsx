import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Transaction, DEFAULT_CATEGORIES } from '../lib/types';
import { Check, X, AlertCircle, Trash2, Plus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface ReviewerProps {
  transactions: Transaction[];
  customCategories: string[];
  onConfirm: (transactions: Transaction[]) => void;
  onCancel: () => void;
  onAddCategory: (category: string) => void;
}

export default function Reviewer({ 
  transactions: initialTransactions, 
  customCategories,
  onConfirm, 
  onCancel,
  onAddCategory
}: ReviewerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const allCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES, 
    ...customCategories,
    ...transactions.map(t => t.category)
  ])).sort();

  const handleUpdate = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      if (pendingTransactionId) {
        handleUpdate(pendingTransactionId, 'category', newCategoryName.trim());
      }
      setNewCategoryName('');
      setPendingTransactionId(null);
      setIsNewCategoryDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Review Extracted Data</h3>
            <p className="text-sm text-blue-700">Please verify the transactions before adding them to your dashboard.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="bg-white">
            <X className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button onClick={() => onConfirm(transactions)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="mr-2 h-4 w-4" />
            Confirm {transactions.length} Transactions
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[150px]">Account</TableHead>
              <TableHead className="w-[100px]">Currency</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Input 
                    type="date" 
                    value={t.date} 
                    onChange={(e) => handleUpdate(t.id, 'date', e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={t.description} 
                    onChange={(e) => handleUpdate(t.id, 'description', e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={t.category} 
                    onValueChange={(value) => {
                      if (value === 'add-new') {
                        setPendingTransactionId(t.id);
                        setIsNewCategoryDialogOpen(true);
                      } else {
                        handleUpdate(t.id, 'category', value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value="add-new" className="text-blue-600 font-medium">
                        + Add New
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    value={t.account} 
                    onChange={(e) => handleUpdate(t.id, 'account', e.target.value)}
                    className="h-8 text-xs px-2"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={t.currency} 
                    onChange={(e) => handleUpdate(t.id, 'currency', e.target.value.toUpperCase())}
                    className="h-8 text-xs px-2 uppercase"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input 
                    type="number"
                    step="0.01"
                    value={t.amount} 
                    onChange={(e) => handleUpdate(t.id, 'amount', parseFloat(e.target.value) || 0)}
                    className={`h-8 text-xs px-2 text-right font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeTransaction(t.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
