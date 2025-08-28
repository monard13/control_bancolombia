import { Switch, Route } from "wouter";
import { useState } from "react";
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
import { ChartPie, Plus, Camera, List, ChartLine, Bell, Settings } from "lucide-react";
import baseSolutionLogo from "@assets/Logo BS COL_1756425179703.jpg";

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartPie, path: '/' },
  { id: 'add-transaction', label: 'Nueva Transacción', icon: Plus, path: '/add-transaction' },
  { id: 'upload-receipt', label: 'Subir Comprobante', icon: Camera, path: '/upload-receipt' },
  { id: 'transactions', label: 'Historial', icon: List, path: '/transactions' },
];

function Header() {
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
                <h1 className="text-xl font-bold text-foreground">FinanceTracker</h1>
                <p className="text-xs text-muted-foreground font-medium">BASE SOLUTION SAS</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center" data-testid="avatar-user">
              <span className="text-primary-foreground text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function TabNavigation({ currentPath }: { currentPath: string }) {
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

function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Simple path tracking for active tab styling
  window.addEventListener('popstate', () => {
    setCurrentPath(window.location.pathname);
  });

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation currentPath={currentPath} />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/add-transaction" component={AddTransaction} />
          <Route path="/upload-receipt" component={UploadReceipt} />
          <Route path="/transactions" component={Transactions} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
