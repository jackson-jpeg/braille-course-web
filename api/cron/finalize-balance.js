const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // Only allow Vercel Cron (or manual trigger with the secret)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const invoices = await stripe.invoices.list({
      status: 'draft',
      limit: 100,
    });

    const balanceInvoices = invoices.data.filter(
      (inv) =>
        inv.metadata.type === 'balance' &&
        inv.metadata.course === 'braille-summer-2025'
    );

    let finalized = 0;
    for (const invoice of balanceInvoices) {
      await stripe.invoices.finalizeInvoice(invoice.id);
      console.log(
        `Finalized invoice ${invoice.id} for customer ${invoice.customer}`
      );
      finalized++;
    }

    res.json({ ok: true, finalized });
  } catch (err) {
    console.error('Cron finalize-balance failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};
