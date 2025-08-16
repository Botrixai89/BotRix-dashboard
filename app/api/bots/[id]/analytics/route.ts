import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Bot from '@/models/Bot';
import { requireAuth } from '@/lib/auth';
import { getBotAnalytics, exportAnalyticsData } from '@/lib/analytics';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'custom' || 'week';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';

    // Parse dates if provided
    let start: Date | undefined, end: Date | undefined;
    if (startDate) start = parseISO(startDate);
    if (endDate) end = parseISO(endDate);

    // Get analytics data
    const analytics = await getBotAnalytics(params.id, period, start, end);

    // If export is requested
    if (format === 'csv') {
      const csvData = await exportAnalyticsData(params.id, 'csv', period, start, end);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bot-analytics-${params.id}-${period}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      analytics,
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { action, format, period, startDate, endDate } = body;

    if (action === 'export') {
      // Parse dates if provided
      let start: Date | undefined, end: Date | undefined;
      if (startDate) start = parseISO(startDate);
      if (endDate) end = parseISO(endDate);

      const exportData = await exportAnalyticsData(params.id, format || 'csv', period || 'month', start, end);
      
      if (format === 'csv') {
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bot-analytics-${params.id}-${period || 'month'}.csv"`,
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        data: exportData,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing analytics request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 