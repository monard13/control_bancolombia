import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { insertTransactionSchema, type InsertTransaction, type ExtractedData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Check, X } from "lucide-react";

const categories = {
  income: [
    { value: 'INGRESO', label: 'INGRESO' },
  ],
  expense: [
    { value: 'EGRESO', label: 'EGRESO' },
  ],
};

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  extractedData: ExtractedData;
  receiptImage?: string;
}

export function ConfirmationModal({
  open,
  onClose,
  extractedData,
  receiptImage
}: ConfirmationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    extractedData.amount && extractedData.amount > 0 ? 'expense' : 'expense'
  );

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      type: transactionType,
      amount: extractedData.amount?.toString() || '',
      description: extractedData.description || '',
      category: transactionType === 'income' ? 'INGRESO' : 'EGRESO',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      extractedData: extractedData,
      confidence: extractedData.confidence.toString(),
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/summary'] });
      toast({
        title: "Transacción confirmada",
        description: "La transacción se ha registrado correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error confirming transaction:', error);
    },
  });

  const onConfirm = (data: InsertTransaction) => {
    createTransactionMutation.mutate(data);
  };

  const onReject = () => {
    toast({
      title: "Transacción rechazada",
      description: "La información extraída ha sido descartada.",
    });
    onClose();
  };

  const confidencePercentage = Math.round(extractedData.confidence * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-confirmation">
        <DialogHeader>
          <DialogTitle>Confirmar Datos Extraídos</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Verifica y edita la información antes de guardar
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {receiptImage && (
            <div className="mb-6">
              <img
                src={receiptImage}
                alt="Comprobante procesado"
                className="w-full h-40 object-cover rounded-md border"
                data-testid="img-receipt-preview"
              />
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onConfirm)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Detectada</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-8"
                          data-testid="input-extracted-amount"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Detectada</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-extracted-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Detectada</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-extracted-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transacción</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value: 'income' | 'expense') => {
                          field.onChange(value);
                          setTransactionType(value);
                          form.setValue('category', '');
                        }}
                        value={field.value}
                        className="flex space-x-4"
                        data-testid="radio-extracted-type"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="modal-expense" />
                          <Label htmlFor="modal-expense">Egreso</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="modal-income" />
                          <Label htmlFor="modal-income">Ingreso</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-accent rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confianza de Extracción</span>
                  <span className="text-sm text-primary font-medium" data-testid="text-confidence">
                    {confidencePercentage}%
                  </span>
                </div>
                <Progress value={confidencePercentage} className="h-2" data-testid="progress-confidence" />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReject}
                  data-testid="button-reject"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                  data-testid="button-confirm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createTransactionMutation.isPending ? "Confirmando..." : "Confirmar y Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
