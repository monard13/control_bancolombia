import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Transaction } from "@shared/schema";
import { Search, Edit, Eye, Trash2, ChevronLeft, ChevronRight, Plus, ShoppingCart, Car, Zap, Download, Minus } from "lucide-react";

const categoryIcons = {
  'INGRESO': Plus,
  'EGRESO': Minus,
};

const categoryLabels = {
  'INGRESO': 'INGRESO',
  'EGRESO': 'EGRESO',
};

interface TransactionTableProps {
  showFilters?: boolean;
}

export function TransactionTable({ showFilters = true }: TransactionTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    period: 'month',
  });
  const [pagination, setPagination] = useState({
    limit: 25,
    offset: 0,
  });
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    type: '',
    category: '',
    date: '',
  });

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });
      
      Object.keys(params).forEach(key => {
        if (!params.get(key)) {
          params.delete(key);
        }
      });

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/summary'] });
      toast({
        title: "Transacción eliminada",
        description: "La transacción se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción.",
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/transactions/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/summary'] });
      setEditingTransaction(null);
      toast({
        title: "Transacción actualizada",
        description: "La transacción se ha actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la transacción.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string, type: string) => {
    const value = parseFloat(amount);
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'COP'
    }).format(value);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getCategoryBadgeColor = (category: string, type: string) => {
    if (type === 'income') return 'bg-green-100 text-green-800';
    
    const colorMap: Record<string, string> = {
      'food': 'bg-blue-100 text-blue-800',
      'transport': 'bg-yellow-100 text-yellow-800',
      'utilities': 'bg-purple-100 text-purple-800',
      'entertainment': 'bg-pink-100 text-pink-800',
      'healthcare': 'bg-red-100 text-red-800',
      'other-expense': 'bg-gray-100 text-gray-800',
    };
    
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.type === 'income' ? 'INGRESO' : 'EGRESO',
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const updatedData = {
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      type: editForm.type,
      category: editForm.category,
      date: new Date(editForm.date).toISOString(),
    };

    updateTransactionMutation.mutate({
      id: editingTransaction.id,
      data: updatedData,
    });
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay transacciones para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Crear las cabeceras del CSV
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Cantidad'];
    
    // Convertir transacciones a filas CSV
    const csvRows = transactions.map(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('es-ES');
      const amount = parseFloat(transaction.amount);
      const type = transaction.type === 'income' ? 'INGRESO' : 'EGRESO';
      
      return [
        date,
        `"${transaction.description}"`, // Comillas para manejar descripciones con comas
        transaction.category,
        type,
        amount.toFixed(2)
      ].join(',');
    });

    // Crear el contenido CSV completo
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generar nombre de archivo basado en el período
      const periodLabel = filters.period === 'all' ? 'todos' : 
                         filters.period === 'week' ? 'semana' :
                         filters.period === 'month' ? 'mes' :
                         filters.period === 'quarter' ? 'trimestre' :
                         filters.period === 'year' ? 'año' : 'periodo';
      
      const fileName = `transacciones_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación exitosa",
        description: `Se descargó el archivo: ${fileName}`,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar transacciones..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Egresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Período</label>
                <Select
                  value={filters.period}
                  onValueChange={(value) => setFilters({ ...filters, period: value })}
                >
                  <SelectTrigger data-testid="select-period-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Historial de Transacciones</CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => setPagination({ ...pagination, limit: parseInt(value) })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No se encontraron transacciones</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const IconComponent = categoryIcons[transaction.category as keyof typeof categoryIcons] || Eye;
                    return (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-accent transition-colors"
                        data-testid={`row-transaction-${transaction.id}`}
                      >
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {formatDate(transaction.date.toString()).split(',')[0]}<br />
                            <span className="text-muted-foreground">
                              {formatDate(transaction.date.toString()).split(',')[1]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium" data-testid={`text-description-${transaction.id}`}>
                              {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.receiptUrl ? 'Procesado por OCR' : 'Manual'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getCategoryBadgeColor(transaction.category, transaction.type)}
                            data-testid={`badge-category-${transaction.id}`}
                          >
                            {categoryLabels[transaction.category as keyof typeof categoryLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                            data-testid={`text-amount-${transaction.id}`}
                          >
                            {formatCurrency(transaction.amount, transaction.type)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80"
                                  onClick={() => handleEditTransaction(transaction)}
                                  data-testid={`button-edit-${transaction.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Transacción</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpdateTransaction} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descripción</Label>
                                    <Input
                                      id="edit-description"
                                      value={editForm.description}
                                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-amount">Cantidad</Label>
                                    <Input
                                      id="edit-amount"
                                      type="number"
                                      step="0.01"
                                      value={editForm.amount}
                                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipo</Label>
                                    <Select 
                                      value={editForm.type} 
                                      onValueChange={(value) => {
                                        setEditForm({
                                          ...editForm, 
                                          type: value,
                                          category: value === 'income' ? 'INGRESO' : 'EGRESO'
                                        });
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="income">Ingreso</SelectItem>
                                        <SelectItem value="expense">Egreso</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-date">Fecha</Label>
                                    <Input
                                      id="edit-date"
                                      type="date"
                                      value={editForm.date}
                                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <DialogTrigger asChild>
                                      <Button type="button" variant="outline">
                                        Cancelar
                                      </Button>
                                    </DialogTrigger>
                                    <Button 
                                      type="submit" 
                                      disabled={updateTransactionMutation.isPending}
                                    >
                                      {updateTransactionMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              data-testid={`button-view-${transaction.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              disabled={deleteTransactionMutation.isPending}
                              data-testid={`button-delete-${transaction.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.offset + transactions.length)} transacciones
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
                  disabled={pagination.offset === 0}
                  data-testid="button-previous-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                  disabled={transactions.length < pagination.limit}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
