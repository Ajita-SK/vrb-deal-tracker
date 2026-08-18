/* ============================================================
   VRB Capital — shared shell, auth gate and helpers
   Loaded by every page. No build step; plain browser JS.

   Security note: the anon key below is public by design and is
   safe to ship. Nothing is readable with it alone — every table
   requires a signed-in user whose email is on am.allowed_users.
   ============================================================ */

const VRB_URL = "https://fcbipuwbsdihnxkhzjva.supabase.co";
const VRB_KEY = window.VRB_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYmlwdXdic2RpaG54a2h6anZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjAzNDAsImV4cCI6MjA5MjIzNjM0MH0.zp61OxzKX0AcAuWVCrEqkwx9-iwWntQyvF5aK7rSkVs";

let sb = null;
let vrbUser = null;

/* ---------- styles: matched to the existing deal tracker ---------- */
const VRB_CSS = `
:root{
  --navy:#1B3A6B; --navy-dark:#16305A; --navy-line:#2A4E88;
  --page:#EEF2F7; --card:#FFFFFF; --line:#DDE4ED;
  --ink:#1F2937; --ink-2:#5B6B7F; --ink-3:#8A97A8;
  --green:#0E7C4A; --green-bg:#DCF5E7;
  --amber:#8A6100; --amber-bg:#FDF0CE;
  --red:#B3261E; --red-bg:#FBE3E1;
  --blue:#1D4ED8; --blue-bg:#DCE7FB;
  --purple:#5B3FA8; --purple-bg:#E9E2FA;
  --gray-bg:#EDF1F6;
}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased}
.num,.mono{font-variant-numeric:tabular-nums;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
td.num,th.num{text-align:right}
.dim{color:var(--ink-3)}

/* header */
.vrb-top{background:var(--navy);color:#fff;padding:14px 26px;
  display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.vrb-logo{font-size:22px;font-weight:800;letter-spacing:-.02em}
.vrb-switch{display:flex;gap:4px;background:rgba(255,255,255,.10);
  padding:3px;border-radius:8px}
.vrb-switch a{padding:6px 14px;border-radius:6px;color:rgba(255,255,255,.72);
  text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap}
.vrb-switch a.on{background:#fff;color:var(--navy)}
.vrb-switch a:hover:not(.on){color:#fff;background:rgba(255,255,255,.08)}
.vrb-top-right{margin-left:auto;display:flex;align-items:center;gap:12px;font-size:13px}
.vrb-live{background:var(--green);color:#fff;padding:4px 12px;border-radius:999px;
  font-size:12px;font-weight:700}
.vrb-live.off{background:#8A97A8}
.vrb-who{color:rgba(255,255,255,.8)}
.vrb-signout{background:none;border:1px solid rgba(255,255,255,.35);color:#fff;
  padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.vrb-signout:hover{background:rgba(255,255,255,.12)}

/* tab strip */
.vrb-tabs{background:var(--navy);padding:0 26px;display:flex;gap:4px;
  overflow-x:auto;border-bottom:3px solid var(--navy-line)}
.vrb-tabs a{padding:11px 18px;border-radius:8px 8px 0 0;color:rgba(255,255,255,.75);
  text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap}
.vrb-tabs a.on{background:var(--page);color:var(--navy)}
.vrb-tabs a:hover:not(.on){background:rgba(255,255,255,.08);color:#fff}
.vrb-tabs .cnt{display:inline-block;margin-left:7px;padding:1px 8px;border-radius:999px;
  background:rgba(255,255,255,.18);font-size:12px}
.vrb-tabs a.on .cnt{background:var(--gray-bg);color:var(--navy)}

.vrb-wrap{padding:22px 26px 60px;max-width:1600px;margin:0 auto}
h1.vrb-h1{margin:0 0 4px;font-size:26px;font-weight:800;letter-spacing:-.02em}
.vrb-sub{color:var(--ink-2);font-size:13px;margin:0 0 18px}

/* kpi cards */
.vrb-kpis{display:grid;gap:14px;margin-bottom:20px;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.vrb-kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px}
.vrb-kpi .k{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-2);margin-bottom:6px}
.vrb-kpi .v{font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1.1;
  font-variant-numeric:tabular-nums}
.vrb-kpi .s{font-size:12px;color:var(--ink-3);margin-top:3px}
.vrb-kpi.warn .v{color:var(--amber)}
.vrb-kpi.bad .v{color:var(--red)}
.vrb-kpi.good .v{color:var(--green)}
.vrb-neg{color:var(--red)}
.vrb-bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.vrb-bars li{display:grid;grid-template-columns:64px 1fr 90px;gap:10px;align-items:center}
.vrb-bar-label{font-size:11px;color:var(--ink-2)}
.vrb-bar-track{background:var(--gray-bg);border-radius:4px;height:16px;overflow:visible;display:block}
.vrb-bar-fill{display:block;height:100%;background:var(--navy);border-radius:4px}
.vrb-bar-value{font-size:12px;text-align:right}

/* cards + tables */
.vrb-card{background:var(--card);border:1px solid var(--line);border-radius:10px;
  overflow:hidden;margin-bottom:20px}
.vrb-card-h{display:flex;align-items:center;gap:12px;padding:14px 18px;
  border-bottom:1px solid var(--line);flex-wrap:wrap}
.vrb-card-h h2{margin:0;font-size:16px;font-weight:700}
.vrb-card-h .meta{margin-left:auto;font-size:12px;color:var(--ink-2)}
.vrb-card-b{padding:16px 18px}
table.vrb-t{width:100%;border-collapse:collapse}
table.vrb-t thead th{background:var(--navy);color:#fff;font-size:12px;font-weight:700;
  text-align:left;padding:11px 14px;white-space:nowrap;position:sticky;top:0}
table.vrb-t thead th.sortable{cursor:pointer;user-select:none}
table.vrb-t thead th.sortable:hover{background:var(--navy-dark)}
table.vrb-t tbody td{padding:11px 14px;border-bottom:1px solid var(--line);font-size:13px}
table.vrb-t tbody tr:nth-child(even){background:#F8FAFC}
table.vrb-t tbody tr.click{cursor:pointer}
table.vrb-t tbody tr.click:hover{background:#EAF1FA}
table.vrb-t tbody tr.flag{background:#FFFBF0}
.scrollx{overflow-x:auto}

/* pills */
.pill{display:inline-block;padding:3px 11px;border-radius:999px;font-size:12px;
  font-weight:700;white-space:nowrap}
.pill.green{background:var(--green-bg);color:var(--green)}
.pill.amber{background:var(--amber-bg);color:var(--amber)}
.pill.red{background:var(--red-bg);color:var(--red)}
.pill.blue{background:var(--blue-bg);color:var(--blue)}
.pill.purple{background:var(--purple-bg);color:var(--purple)}
.pill.gray{background:var(--gray-bg);color:var(--ink-2)}

/* filters */
.vrb-filters{background:var(--card);border:1px solid var(--line);border-radius:10px;
  padding:14px 18px;margin-bottom:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.vrb-filters label{font-size:13px;font-weight:700;color:var(--ink-2)}
.vrb-filters input[type=text],.vrb-filters select,.vrb-in{
  padding:8px 11px;border:1px solid var(--line);border-radius:7px;font-size:13px;
  background:#fff;color:var(--ink);font-family:inherit}
.vrb-filters input[type=text]{min-width:230px}
.vrb-filters input:focus,.vrb-filters select:focus,.vrb-in:focus{
  outline:2px solid var(--blue);outline-offset:-1px}

/* buttons */
.btn{padding:8px 15px;border-radius:7px;border:1px solid var(--navy);background:var(--navy);
  color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.btn:hover{background:var(--navy-dark)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.ghost{background:#fff;color:var(--navy)}
.btn.ghost:hover{background:var(--gray-bg)}
.btn.danger{background:var(--red);border-color:var(--red)}
.btn.sm{padding:4px 10px;font-size:12px}

/* alerts */
.alert{border:1px solid var(--amber);border-left-width:4px;background:#FFFBF0;
  border-radius:8px;padding:13px 16px;margin-bottom:18px;font-size:13px}
.alert.bad{border-color:var(--red);background:#FEF4F3}
.alert b{display:block;margin-bottom:4px}
.alert ul{margin:6px 0 0;padding-left:18px}
.empty{padding:34px 18px;text-align:center;color:var(--ink-3);font-size:13px}
.note{font-size:12px;color:var(--ink-3);margin:12px 0 0;line-height:1.55}

/* login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:var(--navy);padding:20px}
.login-card{background:#fff;border-radius:14px;padding:36px;width:100%;max-width:400px}
.login-card h1{margin:0 0 4px;font-size:26px;font-weight:800;color:var(--navy)}
.login-card p.s{margin:0 0 22px;color:var(--ink-2);font-size:13px}
.login-card label{display:block;font-size:12px;font-weight:700;color:var(--ink-2);
  margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
.login-card input{width:100%;padding:11px 13px;border:1px solid var(--line);
  border-radius:8px;font-size:14px;margin-bottom:14px;font-family:inherit}
.login-card .btn{width:100%;padding:12px}
.login-msg{margin-top:14px;font-size:13px;padding:11px 13px;border-radius:8px}
.login-msg.err{background:var(--red-bg);color:var(--red)}
.login-msg.ok{background:var(--green-bg);color:var(--green)}
.boot{padding:60px;text-align:center;color:var(--ink-3);font-size:14px}
@media(max-width:700px){
  .vrb-top,.vrb-tabs{padding-left:14px;padding-right:14px}
  .vrb-wrap{padding:16px 14px 50px}
  h1.vrb-h1{font-size:21px}
}
`;

/* ---------- formatting ---------- */
const fmtUSD = (n, dp = 0) =>
  n == null || n === "" || isNaN(n) ? "—" :
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD",
    minimumFractionDigits: dp, maximumFractionDigits: dp });
const fmtCompact = (n) => {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (Math.abs(v) >= 1e3) return "$" + Math.round(v / 1e3) + "K";
  return "$" + Math.round(v);
};
const fmtPct = (n, dp = 1) =>
  n == null || isNaN(n) ? "—" : (Number(n) * 100).toFixed(dp) + "%";
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  return isNaN(dt) ? d : dt.toLocaleDateString("en-US",
    { month: "short", day: "numeric", year: "numeric" });
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- domain labels ---------- */
const STATUS_META = {
  current:{l:"Current",c:"green"}, dq_30:{l:"30 days",c:"amber"},
  dq_60:{l:"60 days",c:"amber"}, dq_90_plus:{l:"90+ days",c:"red"},
  forbearance:{l:"Forbearance",c:"blue"}, modification:{l:"Modified",c:"blue"},
  payment_plan:{l:"Payment plan",c:"blue"}, bankruptcy:{l:"Bankruptcy",c:"red"},
  demand_sent:{l:"Demand sent",c:"red"}, pre_fc_referred:{l:"Referred to counsel",c:"red"},
  fc_filed:{l:"Foreclosure filed",c:"red"}, sale_scheduled:{l:"Sale scheduled",c:"red"},
  sale_held:{l:"Sale held",c:"red"}, redemption_period:{l:"Redemption",c:"red"},
  reo_held:{l:"REO held",c:"purple"}, reo_listed:{l:"REO listed",c:"purple"},
  reo_under_contract:{l:"Under contract",c:"purple"},
  paid_off:{l:"Paid off",c:"gray"}, reinstated:{l:"Reinstated",c:"gray"},
  note_sold:{l:"Note sold",c:"gray"}, reo_sold:{l:"REO sold",c:"gray"},
  dil_completed:{l:"DIL closed",c:"gray"}, charged_off:{l:"Charged off",c:"gray"},
};
const CLASS_META = {
  performing:{l:"Performing",c:"green",hex:"#0E7C4A"},
  non_performing:{l:"Non-performing",c:"amber",hex:"#C77700"},
  reo:{l:"REO",c:"purple",hex:"#5B3FA8"},
  resolved:{l:"Resolved",c:"gray",hex:"#8A97A8"},
};
const ASSET_META = {
  residential_1_4:{l:"Residential",e:"🏠"}, multifamily:{l:"Multifamily",e:"🏢"},
  hotel:{l:"Hotel",e:"🏨"}, commercial_other:{l:"Commercial",e:"🏬"}, land:{l:"Land",e:"🌾"},
};
const CATEGORY_LABEL = {
  property_tax:"Property tax", insurance:"Insurance",
  force_placed_insurance:"Insurance — force placed", hoa:"HOA", utilities:"Utilities",
  legal_foreclosure:"Legal — foreclosure", legal_bankruptcy:"Legal — bankruptcy",
  legal_eviction:"Legal — eviction", legal_other:"Legal — other",
  servicing_fee:"Servicing fee", bpo_valuation:"Valuation / BPO", inspection:"Inspection",
  property_preservation:"Preservation", repairs:"Repairs", receiver:"Receiver",
  title:"Title", recording:"Recording", marketing_brokerage:"Marketing / brokerage",
  closing_costs:"Closing costs", due_diligence:"Due diligence",
  asset_management:"Asset management", travel:"Travel", other:"Other",
};
const RECOVERY_LABEL = {
  undetermined:"Undetermined", recoverable_advance:"Recoverable advance",
  non_recoverable:"Non-recoverable", recovered:"Recovered", written_off:"Written off",
};
const statusPill = (s) => {
  const m = STATUS_META[s] || { l: s || "—", c: "gray" };
  return `<span class="pill ${m.c}">${esc(m.l)}</span>`;
};

/* ---------- auth ---------- */
function loginScreen(msg, isErr) {
  document.body.innerHTML = `
    <div class="login-wrap"><div class="login-card">
      <h1>VRB Capital</h1>
      <p class="s">Deal Tracker &amp; Asset Management</p>
      <form id="lf">
        <label for="em">Email</label>
        <input id="em" type="email" autocomplete="username" required
               placeholder="you@vrbcap.com">
        <label for="pw">Password</label>
        <input id="pw" type="password" autocomplete="current-password" required>
        <button class="btn" type="submit" id="lb">Sign in</button>
      </form>
      <div id="lm" class="login-msg ${isErr ? "err" : "ok"}"
           style="${msg ? "" : "display:none"}">${esc(msg || "")}</div>
    </div></div>`;
  document.getElementById("lf").onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById("lb");
    const box = document.getElementById("lm");
    btn.disabled = true; btn.textContent = "Signing in…";
    const { error } = await sb.auth.signInWithPassword({
      email: document.getElementById("em").value.trim(),
      password: document.getElementById("pw").value,
    });
    if (error) {
      box.style.display = ""; box.className = "login-msg err";
      box.textContent = error.message.includes("Invalid")
        ? "That email and password combination was not recognised."
        : error.message;
      btn.disabled = false; btn.textContent = "Sign in";
    } else {
      location.reload();
    }
  };
}

async function vrbBoot(activeSection, activeTab, render) {
  const style = document.createElement("style");
  style.textContent = VRB_CSS;
  document.head.appendChild(style);
  document.body.innerHTML = '<div class="boot">Connecting…</div>';

  for (let i = 0; i < 40 && !window.supabase; i++)
    await new Promise((r) => setTimeout(r, 150));
  if (!window.supabase) {
    document.body.innerHTML =
      '<div class="boot">Could not load the Supabase library. Check your connection and reload.</div>';
    return;
  }
  sb = window.supabase.createClient(VRB_URL, VRB_KEY, { db: { schema: "am" } });

  const { data: { session } } = await sb.auth.getSession();
  if (!session) { loginScreen(); return; }

  const { data: ok, error: okErr } = await sb.rpc("is_allowed");
  if (okErr || !ok) {
    await sb.auth.signOut();
    loginScreen("That account is not authorised for this dashboard.", true);
    return;
  }
  vrbUser = session.user;
  /* Tokens refresh in the background; supabase-js handles the header itself
     here, but keep the user object current on refresh. */
  sb.auth.onAuthStateChange((_e, sess) => { if (sess) vrbUser = sess.user; });

  document.body.innerHTML =
    vrbHeader(activeSection, activeTab) + '<div class="vrb-wrap" id="main"></div>';
  document.getElementById("so").onclick = async () => {
    await sb.auth.signOut(); location.reload();
  };
  try {
    await render(document.getElementById("main"));
  } catch (e) {
    document.getElementById("main").innerHTML =
      `<div class="alert bad"><b>Could not load this page</b>${esc(e.message)}</div>`;
    console.error(e);
  }
}

const AM_TABS = [
  ["portfolio.html", "Portfolio"], ["loans.html", "Loans"],
  ["income.html", "Income"], ["expenses.html", "Expenses"],
  ["review.html", "Review"],
];
function vrbHeader(section, tab) {
  const today = new Date().toLocaleDateString("en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const tabs = section === "am"
    ? AM_TABS.map(([h, l]) =>
        `<a href="${h}" class="${tab === l ? "on" : ""}">${l}</a>`).join("")
    : `<a href="index.html" class="on">All Deals</a>`;
  return `
  <div class="vrb-top">
    <span class="vrb-logo">VRB Capital</span>
    <span class="vrb-switch">
      <a href="index.html" class="${section === "deals" ? "on" : ""}">Deal Tracker</a>
      <a href="portfolio.html" class="${section === "am" ? "on" : ""}">Asset Management</a>
    </span>
    <span class="vrb-top-right">
      <span class="vrb-live" id="live">● Live</span>
      <span class="vrb-who">${esc((vrbUser && vrbUser.email) || "")}</span>
      <button class="vrb-signout" id="so">Sign out</button>
      <span class="dim" style="color:rgba(255,255,255,.65)">${today}</span>
    </span>
  </div>
  <div class="vrb-tabs">${tabs}</div>`;
}

/* ---------- query helpers ---------- */
async function q(table, build, cols) {
  let query = sb.from(table).select(cols || "*");
  if (build) query = build(query);
  const { data, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}
const N = (v) => (v == null || v === "" ? null : Number(v));
