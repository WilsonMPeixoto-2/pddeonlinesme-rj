export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          source: string | null
          source_run_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          source?: string | null
          source_run_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          source?: string | null
          source_run_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      bulk_update_items: {
        Row: {
          created_at: string
          field_name: string
          id: string
          key_type: string
          key_value: string
          message: string | null
          new_value: string | null
          old_value: string | null
          raw_payload: Json | null
          row_number: number
          run_id: string
          status: string
          unidade_id: string | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          key_type: string
          key_value: string
          message?: string | null
          new_value?: string | null
          old_value?: string | null
          raw_payload?: Json | null
          row_number: number
          run_id: string
          status: string
          unidade_id?: string | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          key_type?: string
          key_value?: string
          message?: string | null
          new_value?: string | null
          old_value?: string | null
          raw_payload?: Json | null
          row_number?: number
          run_id?: string
          status?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_update_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "bulk_update_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_update_items_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_update_items_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidade_detalhe"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "bulk_update_items_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_localizador"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_update_runs: {
        Row: {
          applied_count: number
          created_at: string
          created_by: string
          error_count: number
          file_hash: string
          file_name: string
          id: string
          metadata: Json | null
          mode: string
          skipped_count: number
          status: string
          target_table: string
          total_rows: number
          updated_at: string
        }
        Insert: {
          applied_count?: number
          created_at?: string
          created_by?: string
          error_count?: number
          file_hash: string
          file_name: string
          id?: string
          metadata?: Json | null
          mode?: string
          skipped_count?: number
          status?: string
          target_table?: string
          total_rows: number
          updated_at?: string
        }
        Update: {
          applied_count?: number
          created_at?: string
          created_by?: string
          error_count?: number
          file_hash?: string
          file_name?: string
          id?: string
          metadata?: Json | null
          mode?: string
          skipped_count?: number
          status?: string
          target_table?: string
          total_rows?: number
          updated_at?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          banco: string | null
          conta_corrente: string | null
          created_at: string
          id: string
          principal: boolean
          unidade_id: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta_corrente?: string | null
          created_at?: string
          id?: string
          principal?: boolean
          unidade_id: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta_corrente?: string | null
          created_at?: string
          id?: string
          principal?: boolean
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidade_detalhe"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "contas_bancarias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_localizador"
            referencedColumns: ["id"]
          },
        ]
      }
      document_generation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          doc_type: string
          exercicio: number
          falhas: Json
          id: string
          metadata: Json | null
          programa: string
          started_at: string
          status: string
          total_alvo: number
          total_falha: number
          total_sucesso: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          doc_type: string
          exercicio: number
          falhas?: Json
          id?: string
          metadata?: Json | null
          programa?: string
          started_at?: string
          status?: string
          total_alvo: number
          total_falha?: number
          total_sucesso?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          doc_type?: string
          exercicio?: number
          falhas?: Json
          id?: string
          metadata?: Json | null
          programa?: string
          started_at?: string
          status?: string
          total_alvo?: number
          total_falha?: number
          total_sucesso?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      execucao_financeira: {
        Row: {
          created_at: string
          exercicio: number
          gasto: number
          id: string
          parcela_1_capital: number
          parcela_1_custeio: number
          parcela_2_capital: number
          parcela_2_custeio: number
          programa: string
          reprogramado_capital: number
          reprogramado_custeio: number
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercicio: number
          gasto?: number
          id?: string
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_2_capital?: number
          parcela_2_custeio?: number
          programa?: string
          reprogramado_capital?: number
          reprogramado_custeio?: number
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercicio?: number
          gasto?: number
          id?: string
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_2_capital?: number
          parcela_2_custeio?: number
          programa?: string
          reprogramado_capital?: number
          reprogramado_custeio?: number
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucao_financeira_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_financeira_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidade_detalhe"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "execucao_financeira_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_localizador"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          errors: Json
          exercicio: number | null
          filename: string | null
          id: string
          inserted_rows: number
          programa: string | null
          skipped_rows: number
          source: string
          status: string
          total_rows: number
          updated_rows: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          errors?: Json
          exercicio?: number | null
          filename?: string | null
          id?: string
          inserted_rows?: number
          programa?: string | null
          skipped_rows?: number
          source?: string
          status?: string
          total_rows?: number
          updated_rows?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          errors?: Json
          exercicio?: number | null
          filename?: string | null
          id?: string
          inserted_rows?: number
          programa?: string | null
          skipped_rows?: number
          source?: string
          status?: string
          total_rows?: number
          updated_rows?: number
          user_id?: string | null
        }
        Relationships: []
      }
      unidades_escolares: {
        Row: {
          agencia: string | null
          alunos: number
          cnpj: string | null
          conta_corrente: string | null
          created_at: string
          designacao: string
          diretor: string | null
          email: string | null
          endereco: string | null
          gasto: number
          id: string
          inep: string | null
          nome: string | null
          parcela_1_capital: number
          parcela_1_custeio: number
          parcela_2_capital: number
          parcela_2_custeio: number
          recebido: number
          reprogramado_capital: number
          reprogramado_custeio: number
          saldo_anterior: number
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          alunos?: number
          cnpj?: string | null
          conta_corrente?: string | null
          created_at?: string
          designacao: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          gasto?: number
          id?: string
          inep?: string | null
          nome?: string | null
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_2_capital?: number
          parcela_2_custeio?: number
          recebido?: number
          reprogramado_capital?: number
          reprogramado_custeio?: number
          saldo_anterior?: number
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          alunos?: number
          cnpj?: string | null
          conta_corrente?: string | null
          created_at?: string
          designacao?: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          gasto?: number
          id?: string
          inep?: string | null
          nome?: string | null
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_2_capital?: number
          parcela_2_custeio?: number
          recebido?: number
          reprogramado_capital?: number
          reprogramado_custeio?: number
          saldo_anterior?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_dashboard_basico: {
        Row: {
          exercicio: number | null
          programa: string | null
          total_disponivel_inicial: number | null
          total_parcela_1_capital: number | null
          total_parcela_1_custeio: number | null
          total_parcela_2_capital: number | null
          total_parcela_2_custeio: number | null
          total_parcelas: number | null
          total_reprogramado: number | null
          total_reprogramado_capital: number | null
          total_reprogramado_custeio: number | null
          total_unidades: number | null
          updated_at_max: string | null
        }
        Relationships: []
      }
      vw_unidade_detalhe: {
        Row: {
          agencia: string | null
          banco: string | null
          cnpj: string | null
          conta_corrente: string | null
          designacao: string | null
          diretor: string | null
          endereco: string | null
          exercicio: number | null
          inep: string | null
          nome: string | null
          parcela_1_capital: number | null
          parcela_1_custeio: number | null
          parcela_2_capital: number | null
          parcela_2_custeio: number | null
          programa: string | null
          reprogramado_capital: number | null
          reprogramado_custeio: number | null
          total_disponivel_inicial: number | null
          total_parcelas: number | null
          total_reprogramado: number | null
          unidade_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_unidades_localizador: {
        Row: {
          cnpj: string | null
          created_at: string | null
          designacao: string | null
          diretor: string | null
          id: string | null
          inep: string | null
          nome: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          designacao?: string | null
          diretor?: string | null
          id?: string | null
          inep?: string | null
          nome?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          designacao?: string | null
          diretor?: string | null
          id?: string | null
          inep?: string | null
          nome?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_role: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      admin_revoke_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      apply_partial_bulk_update: {
        Args: { p_file_hash: string; p_file_name: string; p_items: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          last_sign_in_at: string
          roles: string[]
          user_id: string
        }[]
      }
      update_unidade_cadastro_minima: {
        Args: {
          p_agencia: string
          p_banco: string
          p_conta_corrente: string
          p_diretor: string
          p_endereco: string
          p_nome: string
          p_unidade_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "operador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "operador"],
    },
  },
} as const
