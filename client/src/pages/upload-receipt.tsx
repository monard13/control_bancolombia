import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { type ExtractedData } from "@shared/schema";
import { CloudUpload, FolderOpen, Settings, FileImage, File, Eye } from "lucide-react";
import { getCsrfToken } from "@/lib/queryClient";

interface ProcessingResult {
  extractedData: ExtractedData;
  ocrText: string;
  message: string;
  aiAvailable?: boolean;
  receiptUrl?: string | null;
}

interface UploadReceiptProps {
  userRole: 'admin' | 'user';
}

export default function UploadReceipt({ userRole }: UploadReceiptProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<Array<{
    id: string;
    name: string;
    status: 'processing' | 'completed' | 'error';
    timestamp: Date;
    type: 'image' | 'pdf';
  }>>([]);

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File): Promise<ProcessingResult> => {
      const formData = new FormData();
      formData.append('receipt', file);

      const token = await getCsrfToken();
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (result, file) => {
      setExtractedData(result.extractedData);
      setReceiptUrl(result.receiptUrl || null);
      
      // Create preview URL for the image
      if (file.type.startsWith('image/')) {
        setReceiptImage(URL.createObjectURL(file));
      }
      
      setShowConfirmation(true);
      
      // Update recent uploads
      setRecentUploads(prev => [
        {
          id: Date.now().toString(),
          name: file.name,
          status: 'completed',
          timestamp: new Date(),
          type: file.type.startsWith('image/') ? 'image' : 'pdf'
        },
        ...prev.slice(0, 4) // Keep only 5 most recent
      ]);

      toast({
        title: "Comprobante procesado",
        description: result.aiAvailable 
          ? "La información ha sido extraída correctamente con IA."
          : "Texto extraído con OCR. Por favor revisa y completa los datos manualmente (IA no disponible).",
        variant: result.aiAvailable ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al procesar",
        description: error.message || "No se pudo procesar el comprobante.",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPG, PNG y PDF.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo debe ser menor a 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Add to recent uploads as processing
    setRecentUploads(prev => [
      {
        id: Date.now().toString(),
        name: file.name,
        status: 'processing',
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? 'image' : 'pdf'
      },
      ...prev.slice(0, 4)
    ]);

    uploadReceiptMutation.mutate(file);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes === 1) return 'Hace 1 minuto';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return 'Hace 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6" data-testid="page-upload-receipt">
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle>Subir Comprobante de Pago</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sube una imagen o PDF y extraeremos la información automáticamente
          </p>
          {userRole === 'user' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>ℹ️ Restricción de Usuario:</strong> Solo puedes registrar comprobantes de <strong>INGRESO</strong>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            data-testid="input-file"
          />
          
          {/* Processing State */}
          {uploadReceiptMutation.isPending && (
            <div className="bg-accent rounded-lg p-6 text-center mb-6" data-testid="processing-state">
              <div className="animate-spin mb-4">
                <Settings className="mx-auto text-3xl text-primary w-8 h-8" />
              </div>
              <h4 className="text-lg font-medium mb-2">Procesando Comprobante</h4>
              <p className="text-sm text-muted-foreground">Extrayendo información del documento...</p>
              <div className="w-full bg-muted rounded-full h-2 mt-4">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!uploadReceiptMutation.isPending && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary hover:bg-accent'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              data-testid="upload-area"
            >
              <div className="mb-4">
                <CloudUpload className="mx-auto text-4xl text-muted-foreground w-12 h-12" />
              </div>
              <h4 className="text-lg font-medium mb-2">Arrastra tu comprobante aquí</h4>
              <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar archivo</p>
              <Button type="button" data-testid="button-select-file">
                <FolderOpen className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Formatos soportados: JPG, PNG, PDF (máx. 10MB)
              </p>
            </div>
          )}

          {/* Recent Uploads */}
          {recentUploads.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-medium mb-4">Archivos Recientes</h4>
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 bg-accent rounded-md"
                    data-testid={`upload-item-${upload.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      {upload.type === 'image' ? (
                        <FileImage className="text-blue-500 w-5 h-5" />
                      ) : (
                        <File className="text-red-500 w-5 h-5" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{upload.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {upload.status === 'processing' ? 'Procesando...' : formatTimeAgo(upload.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          upload.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : upload.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {upload.status === 'completed' ? 'Completado' : 
                         upload.status === 'processing' ? 'Procesando' : 'Error'}
                      </span>
                      {upload.status === 'completed' && (
                        <Button variant="ghost" size="sm" data-testid={`button-view-${upload.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {extractedData && (
        <ConfirmationModal
          open={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setExtractedData(null);
            if (receiptImage) {
              URL.revokeObjectURL(receiptImage);
              setReceiptImage(null);
            }
          }}
          extractedData={extractedData}
          receiptImage={receiptImage || undefined}
          receiptUrl={receiptUrl || undefined}
          userRole={userRole}
        />
      )}
    </div>
  );
}
