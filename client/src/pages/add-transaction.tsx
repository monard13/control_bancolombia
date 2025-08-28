import { TransactionForm } from "@/components/transaction-form";

export default function AddTransaction() {
  return (
    <div className="space-y-6" data-testid="page-add-transaction">
      <TransactionForm />
    </div>
  );
}
