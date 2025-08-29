import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Save, X, Upload, FileText } from "lucide-react";

const categories = {
  income: [
    { value: 'INGRESO', label: 'INGRESO' },
  ],
  expense: [
    { value: 'EGRESO', label: 'EGRESO' },
  ],
};

interface TransactionFormProps {
  initialData?: Partial<InsertTransaction>;
  onCancel?: () => void;
}

export function TransactionForm({ initialData, onCancel }: TransactionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    initialData?.type || 'expense'
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      description: '',
      category: transactionType === 'income' ? 'INGRESO' : 'EGRESO',
      date: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      // Get upload URL
      const uploadResponse = await fetch('/api/objects/upload', { method: 'POST' });
      const { uploadURL } = await uploadResponse.json();

      // Upload file to object storage
      const putResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!putResponse.ok) throw new Error('Failed to upload receipt');
      return uploadURL;
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction & { receiptUrl?: string }) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/summary'] });
      toast({
        title: "Transacción creada",
        description: "La transacción se ha registrado correctamente.",
      });
      form.reset();
      setReceiptFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating transaction:', error);
    },
  });

  const onSubmit = async (data: InsertTransaction) => {
    if (!receiptFile) {
      toast({
        title: "Comprobante requerido",
        description: "Debes subir un comprobante para crear la transacción.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingReceipt(true);
    try {
      // First upload the receipt
      const receiptUrl = await uploadReceiptMutation.mutateAsync(receiptFile);
      
      // Then create the transaction with the receipt URL and auto-assigned category
      await createTransactionMutation.mutateAsync({
        ...data,
        category: data.type === 'income' ? 'INGRESO' : 'EGRESO', // Auto-assign category based on type
        receiptUrl: receiptUrl, // Send the full upload URL, backend will normalize it
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos JPG, PNG, WebP o PDF.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setReceiptFile(file);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">Nueva Transacción Manual</CardTitle>
        <p className="text-sm text-muted-foreground">Registra ingresos y gastos manualmente</p>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        form.setValue('category', ''); // Reset category when type changes
                      }}
                      value={field.value}
                      className="flex space-x-4"
                      data-testid="radio-transaction-type"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="income" />
                        <Label htmlFor="income">Ingreso</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="expense" />
                        <Label htmlFor="expense">Egreso</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        data-testid="input-amount"
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Compra en supermercado, Salario, etc."
                      data-testid="input-description"
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
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Upload Field - Required */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Comprobante <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="receipt-upload"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-receipt"
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {receiptFile ? (
                    <>
                      <FileText className="w-8 h-8 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {receiptFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Haz clic para subir el comprobante
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG, WebP o PDF (máx. 5MB)
                      </span>
                    </>
                  )}
                </label>
              </div>
              {!receiptFile && (
                <p className="text-sm text-red-500">
                  El comprobante es obligatorio para crear la transacción
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending || isUploadingReceipt || !receiptFile}
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUploadingReceipt
                  ? "Subiendo comprobante..."
                  : createTransactionMutation.isPending
                  ? "Guardando..."
                  : "Guardar Transacción"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
