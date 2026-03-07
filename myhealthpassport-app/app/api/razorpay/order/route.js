import Razorpay from "razorpay";

export async function POST(req) {
    try {
        const { amount, currency } = await req.json();

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // amount in paise
            currency: currency || "INR",
            receipt: `receipt_order_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        return new Response(JSON.stringify(order), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
