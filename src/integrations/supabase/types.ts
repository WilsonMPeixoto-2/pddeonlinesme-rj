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
  public: {
    Tables: {
      _financial_second_cycle_reconcile_20260921: {
        Row: {
          acao: string
          capital_pago: number | null
          capital_programado: number | null
          custeio_pago: number | null
          custeio_programado: number | null
          data_ordem_pagamento: string | null
          data_pagamento: string | null
          inep: string
          parcela: string
          valor_pago: number
          valor_programado: number
        }
        Insert: {
          acao: string
          capital_pago?: number | null
          capital_programado?: number | null
          custeio_pago?: number | null
          custeio_programado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          inep: string
          parcela: string
          valor_pago: number
          valor_programado: number
        }
        Update: {
          acao?: string
          capital_pago?: number | null
          capital_programado?: number | null
          custeio_pago?: number | null
          custeio_programado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          inep?: string
          parcela?: string
          valor_pago?: number
          valor_programado?: number
        }
        Relationships: []
      }
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
          exercicio: number | null
          id: string
          principal: boolean
          programa: string | null
          unidade_id: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta_corrente?: string | null
          created_at?: string
          exercicio?: number | null
          id?: string
          principal?: boolean
          programa?: string | null
          unidade_id: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta_corrente?: string | null
          created_at?: string
          exercicio?: number | null
          id?: string
          principal?: boolean
          programa?: string | null
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
          acao: string | null
          created_at: string
          exercicio: number
          gasto: number
          id: string
          parcela_1_capital: number
          parcela_1_custeio: number
          parcela_1_data_pagamento: string | null
          parcela_1_total: number | null
          parcela_2_capital: number
          parcela_2_custeio: number
          parcela_2_total_programado: number | null
          programa: string
          reprogramado_capital: number
          reprogramado_custeio: number
          unidade_id: string
          updated_at: string
        }
        Insert: {
          acao?: string | null
          created_at?: string
          exercicio: number
          gasto?: number
          id?: string
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_1_data_pagamento?: string | null
          parcela_1_total?: number | null
          parcela_2_capital?: number
          parcela_2_custeio?: number
          parcela_2_total_programado?: number | null
          programa?: string
          reprogramado_capital?: number
          reprogramado_custeio?: number
          unidade_id: string
          updated_at?: string
        }
        Update: {
          acao?: string | null
          created_at?: string
          exercicio?: number
          gasto?: number
          id?: string
          parcela_1_capital?: number
          parcela_1_custeio?: number
          parcela_1_data_pagamento?: string | null
          parcela_1_total?: number | null
          parcela_2_capital?: number
          parcela_2_custeio?: number
          parcela_2_total_programado?: number | null
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
      financial_dimension_contracts: {
        Row: {
          contract_version: number
          coverage_expected: number
          coverage_required_ratio: number
          created_at: string
          dimension_key: string
          enabled: boolean
          exercise: number
          requirements: Json
          updated_at: string
        }
        Insert: {
          contract_version?: number
          coverage_expected: number
          coverage_required_ratio: number
          created_at?: string
          dimension_key: string
          enabled?: boolean
          exercise: number
          requirements?: Json
          updated_at?: string
        }
        Update: {
          contract_version?: number
          coverage_expected?: number
          coverage_required_ratio?: number
          created_at?: string
          dimension_key?: string
          enabled?: boolean
          exercise?: number
          requirements?: Json
          updated_at?: string
        }
        Relationships: []
      }
      financial_dimension_status: {
        Row: {
          coverage_expected: number
          coverage_observed: number
          coverage_ratio: number
          created_at: string
          dimension_key: string
          exercise: number
          id: string
          integration_run_id: string
          publication_status: string
          published_at: string | null
          quality_status: string
          reference_date_max: string | null
          reference_date_min: string | null
          source_snapshot_digest: string | null
          validated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          coverage_expected: number
          coverage_observed: number
          coverage_ratio: number
          created_at?: string
          dimension_key: string
          exercise: number
          id?: string
          integration_run_id: string
          publication_status: string
          published_at?: string | null
          quality_status: string
          reference_date_max?: string | null
          reference_date_min?: string | null
          source_snapshot_digest?: string | null
          validated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          coverage_expected?: number
          coverage_observed?: number
          coverage_ratio?: number
          created_at?: string
          dimension_key?: string
          exercise?: number
          id?: string
          integration_run_id?: string
          publication_status?: string
          published_at?: string | null
          quality_status?: string
          reference_date_max?: string | null
          reference_date_min?: string | null
          source_snapshot_digest?: string | null
          validated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_dimension_status_contract_fkey"
            columns: ["dimension_key", "exercise"]
            isOneToOne: false
            referencedRelation: "financial_dimension_contracts"
            referencedColumns: ["dimension_key", "exercise"]
          },
          {
            foreignKeyName: "financial_dimension_status_integration_run_id_fkey"
            columns: ["integration_run_id"]
            isOneToOne: false
            referencedRelation: "integracoes_financeiras_runs"
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
      integracoes_financeiras_runs: {
        Row: {
          artifact_id: number | null
          artifact_name: string | null
          business_digest: string | null
          criado_em: string
          exercicio: number
          id: string
          origem: string
          publicado_em: string | null
          publication_result: string | null
          snapshot_digest: string | null
          total_contas: number
          total_repasses: number
          total_unidades: number
          workflow_run_id: number | null
        }
        Insert: {
          artifact_id?: number | null
          artifact_name?: string | null
          business_digest?: string | null
          criado_em?: string
          exercicio: number
          id?: string
          origem: string
          publicado_em?: string | null
          publication_result?: string | null
          snapshot_digest?: string | null
          total_contas?: number
          total_repasses?: number
          total_unidades?: number
          workflow_run_id?: number | null
        }
        Update: {
          artifact_id?: number | null
          artifact_name?: string | null
          business_digest?: string | null
          criado_em?: string
          exercicio?: number
          id?: string
          origem?: string
          publicado_em?: string | null
          publication_result?: string | null
          snapshot_digest?: string | null
          total_contas?: number
          total_repasses?: number
          total_unidades?: number
          workflow_run_id?: number | null
        }
        Relationships: []
      }
      repasse_evidencias_financeiras: {
        Row: {
          capital_pago_informado: number | null
          created_at: string
          custeio_pago_informado: number | null
          data_ordem_pagamento: string | null
          data_pagamento: string | null
          fonte: string
          id: string
          observacao: string | null
          referencia: string
          repasse_financeiro_id: string
          tipo_evidencia: string
          updated_at: string
          valor_pago_informado: number | null
        }
        Insert: {
          capital_pago_informado?: number | null
          created_at?: string
          custeio_pago_informado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          fonte: string
          id?: string
          observacao?: string | null
          referencia: string
          repasse_financeiro_id: string
          tipo_evidencia: string
          updated_at?: string
          valor_pago_informado?: number | null
        }
        Update: {
          capital_pago_informado?: number | null
          created_at?: string
          custeio_pago_informado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          fonte?: string
          id?: string
          observacao?: string | null
          referencia?: string
          repasse_financeiro_id?: string
          tipo_evidencia?: string
          updated_at?: string
          valor_pago_informado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repasse_evidencias_financeiras_repasse_financeiro_id_fkey"
            columns: ["repasse_financeiro_id"]
            isOneToOne: false
            referencedRelation: "repasses_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_evidencias_financeiras_repasse_financeiro_id_fkey"
            columns: ["repasse_financeiro_id"]
            isOneToOne: false
            referencedRelation: "vw_repasses_financeiros_unidade"
            referencedColumns: ["id"]
          },
        ]
      }
      repasses_financeiros: {
        Row: {
          acao: string
          capital_pago: number | null
          capital_programado: number | null
          conta_bancaria_id: string | null
          created_at: string
          custeio_pago: number | null
          custeio_programado: number | null
          data_ordem_pagamento: string | null
          data_pagamento: string | null
          exercicio: number
          id: string
          integracao_run_id: string
          ordem_exibicao: number
          parcela: string
          programa: string
          unidade_id: string
          updated_at: string
          valor_pago: number | null
          valor_programado: number
        }
        Insert: {
          acao: string
          capital_pago?: number | null
          capital_programado?: number | null
          conta_bancaria_id?: string | null
          created_at?: string
          custeio_pago?: number | null
          custeio_programado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          exercicio: number
          id?: string
          integracao_run_id: string
          ordem_exibicao?: number
          parcela: string
          programa: string
          unidade_id: string
          updated_at?: string
          valor_pago?: number | null
          valor_programado: number
        }
        Update: {
          acao?: string
          capital_pago?: number | null
          capital_programado?: number | null
          conta_bancaria_id?: string | null
          created_at?: string
          custeio_pago?: number | null
          custeio_programado?: number | null
          data_ordem_pagamento?: string | null
          data_pagamento?: string | null
          exercicio?: number
          id?: string
          integracao_run_id?: string
          ordem_exibicao?: number
          parcela?: string
          programa?: string
          unidade_id?: string
          updated_at?: string
          valor_pago?: number | null
          valor_programado?: number
        }
        Relationships: [
          {
            foreignKeyName: "repasses_financeiros_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasses_financeiros_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_repasses_financeiros_unidade"
            referencedColumns: ["conta_bancaria_id"]
          },
          {
            foreignKeyName: "repasses_financeiros_integracao_run_id_fkey"
            columns: ["integracao_run_id"]
            isOneToOne: false
            referencedRelation: "integracoes_financeiras_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidade_detalhe"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_localizador"
            referencedColumns: ["id"]
          },
        ]
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
      vw_financial_dimension_publication: {
        Row: {
          coverage_expected: number | null
          coverage_observed: number | null
          coverage_ratio: number | null
          dimension_key: string | null
          exercise: number | null
          publication_status: string | null
          published_at: string | null
          quality_status: string | null
          reference_date_max: string | null
          reference_date_min: string | null
          validated_at: string | null
        }
        Insert: {
          coverage_expected?: number | null
          coverage_observed?: number | null
          coverage_ratio?: number | null
          dimension_key?: string | null
          exercise?: number | null
          publication_status?: string | null
          published_at?: string | null
          quality_status?: string | null
          reference_date_max?: string | null
          reference_date_min?: string | null
          validated_at?: string | null
        }
        Update: {
          coverage_expected?: number | null
          coverage_observed?: number | null
          coverage_ratio?: number | null
          dimension_key?: string | null
          exercise?: number | null
          publication_status?: string | null
          published_at?: string | null
          quality_status?: string | null
          reference_date_max?: string | null
          reference_date_min?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_dimension_status_contract_fkey"
            columns: ["dimension_key", "exercise"]
            isOneToOne: false
            referencedRelation: "financial_dimension_contracts"
            referencedColumns: ["dimension_key", "exercise"]
          },
        ]
      }
      vw_repasses_financeiros_unidade: {
        Row: {
          acao: string | null
          agencia: string | null
          banco: string | null
          capital_pago: number | null
          capital_programado: number | null
          conta_bancaria_id: string | null
          conta_corrente: string | null
          custeio_pago: number | null
          custeio_programado: number | null
          data_ordem_pagamento: string | null
          data_pagamento: string | null
          designacao: string | null
          exercicio: number | null
          id: string | null
          inep: string | null
          nome: string | null
          ordem_exibicao: number | null
          parcela: string | null
          programa: string | null
          unidade_id: string | null
          valor_pago: number | null
          valor_programado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_escolares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidade_detalhe"
            referencedColumns: ["unidade_id"]
          },
          {
            foreignKeyName: "repasses_financeiros_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "vw_unidades_localizador"
            referencedColumns: ["id"]
          },
        ]
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
      get_financial_dimension_publication_v1: {
        Args: { p_exercise: number }
        Returns: {
          coverage_expected: number
          coverage_observed: number
          coverage_ratio: number
          dimension_key: string
          exercise: number
          publication_status: string
          published_at: string
          quality_status: string
          reference_date_max: string
          reference_date_min: string
          validated_at: string
        }[]
      }
      get_financial_freshness_v1: {
        Args: { p_exercise: number }
        Returns: {
          artifact_id: number
          exercise: number
          publication_result: string
          source_published_at: string
          storage_recorded_at: string
          workflow_run_id: number
        }[]
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
      publish_financial_snapshot_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      publish_financial_snapshot_with_order_evidence_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      publish_financial_snapshot_with_order_evidence_v2: {
        Args: { p_payload: Json }
        Returns: Json
      }
      sync_financial_order_evidence_v1: {
        Args: { p_payload: Json }
        Returns: Json
      }
      update_unidade_cadastro_minima:
        | {
            Args: {
              p_diretor: string
              p_endereco: string
              p_nome: string
              p_unidade_id: string
            }
            Returns: string
          }
        | {
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "operador"],
    },
  },
} as const
