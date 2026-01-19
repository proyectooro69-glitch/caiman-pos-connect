import { useState, useEffect } from 'react';
import { supabaseUntyped } from '@/lib/supabase-untyped';
import { useUserRole } from './useUserRole';

interface SubscriptionData {
  isActive: boolean;
  isExpired: boolean;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  loading: boolean;
  estado: 'activo' | 'vencido' | 'sin_suscripcion';
}

export const useSubscription = (): SubscriptionData => {
  const { storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isActive: true,
    isExpired: false,
    fechaVencimiento: null,
    diasRestantes: null,
    loading: true,
    estado: 'activo',
  });

  useEffect(() => {
    const checkSubscription = async () => {
      // Admins and supervisors are never blocked
      if (isAdmin || isSupervisor) {
        setSubscriptionData({
          isActive: true,
          isExpired: false,
          fechaVencimiento: null,
          diasRestantes: null,
          loading: false,
          estado: 'activo',
        });
        return;
      }

      if (!storeId) {
        setSubscriptionData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Check suscripciones table first
        const { data: suscripcion, error } = await supabaseUntyped
          .from('suscripciones')
          .select('fecha_vencimiento, estado')
          .eq('store_id', storeId)
          .maybeSingle();

        if (error) {
          console.error('Error checking subscription:', error);
          // Fallback to puntos_venta
          const { data: store } = await supabaseUntyped
            .from('puntos_venta')
            .select('fecha_vencimiento')
            .eq('id', storeId)
            .maybeSingle();

          const storeData = store as { fecha_vencimiento: string | null } | null;
          if (storeData?.fecha_vencimiento) {
            const fechaVenc = new Date(storeData.fecha_vencimiento);
            const hoy = new Date();
            const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            
            setSubscriptionData({
              isActive: diasRestantes >= 0,
              isExpired: diasRestantes < 0,
              fechaVencimiento: storeData.fecha_vencimiento,
              diasRestantes,
              loading: false,
              estado: diasRestantes < 0 ? 'vencido' : 'activo',
            });
            return;
          }

          setSubscriptionData(prev => ({ 
            ...prev, 
            loading: false,
            estado: 'sin_suscripcion',
          }));
          return;
        }

        if (!suscripcion) {
          // No subscription record, check puntos_venta as fallback
          const { data: store } = await supabaseUntyped
            .from('puntos_venta')
            .select('fecha_vencimiento')
            .eq('id', storeId)
            .maybeSingle();

          const storeData = store as { fecha_vencimiento: string | null } | null;
          if (storeData?.fecha_vencimiento) {
            const fechaVenc = new Date(storeData.fecha_vencimiento);
            const hoy = new Date();
            const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            
            setSubscriptionData({
              isActive: diasRestantes >= 0,
              isExpired: diasRestantes < 0,
              fechaVencimiento: storeData.fecha_vencimiento,
              diasRestantes,
              loading: false,
              estado: diasRestantes < 0 ? 'vencido' : 'activo',
            });
            return;
          }

          setSubscriptionData({
            isActive: true, // If no subscription exists, allow access (new stores)
            isExpired: false,
            fechaVencimiento: null,
            diasRestantes: null,
            loading: false,
            estado: 'sin_suscripcion',
          });
          return;
        }

        const suscripcionData = suscripcion as { fecha_vencimiento: string | null; estado: string };
        const fechaVenc = suscripcionData.fecha_vencimiento ? new Date(suscripcionData.fecha_vencimiento) : null;
        const hoy = new Date();
        const diasRestantes = fechaVenc 
          ? Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        setSubscriptionData({
          isActive: suscripcionData.estado === 'activo',
          isExpired: suscripcionData.estado === 'vencido',
          fechaVencimiento: suscripcionData.fecha_vencimiento,
          diasRestantes,
          loading: false,
          estado: suscripcionData.estado as 'activo' | 'vencido',
        });
      } catch (error) {
        console.error('Error in useSubscription:', error);
        setSubscriptionData(prev => ({ ...prev, loading: false }));
      }
    };

    if (!roleLoading) {
      checkSubscription();
    }
  }, [storeId, roleLoading, isAdmin, isSupervisor]);

  return subscriptionData;
};
