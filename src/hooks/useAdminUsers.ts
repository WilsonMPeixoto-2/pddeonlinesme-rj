import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AdminUserRow {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  roles: AppRole[];
}

const ADMIN_USERS_KEY = ["admin", "users"] as const;

function normalizeRows(raw: unknown): AdminUserRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as {
      user_id: string;
      email: string;
      created_at: string;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      roles: string[] | null;
    };
    return {
      user_id: r.user_id,
      email: r.email,
      created_at: r.created_at,
      last_sign_in_at: r.last_sign_in_at,
      email_confirmed_at: r.email_confirmed_at,
      roles: (r.roles ?? []).filter(
        (role): role is AppRole => role === "admin" || role === "operador",
      ),
    };
  });
}

export function useAdminUsers() {
  return useQuery<AdminUserRow[], Error>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admin_users");
      if (error) throw new Error(error.message);
      return normalizeRows(data);
    },
  });
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
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
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
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}
