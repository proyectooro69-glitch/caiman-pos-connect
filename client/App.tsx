import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import Inventario from "./pages/Inventario";
import Mesas from "./pages/Mesas";
import Clientes from "./pages/Clientes";
import AdminUsers from "./pages/AdminUsers";
import AdminStores from "./pages/AdminStores";
import AdminInvitations from "./pages/AdminInvitations";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminSettings from "./pages/AdminSettings";
import VentaExterna from "./pages/VentaExterna";
import Catalogo from "./pages/Catalogo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <Ventas />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <Reportes />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <Inventario />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mesas"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <Mesas />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <Clientes />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <ProtectedRoute>
                  <AdminStores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invitations"
              element={
                <ProtectedRoute>
                  <AdminInvitations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <ProtectedRoute>
                  <AdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venta-externa"
              element={
                <ProtectedRoute>
                  <SubscriptionBlocker>
                    <VentaExterna />
                  </SubscriptionBlocker>
                </ProtectedRoute>
              }
            />
            <Route path="/catalogo/:storeId" element={<Catalogo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
