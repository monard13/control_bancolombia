import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";
import { Info, Building2, CreditCard, Hash, Key } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <SummaryCards />
      
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-2"
              data-testid="button-bank-info"
            >
              <Info className="w-4 h-4" />
              <span>Información Bancaria</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Información Bancaria</span>
              </DialogTitle>
            </DialogHeader>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-center">Base Solution SAS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <Building2 className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">Banco</p>
                      <p className="text-sm text-muted-foreground">Bancolombia</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">Cuenta de Ahorros</p>
                      <p className="text-sm text-muted-foreground font-mono">83600004845</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <Hash className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">NIT</p>
                      <p className="text-sm text-muted-foreground font-mono">901489530</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <Key className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">Llave Bre-B</p>
                      <p className="text-sm text-muted-foreground font-mono">0082110032</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    <strong>Base Solution SAS</strong><br />
                    Información bancaria oficial
                  </p>
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionTable showFilters={false} />
        </CardContent>
      </Card>
    </div>
  );
}
