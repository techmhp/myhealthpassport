import Razorpay from "razorpay";

export async function POST(req) {
    try {
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return new Response(
                JSON.stringify({ error: "Payment gateway not configured. Please contact support." }),
                { status: 500 }
            );
        }

        const { amount, currency } = await req.json();

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

        const options = {
            amount: amount * 100, // amount in paise
            currency: currency || "INR",
            receipt: `receipt_order_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        return new Response(JSON.stringify(order), { status: 200 });
    } catch (error) {
        const message = error?.message || error?.error?.description || JSON.stringify(error);
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
