import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowUp, ArrowDown } from "lucide-react";

interface SummaryData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
}

export function SummaryCards() {
  const { data: summary, isLoading } = useQuery<SummaryData>({
    queryKey: ['/api/transactions/summary'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-sm" data-testid="card-total-balance">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance Total</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-total-balance">
                {summary ? formatCurrency(summary.totalBalance) : '$0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Wallet className="text-primary text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm" data-testid="card-monthly-income">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-green-600" data-testid="text-monthly-income">
                {summary ? formatCurrency(summary.monthlyIncome) : '$0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUp className="text-green-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm" data-testid="card-monthly-expenses">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gastos del Mes</p>
              <p className="text-2xl font-bold text-red-600" data-testid="text-monthly-expenses">
                {summary ? formatCurrency(summary.monthlyExpenses) : '$0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDown className="text-red-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
