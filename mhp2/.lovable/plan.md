

# Razorpay Payment Integration for CSR Donations

## Overview
Integrate Razorpay payment gateway into the Impact Calculator so donors can directly pay their contribution amount. When a user enters/selects an amount, they can click a "Contribute Now" button to complete the payment via Razorpay checkout.

---

## What You Need First

Before I can implement this, you'll need:

1. **Enable Supabase/Cloud** - Required for securely storing API keys and creating backend functions
2. **Razorpay Account** - Sign up at [razorpay.com](https://razorpay.com) if you don't have one
3. **API Keys** from Razorpay Dashboard:
   - **Key ID** (public, starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (private, must be stored securely)

---

## How It Will Work

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  User enters    │────▶│  Click "Pay Now" │────▶│  Edge       │
│  ₹50,000        │     │  button          │     │  Function   │
└─────────────────┘     └──────────────────┘     │  creates    │
                                                  │  order      │
                                                  └──────┬──────┘
                                                         │
                        ┌──────────────────┐            │
                        │  Razorpay popup  │◀───────────┘
                        │  opens for       │
                        │  payment         │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Payment success │
                        │  confirmation    │
                        └──────────────────┘
```

---

## Implementation Steps

### Step 1: Enable Backend (Supabase Cloud)
- Connect Supabase to enable edge functions for secure server-side operations

### Step 2: Store Razorpay Secrets
- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as secrets

### Step 3: Create Edge Function
Create `supabase/functions/create-razorpay-order/index.ts`:
- Accepts donation amount from frontend
- Creates Razorpay order using their Orders API
- Returns `order_id` to frontend

### Step 4: Update Impact Calculator
Modify `src/components/csr/ImpactCalculator.tsx`:
- Add "Contribute Now" / "Pay Now" button
- Load Razorpay checkout script
- On button click:
  1. Call edge function to create order
  2. Open Razorpay checkout popup with order details
  3. Handle success/failure responses
- Add loading states and error handling
- Show success toast on payment completion

### Step 5: (Optional) Payment Verification
Create verification edge function to validate payment signature for added security

---

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/create-razorpay-order/index.ts` | Backend function to create Razorpay order |
| `supabase/config.toml` | Edge function configuration |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/csr/ImpactCalculator.tsx` | Add payment button, Razorpay integration logic |
| `index.html` | Add Razorpay checkout script |

### Secrets Required
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret

---

## User Experience

1. User enters contribution amount (e.g., ₹50,000)
2. Calculator shows "125 Children" impact
3. User clicks **"Contribute Now"** button
4. Razorpay payment popup opens with pre-filled amount
5. User completes payment (card/UPI/netbanking)
6. Success message shown with payment confirmation

---

## Next Steps

To proceed, please:
1. **Connect to Supabase Cloud** if not already connected (I'll prompt you)
2. **Share your Razorpay Key ID and Key Secret** (I'll securely store them)

Would you like me to proceed with enabling Supabase and collecting the Razorpay API keys?

