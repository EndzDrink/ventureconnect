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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string | null
          comments: number | null
          created_at: string
          creator_id: string
          date: string | null
          description: string | null
          difficulty: string | null
          duration: string | null
          id: string
          image_url: string | null
          lat: number | null
          likes: number | null
          lng: number | null
          location: string | null
          max_participants: number | null
          meeting_point: string | null
          participants: number | null
          price: number | null
          title: string
          user_id: string | null
          what_to_bring: string | null
        }
        Insert: {
          category?: string | null
          comments?: number | null
          created_at?: string
          creator_id: string
          date?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          likes?: number | null
          lng?: number | null
          location?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          participants?: number | null
          price?: number | null
          title: string
          user_id?: string | null
          what_to_bring?: string | null
        }
        Update: {
          category?: string | null
          comments?: number | null
          created_at?: string
          creator_id?: string
          date?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          likes?: number | null
          lng?: number | null
          location?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          participants?: number | null
          price?: number | null
          title?: string
          user_id?: string | null
          what_to_bring?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_creator_id_fkey1"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
        Row: {
          activity_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string
          created_at?: string | null
          user_id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          discount_price: number | null
          id: number
          image_url: string | null
          is_urgent: boolean | null
          location: string | null
          original_price: number | null
          rating: number | null
          reviews: number | null
          time_left: string | null
          title: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          id?: number
          image_url?: string | null
          is_urgent?: boolean | null
          location?: string | null
          original_price?: number | null
          rating?: number | null
          reviews?: number | null
          time_left?: string | null
          title?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          id?: number
          image_url?: string | null
          is_urgent?: boolean | null
          location?: string | null
          original_price?: number | null
          rating?: number | null
          reviews?: number | null
          time_left?: string | null
          title?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      event_memories: {
        Row: {
          activity_id: string | null
          caption: string | null
          created_at: string
          id: string
          location_name: string | null
          media_type: string | null
          media_url: string
          song_data: Json | null
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          location_name?: string | null
          media_type?: string | null
          media_url: string
          song_data?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          location_name?: string | null
          media_type?: string | null
          media_url?: string
          song_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_memories_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          creator_id: string
          date: string | null
          description: string | null
          difficulty: string | null
          id: number
          location: string
          max_participants: number | null
          participants: number | null
          price: string | null
          time: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          creator_id: string
          date?: string | null
          description?: string | null
          difficulty?: string | null
          id?: number
          location: string
          max_participants?: number | null
          participants?: number | null
          price?: string | null
          time?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          creator_id?: string
          date?: string | null
          description?: string | null
          difficulty?: string | null
          id?: number
          location?: string
          max_participants?: number | null
          participants?: number | null
          price?: string | null
          time?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_partners: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          discount: string | null
          discount_price: string | null
          features: string[] | null
          id: number
          location: string | null
          logo_image_url: string | null
          name: string | null
          original_price: string | null
          rating: number | null
          reviews: number | null
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount?: string | null
          discount_price?: string | null
          features?: string[] | null
          id?: number
          location?: string | null
          logo_image_url?: string | null
          name?: string | null
          original_price?: string | null
          rating?: number | null
          reviews?: number | null
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount?: string | null
          discount_price?: string | null
          features?: string[] | null
          id?: number
          location?: string | null
          logo_image_url?: string | null
          name?: string | null
          original_price?: string | null
          rating?: number | null
          reviews?: number | null
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      memory_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          memory_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          memory_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memory_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_comments_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "event_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_likes: {
        Row: {
          created_at: string
          id: string
          memory_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          memory_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          memory_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_likes_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "event_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          is_ai_response: boolean | null
          is_read: boolean | null
          sender_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bg_image_url: string | null
          bio: string | null
          Bio: string | null
          created_at: string
          full_name: string | null
          id: string
          interests: Json | null
          looking_for: string | null
          next_trip: string | null
          rating: number | null
          trips: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bg_image_url?: string | null
          bio?: string | null
          Bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          interests?: Json | null
          looking_for?: string | null
          next_trip?: string | null
          rating?: number | null
          trips?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bg_image_url?: string | null
          bio?: string | null
          Bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          interests?: Json | null
          looking_for?: string | null
          next_trip?: string | null
          rating?: number | null
          trips?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      travel_buddies: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: number
          interests: string[] | null
          last_activity_at: string | null
          location: string | null
          looking_for: string | null
          name: string | null
          next_trip: string | null
          rating: number | null
          status: Database["public"]["Enums"]["buddy_status"]
          trips: number | null
          user_id_1: string
          user_id_2: string
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: number
          interests?: string[] | null
          last_activity_at?: string | null
          location?: string | null
          looking_for?: string | null
          name?: string | null
          next_trip?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["buddy_status"]
          trips?: number | null
          user_id_1: string
          user_id_2: string
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: number
          interests?: string[] | null
          last_activity_at?: string | null
          location?: string | null
          looking_for?: string | null
          name?: string | null
          next_trip?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["buddy_status"]
          trips?: number | null
          user_id_1?: string
          user_id_2?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_buddies_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_buddies_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_details: {
        Row: {
          created_at: string | null
          id: string | null
          last_message_at: string | null
          last_message_text: string | null
          unread_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          last_message_text?: string | null
          unread_count?: never
        }
        Update: {
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          last_message_text?: string | null
          unread_count?: never
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      buddy_status: "pending" | "accepted" | "rejected"
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
      buddy_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
