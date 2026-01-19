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
        // Fetch roles from user_roles table (can be multiple rows)
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role, store_id')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching user role:', rolesError);
        }

        if (!rolesData || rolesData.length === 0) {
          // If this returns empty but you *know* there is a row, it's almost always missing RLS SELECT policy.
          console.warn(
            '[useUserRole] user_roles returned 0 rows. If you inserted a role, add an RLS policy allowing users to SELECT their own user_roles row.'
          );
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

        // Pick highest priority role if multiple exist
        const roles = (rolesData ?? []) as Array<{ role: AppRole; store_id: string | null }>;
        const priority: AppRole[] = ['administrador', 'supervisor', 'vendedor'];
        const bestRole = priority.find((r) => roles.some((row) => row.role === r)) ?? null;
        const bestRow = bestRole ? roles.find((row) => row.role === bestRole) : roles[0];

        const userRole: AppRole | null = bestRow?.role ?? null;
        const userStoreId = bestRow?.store_id ??
          (profileData as { punto_venta_id: string | null } | null)?.punto_venta_id ??
          null;

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
