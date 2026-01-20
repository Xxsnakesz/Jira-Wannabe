import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ApiResponse, IncidentStatus, StatusChangeNotification } from '@/types/incident';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/incidents/[id]
 * Get a single incident by UUID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data });
  } catch (error) {
    console.error('Get incident error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/incidents/[id]
 * Update incident (mainly for status changes)
 * Also triggers n8n notification webhook when status changes
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus, ...otherUpdates } = body;

    // First, get the current incident to compare status
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentIncident) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const oldStatus = currentIncident.status as IncidentStatus;

    // Validate status if provided
    if (newStatus) {
      const validStatuses: IncidentStatus[] = ['New', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
    }

    // Update the incident
    console.log('Updating incident:', id, 'to status:', newStatus);
    
    const { data, error } = await supabase
      .from('incidents')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        ...otherUpdates 
      })
      .eq('id', id)
      .select()
      .single();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Send update to n8n webhook for Google Sheets sync
    // Use production URL (workflow must be ACTIVE in n8n)
    const n8nSheetsUrl = 'https://workflows.dhomanhuri.id/webhook/0e6b3591-dfea-4304-a351-660cca059c03';
    
    console.log('Calling n8n webhook:', n8nSheetsUrl);
    
    try {
      // Map to field names that n8n expects (based on n8n workflow config)
      const webhookPayload = {
        incident_id: data.incident_id,      // n8n uses $json.incident_id
        project_name: data.project_name,    // n8n uses $json.project_name
        status: data.status,                // n8n uses $json.status
        keterangan: data.description,       // n8n uses $json.keterangan
        tipe: data.incident_type,           // n8n uses $json.tipe
        impact: data.impact,                // n8n uses $json.impact
        waktu_kejadian: data.waktu_kejadian, // n8n uses $json.waktu_kejadian
        pic: data.pic,                      // n8n uses $json.pic (if needed)
        nomor_wa: data.phone_number,        // n8n uses $json.nomor_wa (if needed)
        waktu_chat: data.waktu_chat,        // n8n uses $json.waktu_chat (if needed)
      };
      
      console.log('Webhook payload:', JSON.stringify(webhookPayload));
      
      const webhookResponse = await fetch(n8nSheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      console.log('n8n webhook response status:', webhookResponse.status);
      const webhookResult = await webhookResponse.text();
      console.log('n8n webhook response:', webhookResult);
    } catch (webhookErr) {
      console.error('n8n webhook error:', webhookErr);
    }

    // If status changed, trigger n8n notification webhook
    if (newStatus && oldStatus !== newStatus && process.env.N8N_WEBHOOK_URL) {
      const notification: StatusChangeNotification = {
        incident_id: currentIncident.incident_id,
        phone_number: currentIncident.phone_number || '',
        old_status: oldStatus,
        new_status: newStatus,
        description: currentIncident.description || '',
      };

      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        });
        console.log(`Status change notification sent for ${currentIncident.incident_id}`);
      } catch (notifyError) {
        console.error('Failed to send n8n notification:', notifyError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
      message: `Incident ${currentIncident.incident_id} updated successfully`,
    });

  } catch (error) {
    console.error('Update incident error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/incidents/[id]
 * Delete an incident
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Incident deleted successfully',
    });

  } catch (error) {
    console.error('Delete incident error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete incident' },
      { status: 500 }
    );
  }
}
