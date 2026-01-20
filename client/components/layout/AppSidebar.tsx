import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Store, 
  UserCog,
  LogOut,
  ChefHat,
  UserPlus,
  CreditCard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import caimanLogo from "@/assets/caiman-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { role, loading, isAdmin, isSupervisor } = useUserRole();

  const isActive = (path: string) => location.pathname === path;

  // Menu items by role
  const getMenuItems = () => {
    const baseItems = [
      { 
        title: "Ventas", 
        icon: ShoppingCart, 
        items: [
          { title: "POS", url: "/ventas", roles: ['administrador', 'supervisor', 'vendedor'] },
          { title: "Caja", url: "/caja", roles: ['administrador', 'vendedor'] },
          { title: "Mesas", url: "/mesas", roles: ['administrador', 'supervisor', 'vendedor'] },
          { title: "Clientes", url: "/clientes", roles: ['administrador', 'supervisor', 'vendedor'] },
          { title: "Venta Externa", url: "/venta-externa", roles: ['administrador', 'supervisor', 'vendedor'] },
        ] 
      },
      { 
        title: "Logística", 
        icon: Package, 
        items: [
          { title: "Inventario", url: "/inventario", roles: ['administrador', 'supervisor'] },
          { title: "Recetas", url: "/recetas", roles: ['administrador', 'supervisor'] },
        ] 
      },
      { 
        title: "Administración", 
        icon: LayoutDashboard, 
        items: [
          { title: "Dashboard", url: "/dashboard", roles: ['administrador'] },
          { title: "Reportes", url: "/reportes", roles: ['administrador'] },
          { title: "Configuración", url: "/admin/settings", roles: ['administrador'] },
        ] 
      },
    ];

    return baseItems.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!role) return item.roles.includes('vendedor');
        return item.roles.includes(role);
      })
    })).filter(group => group.items.length > 0);
  };

  const menuGroups = getMenuItems();

  const getRoleBadge = () => {
    if (loading) return <Skeleton className="h-5 w-16" />;
    
    const roleConfig = {
      administrador: { label: 'Admin', className: 'bg-primary/20 text-primary border-primary/30' },
      supervisor: { label: 'Supervisor', className: 'bg-warning/20 text-warning border-warning/30' },
      vendedor: { label: 'Vendedor', className: 'bg-accent/20 text-accent border-accent/30' },
    };

    const config = role ? roleConfig[role] : roleConfig.vendedor;
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src={caimanLogo} 
            alt="Caiman POS" 
            className="h-10 w-10 rounded-lg"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">Caiman POS</span>
              {getRoleBadge()}
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-2">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              {!collapsed && group.title}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive(item.url) 
                            ? 'bg-primary/15 text-primary border border-primary/20' 
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                        activeClassName=""
                      >
                        <group.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
