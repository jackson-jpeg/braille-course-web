const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const plan = req.query.plan || 'deposit';

  if (plan !== 'deposit' && plan !== 'full') {
    return res.status(400).json({ error: 'Invalid plan. Use ?plan=deposit or ?plan=full' });
  }

  // Env var validation
  if (plan === 'deposit' && !process.env.STRIPE_PRICE_DEPOSIT) {
    console.error('Missing STRIPE_PRICE_DEPOSIT env var');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (plan === 'full' && !process.env.STRIPE_PRICE_FULL) {
    console.error('Missing STRIPE_PRICE_FULL env var');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const sessionParams = {
      mode: 'payment',
      customer_creation: 'always',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan === 'deposit'
            ? process.env.STRIPE_PRICE_DEPOSIT
            : process.env.STRIPE_PRICE_FULL,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          course: 'braille-summer-2025',
          type: plan,
        },
      },
      success_url: `${process.env.SITE_URL}/success.html?plan=${plan}`,
      cancel_url: process.env.SITE_URL,
    };

    // Deposit: save card for future $350 charge, show balance reminder
    if (plan === 'deposit') {
      sessionParams.payment_intent_data.setup_future_usage = 'off_session';
      sessionParams.custom_text = {
        submit: {
          message:
            'Your card will be saved securely. The remaining $350 balance will be charged automatically on May 1st.',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.redirect(303, session.url);
  } catch (err) {
    console.error('Checkout session creation failed:', err.message);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
};
