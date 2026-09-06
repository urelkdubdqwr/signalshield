import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return net.isIPv6(address) && (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:'));
}

export function extractEvidence(html, url) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || new URL(url).hostname)
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
  return { title, url, text: text.slice(0, 12000) };
}

async function assertPublicHttpUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https URLs are supported');
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('private network URLs are not allowed');
  return parsed;
}

export async function inspectUrl(value) {
  const parsed = await assertPublicHttpUrl(value);
  const response = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'SignalShield/0.1' } });
  if (response.status >= 300 && response.status < 400) throw new Error('Redirects require explicit verification');
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return extractEvidence(await response.text(), parsed.href);
}
