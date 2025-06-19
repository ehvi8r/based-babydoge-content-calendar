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
      calendar_events: {
        Row: {
          created_at: string | null
          created_by: string
          date: string
          description: string | null
          id: string
          link: string | null
          time: string | null
          title: string
          type: Database["public"]["Enums"]["calendar_event_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          date: string
          description?: string | null
          id?: string
          link?: string | null
          time?: string | null
          title: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          link?: string | null
          time?: string | null
          title?: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      global_banners: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          created_at: string | null
          id: string
          impressions: number | null
          last_updated: string | null
          likes: number | null
          published_post_id: string | null
          replies: number | null
          retweets: number | null
          tweet_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          impressions?: number | null
          last_updated?: string | null
          likes?: number | null
          published_post_id?: string | null
          replies?: number | null
          retweets?: number | null
          tweet_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          impressions?: number | null
          last_updated?: string | null
          likes?: number | null
          published_post_id?: string | null
          replies?: number | null
          retweets?: number | null
          tweet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_published_post_id_fkey"
            columns: ["published_post_id"]
            isOneToOne: false
            referencedRelation: "published_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      published_posts: {
        Row: {
          content: string
          content_hash: string
          created_at: string | null
          hashtags: string | null
          id: string
          image_url: string | null
          original_scheduled_post_id: string | null
          published_at: string | null
          tweet_id: string | null
          tweet_url: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          original_scheduled_post_id?: string | null
          published_at?: string | null
          tweet_id?: string | null
          tweet_url?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          original_scheduled_post_id?: string | null
          published_at?: string | null
          tweet_id?: string | null
          tweet_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          content_hash: string
          created_at: string | null
          error_message: string | null
          hashtags: string | null
          id: string
          image_url: string | null
          max_retries: number | null
          retry_count: number | null
          scheduled_for: string
          status: Database["public"]["Enums"]["post_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          max_retries?: number | null
          retry_count?: number | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          max_retries?: number | null
          retry_count?: number | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
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
      accept_team_invitation: {
        Args: { _token: string }
        Returns: boolean
      }
      assign_user_role: {
        Args: { target_user_id: string; user_role: string; assigner_id: string }
        Returns: boolean
      }
      can_modify_calendar_events: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_recent_duplicate: {
        Args: {
          p_user_id: string
          p_content_hash: string
          p_hours_window?: number
        }
        Returns: boolean
      }
      generate_content_hash: {
        Args: { content_text: string; hashtags_text?: string }
        Returns: string
      }
      get_admin_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_team_member_of_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "team_member" | "user"
      calendar_event_type: "space" | "meeting" | "event"
      post_status: "scheduled" | "publishing" | "published" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "team_member", "user"],
      calendar_event_type: ["space", "meeting", "event"],
      post_status: ["scheduled", "publishing", "published", "failed"],
    },
  },
} as const
