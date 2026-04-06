// app/api/download-pdf/route.js
// Proxies the binary PDF from the backend API so the browser can download it
// as a same-origin blob — avoids cross-origin <a download> issues and the
// payload-size limit that server actions impose on AWS Amplify Lambda.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BaseURL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const key = searchParams.get('key');
    const academicYear = searchParams.get('academicYear');

    if (!studentId || !key) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;

    if (!access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `${BaseURL}/report/${studentId}/download-selected?key=${key}&academic_year=${academicYear}&direct=true`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Backend returned an error — pass it along
      const errorBody = await response.text();
      return new NextResponse(errorBody, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="report_${studentId}.pdf"`;

    // Stream the PDF directly back to the browser
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error('[download-pdf] Error:', error);
    return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 });
  }
}
