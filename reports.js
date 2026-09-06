import crypto from 'node:crypto';

const reports = new Map();
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createReport(report) {
  const id = crypto.createHash('sha256').update(`${Date.now()}:${JSON.stringify(report)}`).digest('hex').slice(0, 12);
  reports.set(id, report);
  return id;
}

export function getReport(id) {
  return reports.get(id) || null;
}

export function reportHtml(report) {
  const sources = report.evidence?.sources || [];
  const cards = sources.map(source => `<article class="source"><h2>${esc(source.title)}</h2><a href="${esc(source.url)}">${esc(source.url)}</a><p class="quality">${esc(source.quality)}</p>${source.excerpt ? `<blockquote>${esc(source.excerpt)}</blockquote>` : '<p class="missing">No matching excerpt found.</p>'}</article>`).join('');
  const flags = (report.flags || []).map(flag => `<li>${esc(flag)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SignalShield report</title><style>:root{color-scheme:dark}body{font-family:system-ui,sans-serif;max-width:820px;margin:0 auto;padding:32px 20px;background:#101014;color:#f5f5f5}header{border-bottom:2px solid #e7ff4f;padding-bottom:18px}h1{font-size:clamp(2rem,7vw,4.5rem);letter-spacing:-.07em;text-transform:uppercase;margin:6px 0}.eyebrow{font:700 12px monospace;color:#e7ff4f}.source{border-top:1px solid #454552;padding:18px 0}.source a{color:#e7ff4f;overflow-wrap:anywhere}.quality{color:#a7a7b2;font:12px monospace}blockquote{border-left:3px solid #e7ff4f;padding:10px;margin-left:0;color:#ddd}.missing{color:#ffd35a}.verdict{display:inline-block;padding:7px 10px;border:1px solid #ff6b6b;color:#ff6b6b;font:700 12px monospace}</style></head><body><header><div class="eyebrow">@ONARGUDEL / SIGNALSHIELD RECEIPT</div><h1>Trust report</h1><p>${esc(report.claim)}</p><span class="verdict">${esc(report.verdict)}</span></header>${flags ? `<h2>Risk signals</h2><ul>${flags}</ul>` : ''}<h2>Evidence receipts</h2>${cards || '<p class="missing">No sources were submitted.</p>'}</body></html>`;
}
