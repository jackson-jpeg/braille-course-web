import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* GET /api/admin/payments/coupons — list coupons with promo codes */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const coupons = await stripe.coupons.list({ limit: 50 });

    const couponsWithPromos = await Promise.all(
      coupons.data.map(async (c) => {
        const promos = await stripe.promotionCodes.list({ coupon: c.id, limit: 10 });
        return {
          id: c.id,
          name: c.name,
          percent_off: c.percent_off,
          amount_off: c.amount_off,
          currency: c.currency,
          duration: c.duration,
          max_redemptions: c.max_redemptions,
          times_redeemed: c.times_redeemed,
          valid: c.valid,
          created: c.created,
          redeem_by: c.redeem_by,
          promotion_codes: promos.data.map((p) => ({
            id: p.id,
            code: p.code,
            active: p.active,
            max_redemptions: p.max_redemptions,
            times_redeemed: p.times_redeemed,
            expires_at: p.expires_at,
          })),
        };
      }),
    );

    return NextResponse.json({ coupons: couponsWithPromos });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

/* POST /api/admin/payments/coupons — create coupon + optional promo code */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, percent_off, amount_off, duration, promoCode } = await req.json();

    const couponData: Record<string, unknown> = { duration: duration || 'once' };
    if (name) couponData.name = name;
    if (percent_off) couponData.percent_off = percent_off;
    else if (amount_off) {
      couponData.amount_off = Math.round(amount_off * 100);
      couponData.currency = 'usd';
    }

    const coupon = await stripe.coupons.create(couponData as Parameters<typeof stripe.coupons.create>[0]);

    let promo = null;
    if (promoCode) {
      promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: promoCode,
      });
    }

    return NextResponse.json({ coupon, promotionCode: promo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
