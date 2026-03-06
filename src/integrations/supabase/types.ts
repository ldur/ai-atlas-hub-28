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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catalog_entries: {
        Row: {
          avoid_this: string | null
          best_for: string | null
          created_at: string
          do_this: string | null
          example_prompts: string | null
          id: string
          last_updated: string
          model_id: string | null
          recommended_models: string | null
          security_guidance: string | null
          tool_id: string | null
        }
        Insert: {
          avoid_this?: string | null
          best_for?: string | null
          created_at?: string
          do_this?: string | null
          example_prompts?: string | null
          id?: string
          last_updated?: string
          model_id?: string | null
          recommended_models?: string | null
          security_guidance?: string | null
          tool_id?: string | null
        }
        Update: {
          avoid_this?: string | null
          best_for?: string | null
          created_at?: string
          do_this?: string | null
          example_prompts?: string | null
          id?: string
          last_updated?: string
          model_id?: string | null
          recommended_models?: string | null
          security_guidance?: string | null
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_entries_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_entries_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          cost_score: number | null
          created_at: string
          decided_at: string
          decided_status: string
          id: string
          model_id: string | null
          rationale: string | null
          risk_score: number | null
          tool_id: string | null
          value_score: number | null
          version: string | null
        }
        Insert: {
          cost_score?: number | null
          created_at?: string
          decided_at?: string
          decided_status?: string
          id?: string
          model_id?: string | null
          rationale?: string | null
          risk_score?: number | null
          tool_id?: string | null
          value_score?: number | null
          version?: string | null
        }
        Update: {
          cost_score?: number | null
          created_at?: string
          decided_at?: string
          decided_status?: string
          id?: string
          model_id?: string | null
          rationale?: string | null
          risk_score?: number | null
          tool_id?: string | null
          value_score?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          published: boolean | null
          submitted_by: string | null
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          submitted_by?: string | null
          tags?: string[] | null
          title: string
          type?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          submitted_by?: string | null
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_items_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_aliases"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          id: string
          link: string | null
          modality: string | null
          name: string
          notes: string | null
          provider: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          modality?: string | null
          name: string
          notes?: string | null
          provider?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          modality?: string | null
          name?: string
          notes?: string | null
          provider?: string | null
        }
        Relationships: []
      }
      org_usage_params: {
        Row: {
          created_at: string
          id: string
          monthly_api_calls: number
          monthly_input_tokens: number
          monthly_output_tokens: number
          notes: string | null
          num_seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_api_calls?: number
          monthly_input_tokens?: number
          monthly_output_tokens?: number
          notes?: string | null
          num_seats?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_api_calls?: number
          monthly_input_tokens?: number
          monthly_output_tokens?: number
          notes?: string | null
          num_seats?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_configs: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          currency: string
          id: string
          input_token_price: number | null
          last_fetched: string | null
          model_id: string | null
          notes: string | null
          output_token_price: number | null
          pricing_type: string
          selected_tier_index: number
          tiers: Json | null
          tool_id: string | null
          updated_at: string
          user_count: number
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          currency?: string
          id?: string
          input_token_price?: number | null
          last_fetched?: string | null
          model_id?: string | null
          notes?: string | null
          output_token_price?: number | null
          pricing_type?: string
          selected_tier_index?: number
          tiers?: Json | null
          tool_id?: string | null
          updated_at?: string
          user_count?: number
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          currency?: string
          id?: string
          input_token_price?: number | null
          last_fetched?: string | null
          model_id?: string | null
          notes?: string | null
          output_token_price?: number | null
          pricing_type?: string
          selected_tier_index?: number
          tiers?: Json | null
          tool_id?: string | null
          updated_at?: string
          user_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_configs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_configs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          published: boolean | null
          submitted_by: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean | null
          submitted_by?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean | null
          submitted_by?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_links_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_aliases"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          alias_id: string | null
          created_at: string
          data_sensitivity: string | null
          id: string
          models_used: string[] | null
          must_keep_tool: string | null
          pain_points: string | null
          role: string | null
          survey_id: string | null
          team: string | null
          time_saved_range: string | null
          tools_freetext: string | null
          tools_used: string[] | null
          use_cases: string[] | null
        }
        Insert: {
          alias_id?: string | null
          created_at?: string
          data_sensitivity?: string | null
          id?: string
          models_used?: string[] | null
          must_keep_tool?: string | null
          pain_points?: string | null
          role?: string | null
          survey_id?: string | null
          team?: string | null
          time_saved_range?: string | null
          tools_freetext?: string | null
          tools_used?: string[] | null
          use_cases?: string[] | null
        }
        Update: {
          alias_id?: string | null
          created_at?: string
          data_sensitivity?: string | null
          id?: string
          models_used?: string[] | null
          must_keep_tool?: string | null
          pain_points?: string | null
          role?: string | null
          survey_id?: string | null
          team?: string | null
          time_saved_range?: string | null
          tools_freetext?: string | null
          tools_used?: string[] | null
          use_cases?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "user_aliases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string | null
          created_at: string
          id: string
          link: string | null
          name: string
          notes: string | null
          vendor: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          name: string
          notes?: string | null
          vendor?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          name?: string
          notes?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      user_aliases: {
        Row: {
          created_at: string
          id: string
          nickname: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          alias_id: string | null
          created_at: string
          id: string
          learning_item_id: string | null
          tool_id: string | null
        }
        Insert: {
          alias_id?: string | null
          created_at?: string
          id?: string
          learning_item_id?: string | null
          tool_id?: string | null
        }
        Update: {
          alias_id?: string | null
          created_at?: string
          id?: string
          learning_item_id?: string | null
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "user_aliases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
