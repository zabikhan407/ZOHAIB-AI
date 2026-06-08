// api/chat.js
const API_BASE = 'https://claude-gpt-by-noneusr.onrender.com/api/ai';
const TOKEN = 'IKYqTOX-i6G7hAfrPiZMb-FmhwNxc4K8'; // aapka token

// Models list from your screenshot
const MODELS = [
  { id: 'claude-opus-4.7', name: 'Claude Opus 4.7' },
  { id: 'claude-opus-4.6', name: 'Claude Opus 4.6' },
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'gpt-5', name: 'GPT-5' },
  { id: 'gpt-5-online', name: 'GPT-5 Online' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, model = 'claude-opus-4.7' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    // Xero API expects GET request with message in URL
    const encodedMsg = encodeURIComponent(message);
    const apiUrl = `${API_BASE}/${model}/message/${encodedMsg}?token=${TOKEN}`;
    const response = await fetch(apiUrl, { method: 'GET' });
    const reply = await response.text();
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Also provide endpoint to get models list
export async function getModels(req, res) {
  res.status(200).json({ models: MODELS });
  }
