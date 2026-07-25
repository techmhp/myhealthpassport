import { cookies } from 'next/headers';

// Whitelist of downloadable modules → backend endpoint paths.
// Keeps this route from being used as an open proxy.
const MODULE_ENDPOINTS = {
  'students-list': '/school/export-students',
  'nutrition-checklist': '/screening/export/nutrition-checklist',
  'nutrition-analysis': '/screening/export/nutrition-analysis',
  'psychology-checklist': '/screening/export/psychology-checklist',
  'psychology-analysis': '/screening/export/psychology-analysis',
  'smart-scale': '/screening/export/smart-scale',
  'dental-screening': '/screening/export/dental-screening',
  'vision-screening': '/screening/export/vision-screening',
};

export async function GET(req, { params }) {
  const { module } = await params;
  const endpoint = MODULE_ENDPOINTS[module];
  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Unknown export module' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cookieStore = await cookies();
  const access_token = cookieStore.get('access_token')?.value;
  if (!access_token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const incoming = new URL(req.url).searchParams;
  const params_out = new URLSearchParams();
  for (const key of ['school_id', 'class_name', 'section']) {
    const val = incoming.get(key);
    if (val) params_out.append(key, val);
  }

  const upstream = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?${params_out.toString()}`;
  const result = await fetch(upstream, {
    method: 'GET',
    headers: { Authorization: `Bearer ${access_token}` },
    cache: 'no-store',
  });

  if (!result.ok) {
    let message = `HTTP ${result.status}: Export failed`;
    try {
      const err = await result.json();
      message = err?.detail || err?.message || message;
    } catch {}
    return new Response(JSON.stringify({ error: message }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const schoolId = incoming.get('school_id') || 'export';
  const filename = `${module}_School${schoolId}.csv`;

  // Stream the CSV straight through — no base64, no server-action serialisation.
  return new Response(result.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
