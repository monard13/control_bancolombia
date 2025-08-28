import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";

export default function Dashboard() {
  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <SummaryCards />
      
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
