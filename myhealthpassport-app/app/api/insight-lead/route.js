// Forwards INSIGHT lead form submissions to Google Sheets via Apps Script webhook
export async function POST(req) {
  try {
    const data = await req.json();
    const { name, phone, method, age, plan, ts } = data;

    const webhookUrl = process.env.INSIGHT_LEADS_SHEET_URL ||
      'https://script.google.com/macros/s/AKfycbxjMiLLNqBtqld41NOeGSfHkgUceVrJ32M0QRt2J6LRyAgbPCunxlT9TDfIrA-01t-3/exec';

    if (webhookUrl) {
      const params = new URLSearchParams({
        Date: ts || new Date().toISOString(),
        Name: name || '',
        Phone: phone || '',
        Email: '',
        Interest: plan || '',
        Mode: method || '',
        Source: 'INSIGHT LP',
        Status: '',
      });
      await fetch(`${webhookUrl}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow',
      });
    }

    return new Response(JSON.stringify({ ok: true, webhook: !!webhookUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err?.message }), { status: 500 });
  }
}
