import http from 'node:http';
import { URL } from 'node:url';

const port = Number(process.env.PORT || 8787);
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SignalShield</title><style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:0 20px;background:#101014;color:#f5f5f5}textarea{width:100%;height:130px;background:#1d1d25;color:#fff;border:1px solid #555;padding:12px;box-sizing:border-box}button{margin-top:12px;padding:12px 18px;background:#e7ff4f;border:0;font-weight:700;cursor:pointer}.card{margin-top:20px;border:1px solid #444;padding:18px;background:#181820}.muted{color:#aaa}.pill{display:inline-block;padding:4px 8px;background:#332b16;color:#ffd35a}</style></head><body><h1>SignalShield</h1><p class="muted">Evidence-first checks before you trust a link.</p><textarea id="claim" placeholder="Paste a claim, project link, or financial opportunity..."></textarea><br><button onclick="inspect()">Inspect claim</button><div id="out"></div><script>async function inspect(){const claim=document.querySelector('#claim').value.trim();if(!claim)return;const r=await fetch('/api/inspect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({claim})});document.querySelector('#out').innerHTML='<div class="card"><span class="pill">'+(r.ok?'REVIEW':'ERROR')+'</span><pre>'+JSON.stringify(await r.json(),null,2)+'</pre></div>'}</script></body></html>`;

export function inspectClaim(claim) {
  const lower = claim.toLowerCase();
  const flags = [];
  if (/guaranteed|risk[- ]free|100%|instant profit|double your/i.test(claim)) flags.push('unrealistic-return-language');
  if (/connect wallet|seed phrase|private key|send crypto|deposit now/i.test(claim)) flags.push('high-risk-action-request');
  if (/https?:\/\//i.test(claim)) flags.push('external-link-needs-verification');
  return { verdict: flags.length ? 'REVIEW_BEFORE_ACTING' : 'INSUFFICIENT_EVIDENCE', flags, evidence: [], missing: ['independent primary source', 'custody/issuer verification', 'clear terms and redemption path'], next_steps: ['Do not share seed phrases or private keys', 'Verify claims against primary sources', 'Use a burner wallet for testing only'], input_preview: claim.slice(0, 240) };
}

const server = http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host}`);
  if(req.method==='GET' && u.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});return res.end(html);}
  if(req.method==='POST' && u.pathname==='/api/inspect'){
    let body=''; for await(const chunk of req) body+=chunk;
    try { const data=JSON.parse(body); if(typeof data.claim!=='string'||!data.claim.trim()) throw new Error('claim must be non-empty'); res.writeHead(200,{'content-type':'application/json'}); return res.end(JSON.stringify(inspectClaim(data.claim)));
    } catch(e){res.writeHead(400,{'content-type':'application/json'});return res.end(JSON.stringify({error:e.message}));}
  }
  res.writeHead(404);res.end('Not found');
});
if (process.argv[1] === new URL(import.meta.url).pathname) {
  server.listen(port,()=>console.log(`SignalShield listening on http://localhost:${port}`));
}

export { server };
