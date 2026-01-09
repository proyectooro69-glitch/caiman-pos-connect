import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/database';

interface UserRoleData {
  role: AppRole | null;
  storeId: string | null;
  loading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isVendedor: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setStoreId(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, store_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
        }

        // Fetch store_id from profiles as fallback
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('punto_venta_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        const userRole = roleData ? (roleData as { role: AppRole; store_id: string | null }).role : null;
        const userStoreId = roleData 
          ? (roleData as { role: AppRole; store_id: string | null }).store_id 
          : (profileData as { punto_venta_id: string | null } | null)?.punto_venta_id ?? null;
        
        setRole(userRole);
        setStoreId(userStoreId);
      } catch (error) {
        console.error('Error in useUserRole:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    role,
    storeId,
    loading,
    isAdmin: role === 'administrador',
    isSupervisor: role === 'supervisor',
    isVendedor: role === 'vendedor',
  };
};
