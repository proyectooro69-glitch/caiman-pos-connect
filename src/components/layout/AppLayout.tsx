import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, role } = useUserRole();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            
            <div className="flex-1" />
            
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {role === 'administrador' && '🛡️ Modo Administrador'}
                {role === 'supervisor' && '📊 Modo Supervisor'}
                {role === 'vendedor' && '🛒 Modo Vendedor'}
                {!role && '👤 Sin rol asignado'}
              </span>
            )}
          </header>
          
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
