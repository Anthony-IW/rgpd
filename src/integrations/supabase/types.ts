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
      action_attachments: {
        Row: {
          action_id: string
          company_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          action_id: string
          company_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          action_id?: string
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_attachments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          audit_id: string | null
          category: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          owner_id: string
          pending_comment: string | null
          pending_status: Database["public"]["Enums"]["action_status"] | null
          pending_submitted_at: string | null
          pending_submitted_by: string | null
          priority: Database["public"]["Enums"]["action_priority"]
          related_question_id: string | null
          responsible: string | null
          status: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_note: string | null
        }
        Insert: {
          audit_id?: string | null
          category?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          pending_comment?: string | null
          pending_status?: Database["public"]["Enums"]["action_status"] | null
          pending_submitted_at?: string | null
          pending_submitted_by?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          related_question_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Update: {
          audit_id?: string | null
          category?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          pending_comment?: string | null
          pending_status?: Database["public"]["Enums"]["action_status"] | null
          pending_submitted_at?: string | null
          pending_submitted_by?: string | null
          priority?: Database["public"]["Enums"]["action_priority"]
          related_question_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_questions_snapshot: {
        Row: {
          applicability_condition: string | null
          audit_id: string
          category_id: string
          category_name: string | null
          created_at: string
          exclusion_reason: string | null
          help: string | null
          id: string
          included: boolean
          inclusion_reason: string | null
          legal_reference: string | null
          legal_status: Database["public"]["Enums"]["legal_status"]
          position: number
          question_code: string
          risk: Database["public"]["Enums"]["risk_level"]
          text: string
          weight: number
        }
        Insert: {
          applicability_condition?: string | null
          audit_id: string
          category_id: string
          category_name?: string | null
          created_at?: string
          exclusion_reason?: string | null
          help?: string | null
          id?: string
          included?: boolean
          inclusion_reason?: string | null
          legal_reference?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status"]
          position?: number
          question_code: string
          risk?: Database["public"]["Enums"]["risk_level"]
          text: string
          weight?: number
        }
        Update: {
          applicability_condition?: string | null
          audit_id?: string
          category_id?: string
          category_name?: string | null
          created_at?: string
          exclusion_reason?: string | null
          help?: string | null
          id?: string
          included?: boolean
          inclusion_reason?: string | null
          legal_reference?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status"]
          position?: number
          question_code?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          text?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_questions_snapshot_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_responses: {
        Row: {
          audit_id: string
          category: string
          comment: string | null
          cost_estimate: number | null
          created_at: string
          due_date: string | null
          evidence: string | null
          id: string
          justification: string | null
          level: Database["public"]["Enums"]["compliance_level"]
          priority: string | null
          question_id: string
          recommendation: string | null
          remediation_state: string | null
          responsible: string | null
          updated_at: string
        }
        Insert: {
          audit_id: string
          category: string
          comment?: string | null
          cost_estimate?: number | null
          created_at?: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          justification?: string | null
          level?: Database["public"]["Enums"]["compliance_level"]
          priority?: string | null
          question_id: string
          recommendation?: string | null
          remediation_state?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          audit_id?: string
          category?: string
          comment?: string | null
          cost_estimate?: number | null
          created_at?: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          justification?: string | null
          level?: Database["public"]["Enums"]["compliance_level"]
          priority?: string | null
          question_id?: string
          recommendation?: string | null
          remediation_state?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_responses_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_scope_snapshot: {
        Row: {
          audit_id: string
          created_at: string
          excluded_modules: Json
          id: string
          included_modules: Json
          profile: Json
          updated_at: string
          version_id: string | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          excluded_modules?: Json
          id?: string
          included_modules?: Json
          profile?: Json
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          excluded_modules?: Json
          id?: string
          included_modules?: Json
          profile?: Json
          updated_at?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_scope_snapshot_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: true
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_scope_snapshot_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          company_id: string
          completed_at: string | null
          conformity_summary: Json | null
          coverage_score: number | null
          created_at: string
          description: string | null
          end_date: string | null
          engine_version: string
          executive_summary: string | null
          global_score: number | null
          id: string
          maturity_score: number | null
          owner_id: string
          questionnaire_version_id: string | null
          recommendations: string | null
          regulatory_score: number | null
          scope: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          conformity_summary?: Json | null
          coverage_score?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          engine_version?: string
          executive_summary?: string | null
          global_score?: number | null
          id?: string
          maturity_score?: number | null
          owner_id: string
          questionnaire_version_id?: string | null
          recommendations?: string | null
          regulatory_score?: number | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          conformity_summary?: Json | null
          coverage_score?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          engine_version?: string
          executive_summary?: string | null
          global_score?: number | null
          id?: string
          maturity_score?: number | null
          owner_id?: string
          questionnaire_version_id?: string | null
          recommendations?: string | null
          regulatory_score?: number | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_questionnaire_version_id_fkey"
            columns: ["questionnaire_version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          owner_id: string
          related_action_id: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          owner_id: string
          related_action_id?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          owner_id?: string
          related_action_id?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          closed_dates: string[]
          closed_weekdays: number[]
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_role: string | null
          country: string | null
          created_at: string
          dpo_email: string | null
          dpo_external: boolean | null
          dpo_name: string | null
          dpo_phone: string | null
          employees_count: number | null
          has_dpo: boolean | null
          has_representative: boolean | null
          id: string
          legal_form: string | null
          name: string
          notes: string | null
          owner_id: string
          postal_code: string | null
          representative_name: string | null
          sector: string | null
          siret: string | null
          size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closed_dates?: string[]
          closed_weekdays?: number[]
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          dpo_email?: string | null
          dpo_external?: boolean | null
          dpo_name?: string | null
          dpo_phone?: string | null
          employees_count?: number | null
          has_dpo?: boolean | null
          has_representative?: boolean | null
          id?: string
          legal_form?: string | null
          name: string
          notes?: string | null
          owner_id: string
          postal_code?: string | null
          representative_name?: string | null
          sector?: string | null
          siret?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closed_dates?: string[]
          closed_weekdays?: number[]
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          dpo_email?: string | null
          dpo_external?: boolean | null
          dpo_name?: string | null
          dpo_phone?: string | null
          employees_count?: number | null
          has_dpo?: boolean | null
          has_representative?: boolean | null
          id?: string
          legal_form?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          postal_code?: string | null
          representative_name?: string | null
          sector?: string | null
          siret?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_profile_answers: {
        Row: {
          answer: Database["public"]["Enums"]["tristate"]
          company_id: string
          created_at: string
          id: string
          module_code: string
          note: string | null
          updated_at: string
        }
        Insert: {
          answer?: Database["public"]["Enums"]["tristate"]
          company_id: string
          created_at?: string
          id?: string
          module_code: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          answer?: Database["public"]["Enums"]["tristate"]
          company_id?: string
          created_at?: string
          id?: string
          module_code?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_profile_answers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          headcount: number | null
          id: string
          primary_sector_id: string | null
          respondent_name: string | null
          respondent_role: string | null
          secondary_sector_ids: string[]
          size: string | null
          subsector_ids: string[]
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          headcount?: number | null
          id?: string
          primary_sector_id?: string | null
          respondent_name?: string | null
          respondent_role?: string | null
          secondary_sector_ids?: string[]
          size?: string | null
          subsector_ids?: string[]
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          headcount?: number | null
          id?: string
          primary_sector_id?: string | null
          respondent_name?: string | null
          respondent_role?: string | null
          secondary_sector_ids?: string[]
          size?: string | null
          subsector_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_primary_sector_id_fkey"
            columns: ["primary_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          company_id: string
          created_at: string
          form_version: string | null
          given_at: string | null
          id: string
          notes: string | null
          owner_id: string
          proof: string | null
          purpose: string
          status: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          form_version?: string | null
          given_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          proof?: string | null
          purpose: string
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          form_version?: string | null
          given_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          proof?: string | null
          purpose?: string
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_breaches: {
        Row: {
          affected_count: number | null
          company_id: string
          created_at: string
          data_categories: string[] | null
          description: string | null
          discovery_at: string
          id: string
          measures_taken: string | null
          notification_due_at: string | null
          notified_cnil: boolean | null
          notified_subjects: boolean | null
          owner_id: string
          related_action_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_count?: number | null
          company_id: string
          created_at?: string
          data_categories?: string[] | null
          description?: string | null
          discovery_at: string
          id?: string
          measures_taken?: string | null
          notification_due_at?: string | null
          notified_cnil?: boolean | null
          notified_subjects?: boolean | null
          owner_id: string
          related_action_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_count?: number | null
          company_id?: string
          created_at?: string
          data_categories?: string[] | null
          description?: string | null
          discovery_at?: string
          id?: string
          measures_taken?: string | null
          notification_due_at?: string | null
          notified_cnil?: boolean | null
          notified_subjects?: boolean | null
          owner_id?: string
          related_action_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_breaches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_breaches_related_action_id_fkey"
            columns: ["related_action_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          channel: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          received_at: string
          requester_email: string | null
          requester_name: string | null
          response_due_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          channel?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          received_at: string
          requester_email?: string | null
          requester_name?: string | null
          response_due_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          received_at?: string
          requester_email?: string | null
          requester_name?: string | null
          response_due_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          is_template: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_template?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_template?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dpia: {
        Row: {
          audit_id: string | null
          company_id: string
          created_at: string
          id: string
          measures: string | null
          necessity_assessment: string | null
          owner_id: string
          processing_record_id: string | null
          proportionality_assessment: string | null
          residual_risk_score: number | null
          risk_assessment: string | null
          status: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          audit_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          measures?: string | null
          necessity_assessment?: string | null
          owner_id: string
          processing_record_id?: string | null
          proportionality_assessment?: string | null
          residual_risk_score?: number | null
          risk_assessment?: string | null
          status?: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          audit_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          measures?: string | null
          necessity_assessment?: string | null
          owner_id?: string
          processing_record_id?: string | null
          proportionality_assessment?: string | null
          residual_risk_score?: number | null
          risk_assessment?: string | null
          status?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dpia_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dpia_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dpia_processing_record_id_fkey"
            columns: ["processing_record_id"]
            isOneToOne: false
            referencedRelation: "processing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      functional_modules: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      module_activation_questions: {
        Row: {
          archived_at: string | null
          created_at: string
          help: string | null
          id: string
          module_id: string
          position: number
          step: number
          text: string
          unknown_keeps_questions: boolean
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          help?: string | null
          id?: string
          module_id: string
          position?: number
          step?: number
          text: string
          unknown_keeps_questions?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          help?: string | null
          id?: string
          module_id?: string
          position?: number
          step?: number
          text?: string
          unknown_keeps_questions?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_activation_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "functional_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          id: string
          milestone: number
          recipient_email: string
          sent_at: string
          source_id: string
          source_type: string
        }
        Insert: {
          id?: string
          milestone: number
          recipient_email: string
          sent_at?: string
          source_id: string
          source_type: string
        }
        Update: {
          id?: string
          milestone?: number
          recipient_email?: string
          sent_at?: string
          source_id?: string
          source_type?: string
        }
        Relationships: []
      }
      processing_records: {
        Row: {
          company_id: string
          created_at: string
          data_categories: string[] | null
          data_subjects: string[] | null
          dpia_completed: boolean | null
          dpia_required: boolean | null
          dpia_url: string | null
          id: string
          international_transfer: boolean | null
          legal_basis: Database["public"]["Enums"]["legal_basis"] | null
          legal_basis_details: string | null
          name: string
          notes: string | null
          owner_id: string
          purpose: string
          recipients: string[] | null
          retention_justification: string | null
          retention_period: string | null
          security_measures: string | null
          sensitive_data: boolean | null
          sensitive_data_details: string | null
          source: string | null
          subcontractors: string[] | null
          transfer_countries: string[] | null
          transfer_safeguards: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_categories?: string[] | null
          data_subjects?: string[] | null
          dpia_completed?: boolean | null
          dpia_required?: boolean | null
          dpia_url?: string | null
          id?: string
          international_transfer?: boolean | null
          legal_basis?: Database["public"]["Enums"]["legal_basis"] | null
          legal_basis_details?: string | null
          name: string
          notes?: string | null
          owner_id: string
          purpose: string
          recipients?: string[] | null
          retention_justification?: string | null
          retention_period?: string | null
          security_measures?: string | null
          sensitive_data?: boolean | null
          sensitive_data_details?: string | null
          source?: string | null
          subcontractors?: string[] | null
          transfer_countries?: string[] | null
          transfer_safeguards?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_categories?: string[] | null
          data_subjects?: string[] | null
          dpia_completed?: boolean | null
          dpia_required?: boolean | null
          dpia_url?: string | null
          id?: string
          international_transfer?: boolean | null
          legal_basis?: Database["public"]["Enums"]["legal_basis"] | null
          legal_basis_details?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          purpose?: string
          recipients?: string[] | null
          retention_justification?: string | null
          retention_period?: string | null
          security_measures?: string | null
          sensitive_data?: boolean | null
          sensitive_data_details?: string | null
          source?: string | null
          subcontractors?: string[] | null
          transfer_countries?: string[] | null
          transfer_safeguards?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_modules: {
        Row: {
          exclusive: boolean
          module_id: string
          question_id: string
        }
        Insert: {
          exclusive?: boolean
          module_id: string
          question_id: string
        }
        Update: {
          exclusive?: boolean
          module_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "functional_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_modules_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ref_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_rules: {
        Row: {
          conditions: Json
          created_at: string
          id: string
          label: string | null
          operator: Database["public"]["Enums"]["rule_operator"]
          question_id: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          id?: string
          label?: string | null
          operator?: Database["public"]["Enums"]["rule_operator"]
          question_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          id?: string
          label?: string | null
          operator?: Database["public"]["Enums"]["rule_operator"]
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_rules_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ref_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sectors: {
        Row: {
          question_id: string
          sector_id: string
        }
        Insert: {
          question_id: string
          sector_id: string
        }
        Update: {
          question_id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sectors_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ref_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      question_subsectors: {
        Row: {
          question_id: string
          subsector_id: string
        }
        Insert: {
          question_id: string
          subsector_id: string
        }
        Update: {
          question_id?: string
          subsector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_subsectors_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ref_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_subsectors_subsector_id_fkey"
            columns: ["subsector_id"]
            isOneToOne: false
            referencedRelation: "subsectors"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_versions: {
        Row: {
          created_at: string
          id: string
          label: string | null
          number: number
          published_at: string | null
          published_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          number: number
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          number?: number
          published_at?: string | null
          published_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ref_questions: {
        Row: {
          applicability_condition: string | null
          archived_at: string | null
          category_id: string
          category_name: string | null
          code: string
          created_at: string
          created_by: string | null
          explanation: string | null
          help: string | null
          id: string
          is_core: boolean
          legal_reference: string | null
          legal_status: Database["public"]["Enums"]["legal_status"]
          needs_review: boolean
          position: number
          recommendations: string[]
          risk: Database["public"]["Enums"]["risk_level"]
          text: string
          updated_at: string
          updated_by: string | null
          version_id: string | null
          weight: number
        }
        Insert: {
          applicability_condition?: string | null
          archived_at?: string | null
          category_id: string
          category_name?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          help?: string | null
          id?: string
          is_core?: boolean
          legal_reference?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status"]
          needs_review?: boolean
          position?: number
          recommendations?: string[]
          risk?: Database["public"]["Enums"]["risk_level"]
          text: string
          updated_at?: string
          updated_by?: string | null
          version_id?: string | null
          weight?: number
        }
        Update: {
          applicability_condition?: string | null
          archived_at?: string | null
          category_id?: string
          category_name?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          help?: string | null
          id?: string
          is_core?: boolean
          legal_reference?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status"]
          needs_review?: boolean
          position?: number
          recommendations?: string[]
          risk?: Database["public"]["Enums"]["risk_level"]
          text?: string
          updated_at?: string
          updated_by?: string | null
          version_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ref_questions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          id: string
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          id?: string
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          dpa_renewal_date: string | null
          dpa_signed_at: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          safeguards: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dpa_renewal_date?: string | null
          dpa_signed_at?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          safeguards?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dpa_renewal_date?: string | null
          dpa_signed_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          safeguards?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subsectors: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          id: string
          label: string
          position: number
          sector_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          id?: string
          label: string
          position?: number
          sector_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_client: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_client_companies: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      action_priority: "critique" | "haute" | "moyenne" | "basse"
      action_status:
        | "a_faire"
        | "en_cours"
        | "fait"
        | "reporte"
        | "conforme"
        | "non_applicable"
      app_role: "admin" | "auditor" | "client"
      audit_status: "draft" | "in_progress" | "completed" | "archived"
      compliance_level:
        | "conforme"
        | "partiel"
        | "non_conforme"
        | "non_applicable"
        | "a_evaluer"
      legal_basis:
        | "consentement"
        | "contrat"
        | "obligation_legale"
        | "interets_vitaux"
        | "mission_interet_public"
        | "interets_legitimes"
      legal_status:
        | "OBLIGATOIRE"
        | "OBLIGATOIRE_SI_APPLICABLE"
        | "RECOMMANDE"
        | "NON_OBLIGATOIRE_EN_TANT_QUE_TEL"
      risk_level: "faible" | "moyen" | "eleve" | "critique"
      rule_operator: "ALL" | "ANY" | "NOT"
      tristate: "oui" | "non" | "inconnu"
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
      action_priority: ["critique", "haute", "moyenne", "basse"],
      action_status: [
        "a_faire",
        "en_cours",
        "fait",
        "reporte",
        "conforme",
        "non_applicable",
      ],
      app_role: ["admin", "auditor", "client"],
      audit_status: ["draft", "in_progress", "completed", "archived"],
      compliance_level: [
        "conforme",
        "partiel",
        "non_conforme",
        "non_applicable",
        "a_evaluer",
      ],
      legal_basis: [
        "consentement",
        "contrat",
        "obligation_legale",
        "interets_vitaux",
        "mission_interet_public",
        "interets_legitimes",
      ],
      legal_status: [
        "OBLIGATOIRE",
        "OBLIGATOIRE_SI_APPLICABLE",
        "RECOMMANDE",
        "NON_OBLIGATOIRE_EN_TANT_QUE_TEL",
      ],
      risk_level: ["faible", "moyen", "eleve", "critique"],
      rule_operator: ["ALL", "ANY", "NOT"],
      tristate: ["oui", "non", "inconnu"],
    },
  },
} as const
