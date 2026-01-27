import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_EMAIL = "demo@caimanpos.com";

export function DemoBanner() {
  const { user } = useAuth();

  if (!user || user.email !== DEMO_EMAIL) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      <span>
        Estás en el modo de demostración. Los cambios no se guardarán permanentemente.
      </span>
    </div>
  );
}

export function useDemoMode() {
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;

  return {
    isDemo,
    demoEmail: DEMO_EMAIL,
  };
}
