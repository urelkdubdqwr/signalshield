import http from 'node:http';
import { URL } from 'node:url';
import { inspectUrl, buildEvidenceLedger, compareEvidence } from './evidence.js';
import { createReport, getReport, reportHtml } from './reports.js';

const port = Number(process.env.PORT || 8787);
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SignalShield</title>
<style>
:root{color-scheme:dark;--bg:#101014;--panel:#181820;--ink:#f5f5f5;--muted:#a7a7b2;--line:#454552;--acid:#e7ff4f;--red:#ff6b6b;--green:#9affb2}
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:40px 20px;background:var(--bg);color:var(--ink)}header{border-bottom:2px solid var(--acid);padding-bottom:24px;margin-bottom:24px}h1{font-size:clamp(2.4rem,8vw,5.5rem);line-height:.9;letter-spacing:-.08em;margin:0 0 14px;text-transform:uppercase}h2{margin-top:0}.eyebrow{color:var(--acid);font:700 12px monospace;letter-spacing:.12em}.lede{color:var(--muted);max-width:650px}.grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px}.panel{border:1px solid var(--line);background:var(--panel);padding:18px}label{display:block;font:700 12px monospace;text-transform:uppercase;margin-bottom:8px;color:var(--acid)}textarea{width:100%;min-height:150px;background:#0c0c10;color:var(--ink);border:1px solid var(--line);padding:14px;font:15px monospace;resize:vertical}button{min-height:46px;margin-top:12px;padding:0 18px;background:var(--acid);border:2px solid #000;color:#000;font-weight:800;cursor:pointer}button:focus,textarea:focus{outline:3px solid #fff;outline-offset:2px}.hint{font-size:13px;color:var(--muted);line-height:1.5}.status{margin-top:18px;padding:10px;border-left:4px solid var(--acid);background:#202028;font:13px monospace}.result{margin-top:22px}.verdict{display:inline-block;padding:6px 10px;border:1px solid var(--acid);color:var(--acid);font:800 12px monospace}.verdict.danger{border-color:var(--red);color:var(--red)}.verdict.ok{border-color:var(--green);color:var(--green)}.source{border-top:1px solid var(--line);padding:16px 0}.source h3{margin:0 0 5px;font-size:16px}.source a{color:var(--acid);overflow-wrap:anywhere}.source blockquote{margin:10px 0 0;padding:10px;border-left:3px solid var(--acid);color:#ddd}.source small{color:var(--muted);font-family:monospace}.missing{color:#ffd35a}.error{color:var(--red)}@media(max-width:720px){.grid{grid-template-columns:1fr}body{padding-top:24px}}
</style></head>
<body><header><div class="eyebrow">@ONARGUDEL / TRUST INFRASTRUCTURE</div><h1>SignalShield</h1><p class="lede">Before you trust the link, make it show its receipts. Compare public sources before acting on a financial, Web3, or online opportunity claim.</p></header>
<main class="grid"><section class="panel"><h2>Inspect a claim</h2><label for="claim">Claim or question</label><textarea id="claim" placeholder="Example: users can redeem rewards within 30 days"></textarea><label for="sources" style="margin-top:16px">Sources (one public URL per line)</label><textarea id="sources" placeholder="https://issuer.example/terms\nhttps://partner.example/faq"></textarea><button id="inspect">Run evidence check</button><div id="status" class="status" hidden></div><div id="result" class="result"></div></section><aside class="panel"><div class="eyebrow">HOW IT THINKS</div><p class="hint">1. Fetches up to five public sources.</p><p class="hint">2. Extracts readable text and relevant excerpts.</p><p class="hint">3. Separates corroborated, single-source, conflicting, and unsupported claims.</p><p class="hint">4. Never treats an empty evidence list as proof.</p></aside></main>
<script>
const $=s=>document.querySelector(s);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(data){const flags=(data.flags||[]).map(x=>'<li>'+esc(x)+'</li>').join('');const errors=(data.source_errors||[]).map(x=>'<li class="error">'+esc(x.url)+': '+esc(x.error)+'</li>').join('');const sources=(data.evidence?.sources||[]).map(s=>'<article class="source"><h3>'+esc(s.title)+'</h3><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.url)+'</a><small> · '+esc(s.quality)+'</small>'+(s.excerpt?'<blockquote>'+esc(s.excerpt)+'</blockquote>':'<p class="missing">No matching excerpt found.</p>')+'</article>').join('');const overall=data.comparison?.overall?'<p><b>Cross-source result:</b> '+esc(data.comparison.overall)+'</p>':'';$('#result').innerHTML='<span class="verdict '+(data.verdict==='REVIEW_BEFORE_ACTING'?'danger':'')+'">'+esc(data.verdict)+'</span>'+overall+(flags?'<h3>Risk signals</h3><ul>'+flags+'</ul>':'')+(sources?'<h3>Evidence receipts</h3>'+sources:'')+(errors?'<h3>Source errors</h3><ul>'+errors+'</ul>':'');}
$('#inspect').addEventListener('click',async()=>{const claim=$('#claim').value.trim();const sources=$('#sources').value.split(/\\n+/).map(x=>x.trim()).filter(Boolean);if(!claim){$('#status').hidden=false;$('#status').textContent='Enter a claim first.';return}$('#status').hidden=false;$('#status').textContent='Fetching receipts…';$('#result').innerHTML='';try{const r=await fetch('/api/inspect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({claim,sources})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Request failed');render(data);if(data.report_url){const link=location.origin+data.report_url+'?format=html';$('#status').innerHTML='Inspection complete. <a href="'+link+'" target="_blank" rel="noopener">Open shareable report</a>';return;}$('#status').textContent='Inspection complete. Read the receipts, ser.';}catch(e){$('#status').textContent='Inspection failed: '+e.message;}});
</script></body></html>`;

export function inspectClaim(claim) {
  const flags = [];
  if (/guaranteed|risk[- ]free|100%|instant profit|double your/i.test(claim)) flags.push('unrealistic-return-language');
  if (/connect wallet|seed phrase|private key|send crypto|deposit now/i.test(claim)) flags.push('high-risk-action-request');
  if (/https?:\/\//i.test(claim)) flags.push('external-link-needs-verification');
  return { verdict: flags.length ? 'REVIEW_BEFORE_ACTING' : 'INSUFFICIENT_EVIDENCE', flags, evidence: [], missing: ['independent primary source', 'custody/issuer verification', 'clear terms and redemption path'], next_steps: ['Do not share seed phrases or private keys', 'Verify claims against primary sources', 'Use a burner wallet for testing only'], input_preview: claim.slice(0, 240) };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && u.pathname === '/') { res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); return res.end(html); }
  if (req.method === 'GET' && u.pathname.startsWith('/report/')) {
    const report = getReport(u.pathname.slice('/report/'.length));
    if (!report) { res.writeHead(404, {'content-type':'application/json'}); return res.end(JSON.stringify({error:'report not found'})); }
    if (u.searchParams.get('format') === 'html') { res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); return res.end(reportHtml(report)); }
    res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(report));
  }
  if (req.method === 'POST' && u.pathname === '/api/inspect') {
    let body = ''; for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body);
      if (typeof data.claim !== 'string' || !data.claim.trim()) throw new Error('claim must be non-empty');
      const result = inspectClaim(data.claim.trim());
      const urls = Array.isArray(data.sources) ? data.sources : (/^https?:\/\//i.test(data.claim.trim()) ? [data.claim.trim()] : []);
      if (urls.length) {
        const fetched = [], errors = [];
        for (const sourceUrl of urls.slice(0, 5)) { try { fetched.push(await inspectUrl(sourceUrl)); } catch (error) { errors.push({url: sourceUrl, error: error.message}); } }
        if (fetched.length) { result.source = fetched[0]; result.evidence = buildEvidenceLedger(data.claim.trim(), fetched); result.comparison = fetched.length > 1 ? compareEvidence(data.claim.trim(), fetched) : null; }
        if (errors.length) result.source_errors = errors;
      }
      const reportId = createReport(result);
      result.report_id = reportId;
      result.report_url = `/report/${reportId}`;
      res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(result));
    } catch (e) { res.writeHead(400, {'content-type':'application/json'}); return res.end(JSON.stringify({error:e.message})); }
  }
  res.writeHead(404); res.end('Not found');
});

if (process.argv[1] === new URL(import.meta.url).pathname) server.listen(port, () => console.log(`SignalShield listening on http://localhost:${port}`));
export { server };
