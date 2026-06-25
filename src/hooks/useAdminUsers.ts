import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { adminUsersOptions, queryKeys } from "@/lib/queryKeys";
import type { AppRole } from "@/lib/queryKeys";

export type { AdminUserRow, AppRole } from "@/lib/queryKeys";

export function useAdminUsers() {
  return useQuery(adminUsersOptions());
}

export function useAdminAssignRole() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, { email: string; role: AppRole }>({
    mutationFn: async ({ email, role }) => {
      const { data, error } = await supabase.rpc("admin_assign_role", {
        p_email: email,
        p_role: role,
      });
      if (error) throw new Error(error.message);
      if (!data) {
        throw new Error("Atribuicao nao confirmada pelo servidor.");
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    },
  });
}

export function useAdminRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, { userId: string; role: AppRole }>({
    mutationFn: async ({ userId, role }) => {
      const { data, error } = await supabase.rpc("admin_revoke_role", {
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw new Error(error.message);
      return Boolean(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    },
  });
}
