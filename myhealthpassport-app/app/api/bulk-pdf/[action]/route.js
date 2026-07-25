import { cookies } from 'next/headers';

// Proxies the whole-school bulk PDF job endpoints. Kept separate from
// /api/export because this is a start → poll → download job, not a
// single streamed file.
const ACTIONS = {
  start: { method: 'POST', path: schoolId => `/report/school/${schoolId}/start-bulk-pdf` },
  status: { method: 'GET', path: schoolId => `/report/school/${schoolId}/bulk-pdf-status` },
  download: { method: 'GET', path: schoolId => `/report/school/${schoolId}/bulk-pdf-download` },
};

async function handle(req, action) {
  const spec = ACTIONS[action];
  if (!spec) {
    return Response.json({ error: 'Unknown action' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const access_token = cookieStore.get('access_token')?.value;
  if (!access_token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const incoming = new URL(req.url).searchParams;
  const schoolId = incoming.get('school_id');
  if (!schoolId) {
    return Response.json({ error: 'school_id is required' }, { status: 400 });
  }

  const qs = new URLSearchParams();
  for (const key of ['job_id', 'academic_year']) {
    const val = incoming.get(key);
    if (val && val !== 'null') qs.append(key, val);
  }

  const upstream = `${process.env.NEXT_PUBLIC_API_URL}${spec.path(schoolId)}?${qs.toString()}`;
  const init = {
    method: spec.method,
    headers: { Authorization: `Bearer ${access_token}` },
    cache: 'no-store',
  };
  if (spec.method === 'POST') {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify({});
  }

  const result = await fetch(upstream, init);

  // The finished job is a ZIP — stream it straight through.
  if (action === 'download' && result.ok) {
    return new Response(result.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="health_reports_school${schoolId}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const text = await result.text();
  return new Response(text, {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function GET(req, { params }) {
  const { action } = await params;
  return handle(req, action);
}

export async function POST(req, { params }) {
  const { action } = await params;
  return handle(req, action);
}
