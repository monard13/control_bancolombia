import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AddTransaction from "@/pages/add-transaction";
import UploadReceipt from "@/pages/upload-receipt";
import Transactions from "@/pages/transactions";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import VisitorDashboard from "@/pages/visitor-dashboard";
import { ChartPie, Plus, Camera, List, Bell, Settings, Info, Building2, CreditCard, Hash, Key, LogOut } from "lucide-react";
import baseSolutionLogo from "@assets/Logo BS COL_1756425179703.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'visitor';
};

const getNavigationForRole = (role: string) => {
  const baseNav = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartPie, path: '/' },
  ];

  if (role === 'admin') {
    return [
      ...baseNav,
      { id: 'add-transaction', label: 'Nueva Transacción', icon: Plus, path: '/add-transaction' },
      { id: 'upload-receipt', label: 'Subir Comprobante', icon: Camera, path: '/upload-receipt' },
      { id: 'transactions', label: 'Historial', icon: List, path: '/transactions' },
    ];
  } else if (role === 'user') {
    return [
      ...baseNav,
      { id: 'add-transaction', label: 'Agregar Ingreso', icon: Plus, path: '/add-transaction' },
      { id: 'upload-receipt', label: 'Subir Comprobante', icon: Camera, path: '/upload-receipt' },
      { id: 'transactions', label: 'Mis Transacciones', icon: List, path: '/transactions' },
    ];
  } else {
    // visitor role - read-only
    return baseNav;
  }
};

function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Administrador</Badge>;
      case 'user':
        return <Badge variant="secondary">Usuario</Badge>;
      case 'visitor':
        return <Badge variant="outline">Visitante</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img
                src={baseSolutionLogo}
                alt="Base Solution SAS Logo"
                className="w-10 h-10 object-contain"
                data-testid="logo-base-solution"
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground">FINANCETRACKER</h1>
                <p className="text-xs text-muted-foreground font-medium">BASE SOLUTION SAS</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Bienvenido, <strong>{user.username}</strong>
              </span>
              {getRoleBadge(user.role)}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                  data-testid="button-bank-info"
                >
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">Información Bancaria</span>
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

            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-destructive hover:text-destructive/80"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>

            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center" data-testid="avatar-user">
              <span className="text-primary-foreground text-sm font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function TabNavigation({ currentPath, user }: { currentPath: string; user: User }) {
  const navigation = getNavigationForRole(user.role);

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-muted p-1 rounded-lg">
      {navigation.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentPath === item.path;

        return (
          <Button
            key={item.id}
            asChild
            variant="ghost"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            data-testid={`tab-${item.id}`}
          >
            <a href={item.path}>
              <IconComponent className="w-4 h-4 mr-2" />
              {item.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

function AuthenticatedRouter({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Simple path tracking for active tab styling
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'admin':
        return AdminDashboard;
      case 'user':
        return UserDashboard;
      case 'visitor':
        return VisitorDashboard;
      default:
        return Dashboard;
    }
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation currentPath={currentPath} user={user} />
        <Switch>
          <Route path="/" component={getDashboardComponent()} />
          {(user.role === 'admin' || user.role === 'user') && (
            <>
              <Route path="/add-transaction" component={AddTransaction} />
              <Route path="/upload-receipt">
                <UploadReceipt userRole={user.role} />
              </Route>
              <Route path="/transactions" component={Transactions} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage to persist across hot reloads
    try {
      const savedUser = localStorage.getItem('financetracker_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });


  // Check if session is still valid when user is loaded from localStorage
  useEffect(() => {
    if (user) {
      
      // Make a test request to see if session is still valid
      fetch('/api/transactions/summary', { 
        credentials: 'include',
        method: 'GET'
      })
      .then(response => {
        if (response.status === 401) {
          localStorage.removeItem('financetracker_user');
          setUser(null);
        } else {
        }
      })
      .catch(error => {
        localStorage.removeItem('financetracker_user');
        setUser(null);
      });
    }
  }, []); // Only run once when component mounts

  const handleLogin = (userData: User) => {
    
    // Save to localStorage to persist across reloads
    localStorage.setItem('financetracker_user', JSON.stringify(userData));
    setUser(userData);
    
    // Redirect to dashboard after login
    window.history.pushState({}, '', '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('financetracker_user');
    setUser(null);
    queryClient.clear(); // Clear cached data
    window.history.pushState({}, '', '/');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          {!user ? (
            <Login
              onLoginSuccess={handleLogin}
            />
          ) : (
            <AuthenticatedRouter user={user} onLogout={handleLogout} />
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;