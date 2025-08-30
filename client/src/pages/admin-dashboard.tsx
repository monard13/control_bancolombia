import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, TrendingDown, Settings, Shield } from "lucide-react";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";

export default function AdminDashboard() {
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
            <Shield className="w-8 h-8 text-primary" />
            <span>Dashboard de Administrador</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Control total sobre la aplicación y todos los datos financieros
          </p>
        </div>
        <Badge variant="default" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Admin-specific cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Completo</div>
            <p className="text-xs text-muted-foreground">Acceso total a datos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edición</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">Agregar, modificar, eliminar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestión</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">Administrar usuarios</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Todos los Movimientos Financieros</span>
          </CardTitle>
          <CardDescription>
            Vista completa de todas las transacciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable canEdit={true} canDelete={true} />
        </CardContent>
      </Card>
    </div>
  );
}