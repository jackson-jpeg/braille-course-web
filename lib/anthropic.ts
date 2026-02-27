import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Backward-compatible lazy export — defers env check to first use
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    return (getAnthropicClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
