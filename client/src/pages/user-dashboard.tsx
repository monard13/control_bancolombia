import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, DollarSign, TrendingUp, TrendingDown, Plus, Wallet } from "lucide-react";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";

export default function UserDashboard() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
  });

  const { data: summary } = useQuery({
    queryKey: ['/api/transactions/summary'],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Wallet className="w-8 h-8 text-primary" />
            <span>Mi Billetera</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus finanzas personales - Solo puedes agregar ingresos
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <User className="w-4 h-4 mr-1" />
          Usuario
        </Badge>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* User-specific permissions info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Personal</div>
            <p className="text-xs text-muted-foreground">Solo tus datos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agregar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ingresos</div>
            <p className="text-xs text-muted-foreground">Permitido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editar/Eliminar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">Restringido</div>
            <p className="text-xs text-muted-foreground">No permitido</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Income Button */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <Plus className="w-5 h-5" />
            <span>Agregar Nuevo Ingreso</span>
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Como usuario, solo puedes registrar ingresos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            asChild 
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-add-income"
          >
            <a href="/add-transaction">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Ingreso
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Personal Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Mis Movimientos Financieros</span>
          </CardTitle>
          <CardDescription>
            Vista de tus transacciones personales (solo lectura para edición/eliminación)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable canEdit={false} canDelete={false} canExport={false} />
        </CardContent>
      </Card>
    </div>
  );
}