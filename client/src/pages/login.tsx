import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import baseSolutionLogo from "@assets/Logo BS COL_1756425179703.jpg";

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'visitor';
  };
  message: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: LoginResponse['user']) => void;
}

export default function Login({ onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setLoginError("");
      onLoginSuccess(data.user);
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      let errorMessage = "Error interno del servidor";
      
      if (error?.message) {
        // Try to parse error message for more specific info
        if (error.message.includes('401')) {
          errorMessage = "Credenciales incorrectas. Intente de nuevo.";
        } else if (error.message.includes('500')) {
          errorMessage = "Error interno del servidor. Intente más tarde.";
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorMessage = "Error de conexión. Verifique su conexión a internet.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setLoginError(errorMessage);
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    setLoginError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <img 
              src={baseSolutionLogo} 
              alt="Base Solution SAS Logo" 
              className="w-16 h-16 object-contain"
              data-testid="logo-base-solution"
            />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                FINANCETRACKER
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium mt-2">
                BASE SOLUTION SAS
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Correo Electrónico</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Contraseña</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginError && (
                <Alert variant="destructive" data-testid="alert-login-error">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Cuentas de prueba:</strong></p>
              <p>admin@dominio.com / admin123</p>
              <p>usuario@dominio.com / user123</p>
              <p>visitante@dominio.com / guest123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}