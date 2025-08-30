import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, BarChart3, TrendingUp, TrendingDown, Shield, Info } from "lucide-react";
import { SummaryCards } from "@/components/summary-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VisitorDashboard() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
  });

  const { data: summary } = useQuery({
    queryKey: ['/api/transactions/summary'],
  });

  // Calculate anonymous statistics
  const totalTransactions = transactions.length;
  const incomeTransactions = transactions.filter((t: any) => t.type === 'income').length;
  const expenseTransactions = transactions.filter((t: any) => t.type === 'expense').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <span>Vista General - Reportes</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista de solo lectura con datos anónimos para auditoría y consulta
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Eye className="w-4 h-4 mr-1" />
          Visitante
        </Badge>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <strong>Modo Solo Lectura:</strong> Los datos mostrados son anónimos y no permiten identificar usuarios específicos. 
          No tienes permisos para agregar, modificar o eliminar información.
        </AlertDescription>
      </Alert>

      {/* Summary Cards - Anonymous View */}
      <SummaryCards />

      {/* Visitor-specific statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Transacciones en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{incomeTransactions}</div>
            <p className="text-xs text-muted-foreground">Registros de ingresos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expenseTransactions}</div>
            <p className="text-xs text-muted-foreground">Registros de gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Solo Lectura</div>
            <p className="text-xs text-muted-foreground">Sin edición</p>
          </CardContent>
        </Card>
      </div>

      {/* Anonymous Data View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Datos Financieros Anónimos</span>
          </CardTitle>
          <CardDescription>
            Vista general de todas las transacciones sin información personal identificable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Como visitante, puedes ver todos los movimientos financieros del sistema pero sin poder identificar 
                a qué usuario pertenecen. No tienes acceso a formularios de edición, botones de agregar o eliminar datos.
              </AlertDescription>
            </Alert>
            
            {/* Simple list view without edit capabilities */}
            <div className="rounded-md border">
              <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm bg-muted">
                <div>Tipo</div>
                <div>Monto</div>
                <div>Descripción</div>
                <div>Fecha</div>
              </div>
              <div className="divide-y">
                {transactions.slice(0, 10).map((transaction: any, index: number) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm">
                    <div>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </div>
                    <div className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      ${parseFloat(transaction.amount).toLocaleString()}
                    </div>
                    <div className="truncate">{transaction.description}</div>
                    <div className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              {transactions.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Mostrando 10 de {transactions.length} registros
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}