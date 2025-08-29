import { TransactionTable } from "@/components/transaction-table";

export default function Transactions() {
  return (
    <div className="space-y-6" data-testid="page-transactions">
      <TransactionTable showFilters={true} />
    </div>
  );
}
