// --- WARNING: This file is normally generated automatically by Supabase CLI ---
// The 'deals' table definition has been manually added/updated to match the required 
// fields expected by the 'pages/Deals.tsx' component AND the SQL schema.

// ⚠️ REMOVED: import { Database } from "lucide-react"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = { // 🛠️ ADDED 'export' to make the type available globally
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          location: string | null
          max_participants: number
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
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
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      
      // 🛠️ NEW: Table to link conversations to participants (Junction Table)
      conversation_participants: {
        Row: {
          created_at: string
          conversation_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          conversation_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          conversation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // END 'conversation_participants' TABLE
      
      // 🛠️ NEW: Table to store conversation metadata
      conversations: {
        Row: {
          id: string
          created_at: string
          last_message_text: string | null // For conversation list summary
          last_message_at: string | null   // For sorting conversation list
          // Removed: participant_ids (now in conversation_participants)
        }
        Insert: {
          id?: string
          created_at?: string
          last_message_text?: string | null
          last_message_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          last_message_text?: string | null
          last_message_at?: string | null
        }
        Relationships: []
      }
      // END 'conversations' TABLE
      
      // 🛠️ ADDED 'COMMENTS' TABLE DEFINITION
      comments: {
        Row: {
          id: string
          created_at: string
          user_id: string
          content: string
          // Assuming comments can be linked to either an activity or another object
          activity_id: string | null
          parent_comment_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          content: string
          activity_id?: string | null
          parent_comment_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          content?: string
          activity_id?: string | null
          parent_comment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // END 'COMMENTS' TABLE
      
      // CORRECTLY INTEGRATED 'DEALS' TABLE
      deals: {
        Row: {
          created_at: string
          id: number 
          title: string | null
          description: string | null
          discount_price: number | null
          valid_until: string | null
          location: string | null
          rating: number | null
          reviews: number | null
          is_urgent: boolean | null
          time_left: string | null
          original_price: number | null
          discount_percentage: number | null
        }
        Insert: {
          created_at?: string
          id?: number 
          title?: string | null
          description?: string | null
          discount_price?: number | null
          valid_until?: string | null
          location?: string | null
          rating?: number | null
          reviews?: number | null
          is_urgent?: boolean | null
          time_left?: string | null
          original_price?: number | null
          discount_percentage?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          title?: string | null
          description?: string | null
          discount_price?: number | null
          valid_until?: string | null
          location?: string | null
          rating?: number | null
          reviews?: number | null
          is_urgent?: boolean | null
          time_left?: string | null
          original_price?: number | null
          discount_percentage?: number | null
        }
        Relationships: []
      }
      // END 'DEALS' TABLE
      
      // 🛠️ ADDED 'EVENTS' TABLE DEFINITION
      events: {
        Row: {
          id: string
          created_at: string
          creator_id: string
          title: string
          description: string | null
          date_time: string // ISO 8601 string for timestamp
          location: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          creator_id: string
          title: string
          description?: string | null
          date_time: string
          location?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          creator_id?: string
          title?: string
          description?: string | null
          date_time?: string
          location?: string | null
          is_public?: boolean
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
      // END 'EVENTS' TABLE

      // 🛠️ ADDED 'FEATURED_PARTNERS' TABLE DEFINITION
      featured_partners: {
        Row: {
          created_at: string
          id: string // Assuming UUID or similar for ID
          name: string | null // Using 'name' for the title field
          description: string | null
          link: string | null
          category: string | null
          logo_url: string | null
          discount_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null 
          description?: string | null
          link?: string | null
          category?: string | null
          logo_url?: string | null
          discount_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          description?: string | null
          link?: string | null
          category?: string | null
          logo_url?: string | null
          discount_code?: string | null
        }
        Relationships: []
      }
      // END 'FEATURED_PARTNERS' TABLE
      
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sent_to_activity_id: string | null
          // 🛠️ UPDATED: Added foreign key column
          conversation_id: string | null 
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sent_to_activity_id?: string | null
          // 🛠️ UPDATED: Added foreign key column
          conversation_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sent_to_activity_id?: string | null
          // 🛠️ UPDATED: Added foreign key column
          conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_to_activity_id_fkey"
            columns: ["sent_to_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          // 🛠️ UPDATED: Added relationship to the new conversations table
          {
            foreignKeyName: "fk_conversation" // Assuming this is the name you used for the constraint
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
          username: string
          // 🛠️ ADDED missing fields required by TravelBuddies component
          rating: number | null
          trips: number | null
          interests: Json | null // Using Json to accommodate string[] or string
          bio: string | null
          looking_for: string | null
          next_trip: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          username: string
          // 🛠️ ADDED missing fields required by TravelBuddies component
          rating?: number | null
          trips?: number | null
          interests?: Json | null 
          bio?: string | null
          looking_for?: string | null
          next_trip?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          username?: string
          // 🛠️ ADDED missing fields required by TravelBuddies component
          rating?: number | null
          trips?: number | null
          interests?: Json | null 
          bio?: string | null
          looking_for?: string | null
          next_trip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      // 🛠️ ADDED 'TRAVEL_BUDDIES' TABLE DEFINITION
      travel_buddies: {
        Row: {
          id: string
          created_at: string
          user_id_1: string
          user_id_2: string
          status: 'pending' | 'accepted' | 'rejected' // Assuming a connection status
          last_activity_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id_1: string
          user_id_2: string
          status?: 'pending' | 'accepted' | 'rejected'
          last_activity_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id_1?: string
          user_id_2?: string
          status?: 'pending' | 'accepted' | 'rejected'
          last_activity_at?: string | null
        }
        Relationships: [
          // Assuming user_id_1 and user_id_2 link to the profiles table
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
      // END 'TRAVEL_BUDDIES' TABLE
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never