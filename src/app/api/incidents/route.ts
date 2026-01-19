import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ApiResponse } from '@/types/incident';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/incidents
 * Get all incidents with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('incidents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by incident_id
    if (search) {
      query = query.ilike('incident_id', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        incidents: data,
        total: count,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Get incidents error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
