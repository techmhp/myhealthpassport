// Forwards INSIGHT lead form submissions to Google Sheets via Apps Script webhook
export async function POST(req) {
  try {
    const data = await req.json();
    const { name, phone, method, age, plan, ts } = data;

    const webhookUrl = process.env.INSIGHT_LEADS_SHEET_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, method, age, plan, ts }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}
