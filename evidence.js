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
  return parsed;
}

export function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export const KNOWN_BRAND_DOMAINS = [
  'arcpad.xyz',
  'arcpad.io',
  'ethereum.org',
  'uniswap.org',
  'opensea.io',
  'binance.com',
  'coinbase.com',
  'metamask.io'
];

export function checkDomainHeuristics(hostname, knownBrands = KNOWN_BRAND_DOMAINS) {
  const flags = [];
  const cleanHost = String(hostname || '').toLowerCase().replace(/:\d+$/, '').trim();
  if (!cleanHost) return flags;

  // Extract base domain and labels
  const parts = cleanHost.split('.');
  const baseName = parts.length > 1 ? parts[parts.length - 2] : parts[0];

  // Hyphen pattern or suspicious subdomain pattern (e.g. arc-pad, brand-claim, sub.sub.sub)
  if (parts.length > 3) {
    flags.push('excessive-subdomain-depth');
  }

  for (const brand of knownBrands) {
    const brandParts = brand.toLowerCase().split('.');
    const brandBase = brandParts.length > 1 ? brandParts[brandParts.length - 2] : brandParts[0];

    // If exact brand domain match, no typosquatting flag
    if (cleanHost === brand || cleanHost.endsWith('.' + brand)) {
      continue;
    }

    // Check hyphen variations (e.g. arc-pad vs arcpad)
    const baseWithoutHyphens = baseName.replace(/-/g, '');
    if (baseName.includes('-') && (baseWithoutHyphens === brandBase || baseName.split('-').includes(brandBase))) {
      flags.push(`typosquat-hyphen-brand-mimic:${brand}`);
      continue;
    }

    // Check subdomain mimic (e.g. arcpad.phishing.com or brand in subdomain)
    if (parts.length > 2 && parts.slice(0, -2).includes(brandBase)) {
      flags.push(`subdomain-brand-mimic:${brand}`);
      continue;
    }

    // Check edit distance on base brand name (typosquatting e.g. arcpad vs arcpaad, arcpadd, or 1 edit)
    if (brandBase.length >= 4) {
      const dist = levenshteinDistance(baseName, brandBase);
      if (dist > 0 && dist <= 2 && Math.abs(baseName.length - brandBase.length) <= 2) {
        flags.push(`typosquat-edit-distance:${brand}`);
      }
    }
  }

  return flags;
}

export async function inspectUrl(value) {
  const parsed = await assertPublicHttpUrl(value);
  const response = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'SignalShield/0.1' } });
  if (response.status >= 300 && response.status < 400) throw new Error('Redirects require explicit verification');
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return extractEvidence(await response.text(), parsed.href);
}

