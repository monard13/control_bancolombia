
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import baseSolutionLogo from "@assets/Logo BS COL_1756425179703.jpg";
import { z } from "zod";

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'visitor';
  };
  message: string;
}

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

export default function Register({ onBackToLogin, onRegisterSuccess }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string>("");
  const [registerSuccess, setRegisterSuccess] = useState<string>("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormData): Promise<RegisterResponse> => {
      const { confirmPassword, ...registerData } = userData;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setRegisterError("");
      setRegisterSuccess("Usuario registrado exitosamente. Se ha enviado un email de confirmación.");
      form.reset();
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    },
    onError: (error: any) => {
      setRegisterSuccess("");
      setRegisterError(error.message || "Error interno del servidor");
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setRegisterError("");
    setRegisterSuccess("");
    registerMutation.mutate(data);
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
            />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                REGISTRO
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Nombre de Usuario</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="usuario123"
                        className="pl-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="visitor">Visitante</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
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
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowPassword(!showPassword)}
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Confirmar Contraseña</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
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

              {registerError && (
                <Alert variant="destructive">
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}

              {registerSuccess && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{registerSuccess}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {registerMutation.isPending ? "Registrando..." : "Registrar Usuario"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={onBackToLogin}
              className="text-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
