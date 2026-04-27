export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      document_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          format: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      documentos_gerados: {
        Row: {
          created_at: string
          document_type_id: string
          exercicio: number
          file_path: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json
          programa: string
          status: string
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          exercicio: number
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json
          programa?: string
          status?: string
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          exercicio?: number
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json
          programa?: string
          status?: string
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_gerados_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_escolares_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_status"
            referencedColumns: ["unidade_id"]
          },
        ]
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
            referencedRelation: "vw_unidades_escolares_frontend"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_financeira_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_status"
            referencedColumns: ["unidade_id"]
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
          status: string
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unidades_escolares: {
        Row: {
          agencia: string | null
          alunos: number | null
          ativo: boolean
          cnpj: string | null
          conta_corrente: string | null
          created_at: string
          designacao: string
          diretor: string | null
          email: string | null
          endereco: string | null
          id: string
          inep: string | null
          nome: string
          source_payload: Json | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          alunos?: number | null
          ativo?: boolean
          cnpj?: string | null
          conta_corrente?: string | null
          created_at?: string
          designacao: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inep?: string | null
          nome: string
          source_payload?: Json | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          alunos?: number | null
          ativo?: boolean
          cnpj?: string | null
          conta_corrente?: string | null
          created_at?: string
          designacao?: string
          diretor?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inep?: string | null
          nome?: string
          source_payload?: Json | null
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
      vw_unidades_escolares_frontend: {
        Row: {
          agencia: string | null
          alunos: number | null
          ativo: boolean | null
          cnpj: string | null
          conta_corrente: string | null
          created_at: string | null
          designacao: string | null
          diretor: string | null
          email: string | null
          endereco: string | null
          exercicio: number | null
          gasto: number | null
          id: string | null
          inep: string | null
          nome: string | null
          parcela_1_capital: number | null
          parcela_1_custeio: number | null
          parcela_2_capital: number | null
          parcela_2_custeio: number | null
          programa: string | null
          recebido: number | null
          reprogramado_capital: number | null
          reprogramado_custeio: number | null
          saldo_anterior: number | null
          saldo_estimado: number | null
          unidade_label: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_unidades_status: {
        Row: {
          exercicio: number | null
          programa: string | null
          status: string | null
          unidade_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id?: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "operador" | "diretor"
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
  public: {
    Enums: {
      app_role: ["admin", "operador", "diretor"],
    },
  },
} as const
