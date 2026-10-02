import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';

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

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

function termsFor(claim) {
  return claim.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length >= 4);
}

function sourceMatches(claim, source) {
  const terms = termsFor(claim);
  return sentences(source.text).filter(sentence => terms.some(term => sentence.toLowerCase().includes(term)));
}

export function buildEvidenceLedger(claim, sources) {
  return {
    claim,
    sources: sources.map((source, index) => {
      const excerpt = sourceMatches(claim, source)[0] || null;
      return { id: `source-${index + 1}`, title: source.title, url: source.url, excerpt, quality: excerpt ? 'sourced' : 'unmatched' };
    })
  };
}

export function compareEvidence(claim, sources) {
  const matches = sources.flatMap(source => sourceMatches(claim, source).map(excerpt => ({ ...source, excerpt })));
  const positive = matches.filter(item => !/\b(?:cannot|can't|not|non-refundable|no redemption|ineligible|prohibited)\b/i.test(item.excerpt));
  const negative = matches.filter(item => /\b(?:cannot|can't|not|non-refundable|no redemption|ineligible|prohibited)\b/i.test(item.excerpt));
  let overall = 'unsupported';
  if (positive.length && negative.length) overall = 'conflicting';
  else if (positive.length >= 2) overall = 'corroborated';
  else if (positive.length === 1) overall = 'single-source';
  return { claim, overall, claims: [{ claim, status: overall, source_count: new Set(matches.map(item => item.url)).size, excerpts: matches.map(item => ({ url: item.url, title: item.title, excerpt: item.excerpt })) }] };
}

async function assertPublicHttpUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https URLs are supported');
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('private network URLs are not allowed');
  return { parsed, address: addresses[0].address };
}

export async function inspectUrl(value) {
  // Pin the connection to the IP the safety check validated, so a DNS rebinding
  // attack can't swap the address between this check and the fetch (TOCTOU).
  // node:https with `servername` keeps TLS SNI + cert validation on the real
  // hostname while connecting to the pinned IP (global fetch would send the IP
  // as SNI and fail the handshake anyway).
  const { parsed, address } = await assertPublicHttpUrl(value);
  const body = await new Promise((resolve, reject) => {
    const req = (parsed.protocol === 'https:' ? https : http).request({
      host: address,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      servername: parsed.protocol === 'https:' ? parsed.hostname : undefined,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      headers: { host: parsed.host, 'user-agent': 'SignalShield/0.1' },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) { res.resume(); reject(new Error('Redirects require explicit verification')); return; }
      if (!(res.statusCode >= 200 && res.statusCode < 300)) { res.resume(); reject(new Error(`Source returned HTTP ${res.statusCode}`)); return; }
      let size = 0; const chunks = [];
      res.on('data', (c) => { size += c.length; if (size > 5_000_000) { req.destroy(); reject(new Error('Source response too large')); return; } chunks.push(c); });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Source request timed out')); });
    req.on('error', reject);
    req.end();
  });
  return extractEvidence(body, parsed.href);
}
