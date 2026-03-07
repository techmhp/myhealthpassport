import crypto from "crypto";
import Razorpay from "razorpay";

export async function POST(req) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            await req.json();

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            return new Response(JSON.stringify({ success: false, message: "Invalid signature" }), {
                status: 400,
            });
        }

        // ✅ Fetch full payment details from Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
        });

        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        return new Response(JSON.stringify({ success: true, payment }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
        });
    }
}
