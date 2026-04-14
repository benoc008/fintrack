import React, { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  Calculator, 
  PiggyBank,
  ArrowRight,
  Info,
  Plus
} from 'lucide-react';
import { FinancialState, RetirementPlan } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanningProps {
  state: FinancialState;
  onUpdateRetirement: (plan: RetirementPlan) => void;
}

export default function Planning({ state, onUpdateRetirement }: PlanningProps) {
  const currencies = useMemo(() => {
    const set = new Set(state.transactions.map(t => t.currency));
    if (set.size === 0) set.add('USD');
    return Array.from(set);
  }, [state.transactions]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencies[0] || 'USD');
  const [retirement, setRetirement] = useState(state.retirement);

  const calculateRetirement = () => {
    const yearsToRetire = retirement.retirementAge - retirement.currentAge;
    const monthsToRetire = Math.max(0, yearsToRetire * 12);
    const monthlyRate = retirement.expectedReturn / 100 / 12;
    
    // Future Value Formula: FV = P * [((1 + r)^n - 1) / r]
    let futureValue = 0;
    if (monthlyRate > 0) {
      futureValue = retirement.monthlyContribution * 
        ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
    } else {
      futureValue = retirement.monthlyContribution * monthsToRetire;
    }
    
    // Monthly income from nest egg (4% rule)
    const monthlyIncome = (futureValue * 0.04) / 12;
    
    return {
      nestEgg: futureValue,
      monthlyIncome: monthlyIncome,
      isTargetMet: monthlyIncome >= retirement.targetMonthlyIncome
    };
  };

  const results = calculateRetirement();

  const handleUpdate = (field: keyof RetirementPlan, value: number) => {
    const newPlan = { ...retirement, [field]: value };
    setRetirement(newPlan);
    onUpdateRetirement(newPlan);
  };

  const formatCurrency = (amount: number, currency: string) => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Financial Planning</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Planning Currency:</span>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Retirement Calculator */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Retirement Planning
            </CardTitle>
            <CardDescription>Estimate your future nest egg in {selectedCurrency}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentAge">Current Age</Label>
                <Input 
                  id="currentAge" 
                  type="number" 
                  value={retirement.currentAge} 
                  onChange={(e) => handleUpdate('currentAge', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retirementAge">Retirement Age</Label>
                <Input 
                  id="retirementAge" 
                  type="number" 
                  value={retirement.retirementAge} 
                  onChange={(e) => handleUpdate('retirementAge', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contribution">Monthly Contribution ({selectedCurrency})</Label>
              <Input 
                id="contribution" 
                type="number" 
                value={retirement.monthlyContribution} 
                onChange={(e) => handleUpdate('monthlyContribution', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return">Expected Annual Return (%)</Label>
              <Input 
                id="return" 
                type="number" 
                step="0.1"
                value={retirement.expectedReturn} 
                onChange={(e) => handleUpdate('expectedReturn', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Monthly Income ({selectedCurrency})</Label>
              <Input 
                id="target" 
                type="number" 
                value={retirement.targetMonthlyIncome} 
                onChange={(e) => handleUpdate('targetMonthlyIncome', parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Retirement Results */}
        <Card className="border-none shadow-sm bg-black text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Projection Results</CardTitle>
            <CardDescription className="text-white/60">Based on your inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wider font-medium">Estimated Nest Egg</p>
              <p className="text-4xl font-bold mt-1">
                {formatCurrency(results.nestEgg, selectedCurrency)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/10">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wider">Monthly Income (4% Rule)</p>
                <p className="text-xl font-bold">{formatCurrency(results.monthlyIncome, selectedCurrency)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Target</span>
                <span>{Math.min(100, Math.round((results.monthlyIncome / (retirement.targetMonthlyIncome || 1)) * 100))}%</span>
              </div>
              <Progress 
                value={(results.monthlyIncome / (retirement.targetMonthlyIncome || 1)) * 100} 
                className="bg-white/20 h-2"
              />
              <p className="text-xs text-white/60 italic mt-2">
                {results.isTargetMet 
                  ? "Great! Your current plan meets your target income." 
                  : `You need to save ${formatCurrency(Math.max(0, retirement.targetMonthlyIncome - results.monthlyIncome), selectedCurrency)} more per month to reach your goal.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Savings Goals
            </CardTitle>
            <CardDescription>Track your progress towards specific financial targets</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus size={14} />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {state.goals.length > 0 ? (
              state.goals.map((goal, index) => (
                <div key={goal.id || index} className="p-4 rounded-xl border bg-muted/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{goal.name}</h4>
                    <Badge variant="secondary">{Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100)}%</Badge>
                  </div>
                  <Progress value={(goal.currentAmount / (goal.targetAmount || 1)) * 100} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount, selectedCurrency)} saved</span>
                    <span>Target: {formatCurrency(goal.targetAmount, selectedCurrency)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">No specific savings goals added yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
