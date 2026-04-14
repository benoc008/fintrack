import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  PieChart, 
  Target, 
  TrendingUp, 
  Download, 
  FileJson,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { FinancialState, INITIAL_STATE, Transaction } from './lib/types';
import { exportState, importState } from './lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from './components/Dashboard';
import Uploader from './components/Uploader';
import Analysis from './components/Analysis';
import Planning from './components/Planning';

import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [state, setState] = useState<FinancialState>(() => {
    const saved = localStorage.getItem('fintrack_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('fintrack_state', JSON.stringify(state));
  }, [state]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newState = await importState(file);
      setState(newState);
      toast.success("Data imported successfully");
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error("Failed to import data");
    }
  };

  const handleExport = () => {
    exportState(state);
    toast.success("Data exported successfully");
  };

  const addTransactions = (newTransactions: Transaction[]) => {
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, ...newTransactions],
      lastUpdated: new Date().toISOString()
    }));
    toast.success(`Added ${newTransactions.length} transactions`);
  };

  const confirmClearData = () => {
    setState(INITIAL_STATE);
    toast.info("All data cleared");
    setIsClearDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <Toaster position="top-right" />
      
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your 
              financial transactions, goals, and retirement plans from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="default" 
              size="default"
              onClick={confirmClearData} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinTrack Secure</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download size={16} />
              Export
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson size={16} />
                Import
              </Button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsClearDialogOpen(true)} className="text-destructive hover:bg-destructive/10">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-white border shadow-sm">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload size={16} />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <PieChart size={16} />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="planning" className="gap-2">
                <Target size={16} />
                <span className="hidden sm:inline">Planning</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <Dashboard state={state} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Uploader onTransactionsProcessed={addTransactions} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Analysis state={state} />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <Planning state={state} onUpdateRetirement={(r) => setState(p => ({ ...p, retirement: r }))} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FinTrack Secure &copy; {new Date().getFullYear()} - All data stays in your browser and your exports.</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <AlertCircle size={14} />
            No database, no cloud, no tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}
