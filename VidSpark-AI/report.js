/**
 * EchoRank AI — report.js
 * Logique commune à toutes les pages de rapport.
 * Lit les données vidéo depuis chrome.storage, appelle le proxy IA,
 * expose les helpers de rendu.
 */

const PROXY_URL = "https://echorank-proxy.VOTRE_SUBDOMAIN.workers.dev";

/* ── Lire les données passées via storage ── */
async function getReportData() {
  return new Promise(resolve => {
    chrome.storage.local.get(["echoReportData", "userToken", "echoLanguage"], r => {
      resolve({
        data: r.echoReportData || null,
        token: r.userToken || "free_demo_token",
        language: r.echoLanguage || "fr"
      });
    });
  });
}

/* ── Appel proxy IA ── */
async function callProxy(action, data, language, token) {
  const response = await fetch(PROXY_URL + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      action,
      videoId: data.videoId,
      title: data.title,
      description: data.description,
      language
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ── Copy to clipboard ── */
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "✓ Copié !";
    setTimeout(() => btn.textContent = orig, 1800);
  });
}

/* ── Score color ── */
function scoreColor(n) {
  return n >= 80 ? "#22c55e" : n >= 60 ? "#eab308" : "#ef4444";
}

/* ── Score badge class ── */
function scoreBadge(n) {
  return n >= 80 ? "badge-green" : n >= 60 ? "badge-amber" : "badge-red";
}

/* ── Build progress row ── */
function progressRow(label, value, max, color) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return `
    <div class="progress-row">
      <span class="progress-label">${label}</span>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color || '#7c6dfa'}"></div></div>
      <span class="progress-val" style="color:${color || '#7c6dfa'}">${value}</span>
    </div>`;
}

/* ── Loading state HTML ── */
function loadingHTML(msg) {
  return `<div class="loading-state"><div class="spinner"></div><div class="loading-text">${msg || "Analyse IA en cours…"}</div></div>`;
}

/* ── Error HTML ── */
function errorHTML(msg) {
  return `<div class="loading-state"><div style="font-size:32px">⚠</div><div class="loading-text" style="color:#ef4444">${msg}</div><div style="font-size:12px;color:#666;margin-top:8px">Vérifiez que le proxy Cloudflare est déployé.</div></div>`;
}

/* ── Format number ── */
function fmtNum(n) {
  if (!n) return "—";
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return (n/1000).toFixed(0) + "k";
  return String(n);
}

/* ── Escape HTML ── */
function esc(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── Build video bar ── */
function buildVideoBar(data) {
  return `
    <div class="video-bar">
      <img src="https://i.ytimg.com/vi/${esc(data.videoId)}/hqdefault.jpg" alt="">
      <div class="vinfo">
        <div class="vtitle">${esc(data.title)}</div>
        <div class="vstats">
          <span>👁 ${esc(data.views)}</span>
          <span>📝 ${data.descLength || 0} car.</span>
          <span>🔤 ${(data.title||"").length} car. titre</span>
        </div>
      </div>
    </div>`;
}
