// api/chat.js
const XERO_BASE = 'https://claude-gpt-by-noneusr.onrender.com/api/ai';
const TOKEN = 'IKYqTOX-i6G7hAfrPiZMb-FmhwNxc4K8'; // Aapka token

const MODELS = [
  { id: 'claude-opus-4.7', name: 'Claude Opus 4.7' },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6' },
  { id: 'gpt-5', name: 'GPT-5' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, model = 'claude-opus-4.7' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Try Xero API first
  try {
    const xeroUrl = `${XERO_BASE}/${model}/message/${encodeURIComponent(message)}?token=${TOKEN}`;
    const xeroRes = await fetch(xeroUrl, { method: 'GET', timeout: 15000 });
    if (xeroRes.ok) {
      const reply = await xeroRes.text();
      return res.status(200).json({ reply });
    }
  } catch (e) {
    console.log('Xero failed:', e.message);
  }

  // Fallback: OpenRouter free tier (requires no key for some models? No, but we can use a public demo)
  // Better: Use a free API like https://api.anyslack.com (but that's unstable)
  // For now, return a friendly error
  res.status(200).json({ reply: "⚠️ Xero AI API temporarily unavailable. Try again later or check your token." });
}

// Endpoint to get models list
export async function getModels(req, res) {
  res.status(200).json({ models: MODELS });
}
