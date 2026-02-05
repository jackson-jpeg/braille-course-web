const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Env var validation
  if (!process.env.STRIPE_PRICE_BALANCE) {
    console.error('Missing STRIPE_PRICE_BALANCE env var');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (!session.customer || !session.payment_intent) {
      return res.json({ received: true });
    }

    try {
      // Retrieve the PaymentIntent to check metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );

      const paymentType = paymentIntent.metadata?.type;

      // Full payments: no invoice needed
      if (paymentType === 'full') {
        console.log(
          `Full payment completed for customer ${session.customer} — no invoice needed`
        );
        return res.json({ received: true });
      }

      // Deposit payments: save card + create draft $350 invoice
      // Set saved payment method as default for future invoice charges
      await stripe.customers.update(session.customer, {
        invoice_settings: {
          default_payment_method: paymentIntent.payment_method,
        },
      });

      // Create a $350 line item on the customer's next invoice
      await stripe.invoiceItems.create({
        customer: session.customer,
        price: process.env.STRIPE_PRICE_BALANCE,
      });

      // Create a draft invoice — stays draft until the May 1st cron finalizes it,
      // at which point Stripe auto-charges the saved card
      const invoice = await stripe.invoices.create({
        customer: session.customer,
        collection_method: 'charge_automatically',
        auto_advance: false,
        metadata: {
          course: 'braille-summer-2025',
          type: 'balance',
          scheduled_date: '2026-05-01',
        },
      });

      console.log(
        `Draft invoice ${invoice.id} created for customer ${session.customer}`
      );
    } catch (err) {
      // Deposit already collected — log for manual follow-up, don't fail the webhook
      console.error('Failed to create balance invoice:', err.message);
    }
  }

  res.json({ received: true });
}

module.exports = handler;

// Disable Vercel's default body parsing so we can verify the webhook signature
module.exports.config = {
  api: { bodyParser: false },
};
