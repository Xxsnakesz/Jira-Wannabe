export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      incidents: {
        Row: {
          id: string;
          incident_id: string;
          status: string;
          description: string | null;
          incident_type: string | null;
          impact: string | null;
          pic: string | null;
          phone_number: string | null;
          waktu_kejadian: string | null;
          waktu_chat: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          status?: string;
          description?: string | null;
          incident_type?: string | null;
          impact?: string | null;
          pic?: string | null;
          phone_number?: string | null;
          waktu_kejadian?: string | null;
          waktu_chat?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          status?: string;
          description?: string | null;
          incident_type?: string | null;
          impact?: string | null;
          pic?: string | null;
          phone_number?: string | null;
          waktu_kejadian?: string | null;
          waktu_chat?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      incident_status: 'New' | 'In Progress' | 'Resolved' | 'Closed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
