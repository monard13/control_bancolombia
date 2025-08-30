import { TransactionTable } from "@/components/transaction-table";

interface TransactionsProps {
  userRole?: 'admin' | 'user' | 'visitor';
}

export default function Transactions({ userRole = 'user' }: TransactionsProps) {
  const canEdit = userRole === 'admin';
  const canDelete = userRole === 'admin';
  
  return (
    <div className="space-y-6" data-testid="page-transactions">
      <TransactionTable 
        showFilters={true} 
        canEdit={canEdit} 
        canDelete={canDelete} 
      />
    </div>
  );
}
