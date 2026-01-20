import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { N8NIncidentPayload, ApiResponse, IncidentInsert, IncidentStatus } from '@/types/incident';

// Use service role for API routes (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to parse time/datetime to ISO string
const parseToTimestamp = (value: string | undefined): string => {
  if (!value) return new Date().toISOString();
  
  // If it's just time like "16:40", add today's date
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const today = new Date().toISOString().split('T')[0];
    return new Date(`${today}T${value}:00`).toISOString();
  }
  
  // If it's a valid date/datetime, parse it
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  
  // Fallback to current time
  return new Date().toISOString();
};

// Helper to map status from n8n to valid status
const mapStatus = (status: string | undefined): IncidentStatus => {
  const statusMap: Record<string, IncidentStatus> = {
    'new': 'New',
    'open': 'New',
    'in progress': 'In Progress',
    'inprogress': 'In Progress',
    'in-progress': 'In Progress',
    'progress': 'In Progress',
    'resolved': 'Resolved',
    'done': 'Resolved',
    'closed': 'Closed',
    'close': 'Closed',
  };
  
  if (!status) return 'New';
  const normalized = status.toLowerCase().trim();
  console.log('Mapping status:', status, '-> normalized:', normalized, '-> mapped:', statusMap[normalized] || status);
  return statusMap[normalized] || (status as IncidentStatus) || 'New';
};

/**
 * POST /api/webhook/incident
 * Webhook endpoint for n8n to create or update incidents
 * 
 * Expected payload from n8n:
 * {
 *   "incident_id": "INC-20260119-0001",
 *   "keterangan": "Description of the incident",
 *   "tipe": "Infrastructure",
 *   "impact": "High",
 *   "pic": "John Doe",
 *   "nomor_wa": "6281234567890",
 *   "waktu_kejadian": "2026-01-19T10:30:00Z",
 *   "waktu_chat": "2026-01-19T10:35:00Z",
 *   "status": "New" | "In Progress" | "Resolved" | "Closed"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook secret (disabled for now)
    // const webhookSecret = request.headers.get('x-webhook-secret');
    // if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
    //   return NextResponse.json<ApiResponse>(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const payload = await request.json() as N8NIncidentPayload & { status?: string };

    // Validate required fields
    if (!payload.incident_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'incident_id is required' },
        { status: 400 }
      );
    }

    // Check if incident already exists
    const { data: existingIncident } = await supabase
      .from('incidents')
      .select('id')
      .eq('incident_id', payload.incident_id)
      .single();

    // Map n8n payload to database schema
    const incidentData: IncidentInsert = {
      incident_id: payload.incident_id,
      project_name: payload.project_name || 'General',
      description: payload.keterangan || '',
      incident_type: payload.tipe || 'Unknown',
      impact: payload.impact || 'Unknown',
      pic: payload.pic || 'Unassigned',
      phone_number: payload.nomor_wa || '',
      waktu_kejadian: parseToTimestamp(payload.waktu_kejadian),
      waktu_chat: parseToTimestamp(payload.waktu_chat),
      status: mapStatus(payload.status),
    };

    console.log('Received payload:', JSON.stringify(payload));
    console.log('Mapped incidentData:', JSON.stringify(incidentData));
    console.log('Existing incident:', existingIncident ? 'YES - will UPDATE' : 'NO - will INSERT');

    if (existingIncident) {
      // UPDATE existing incident
      console.log('Updating incident:', payload.incident_id, 'with status:', incidentData.status);
      
      const { data, error } = await supabase
        .from('incidents')
        .update({
          project_name: incidentData.project_name,
          description: incidentData.description,
          incident_type: incidentData.incident_type,
          impact: incidentData.impact,
          pic: incidentData.pic,
          phone_number: incidentData.phone_number,
          waktu_kejadian: incidentData.waktu_kejadian,
          waktu_chat: incidentData.waktu_chat,
          status: incidentData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('incident_id', payload.incident_id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json<ApiResponse>(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      console.log('Update successful, returned data:', JSON.stringify(data));

      return NextResponse.json<ApiResponse>(
        { 
          success: true, 
          data, 
          message: `Incident ${payload.incident_id} updated successfully with status: ${incidentData.status}` 
        },
        { status: 200 }
      );
    } else {
      // INSERT new incident
      const { data, error } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json<ApiResponse>(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse>(
        { 
          success: true, 
          data, 
          message: `Incident ${payload.incident_id} created successfully` 
        },
        { status: 201 }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/webhook/incident
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: true,
    message: 'Incident webhook endpoint is active',
  });
}
