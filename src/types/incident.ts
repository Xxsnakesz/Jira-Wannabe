export type IncidentStatus = 'New' | 'In Progress' | 'Resolved' | 'Closed';

export interface Incident {
  id: string;
  incident_id: string;
  status: IncidentStatus;
  description: string | null;
  incident_type: string | null;
  impact: string | null;
  pic: string | null;
  phone_number: string | null;
  waktu_kejadian: string | null;
  waktu_chat: string | null;
  created_at: string;
  updated_at: string;
}

// Incoming payload from n8n webhook
export interface N8NIncidentPayload {
  incident_id: string;
  keterangan: string;
  tipe: string;
  impact: string;
  pic: string;
  nomor_wa: string;
  waktu_kejadian: string;
  waktu_chat?: string;
}

// Mapped payload for database insertion
export interface IncidentInsert {
  incident_id: string;
  description: string;
  incident_type: string;
  impact: string;
  pic: string;
  phone_number: string;
  waktu_kejadian: string;
  waktu_chat?: string;
  status?: IncidentStatus;
}

export interface IncidentUpdate {
  status?: IncidentStatus;
  description?: string;
  incident_type?: string;
  impact?: string;
  pic?: string;
}

export interface StatusChangeNotification {
  incident_id: string;
  phone_number: string;
  old_status: IncidentStatus;
  new_status: IncidentStatus;
  description: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
