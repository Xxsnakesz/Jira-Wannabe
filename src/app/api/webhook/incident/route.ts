import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { N8NIncidentPayload, ApiResponse, IncidentInsert } from '@/types/incident';

// Use service role for API routes (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/webhook/incident
 * Webhook endpoint for n8n to create new incidents
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
 *   "waktu_chat": "2026-01-19T10:35:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook secret (uncomment if you want to secure the webhook)
    // const webhookSecret = request.headers.get('x-webhook-secret');
    // if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
    //   return NextResponse.json<ApiResponse>(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const payload: N8NIncidentPayload = await request.json();

    // Validate required fields
    if (!payload.incident_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'incident_id is required' },
        { status: 400 }
      );
    }

    // Map n8n payload to database schema
    const incidentData: IncidentInsert = {
      incident_id: payload.incident_id,
      description: payload.keterangan || '',
      incident_type: payload.tipe || 'Unknown',
      impact: payload.impact || 'Unknown',
      pic: payload.pic || 'Unassigned',
      phone_number: payload.nomor_wa || '',
      waktu_kejadian: payload.waktu_kejadian || new Date().toISOString(),
      waktu_chat: payload.waktu_chat || new Date().toISOString(),
      status: 'New',
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Handle duplicate incident_id
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Incident ID already exists' },
          { status: 409 }
        );
      }

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
