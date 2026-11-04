import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.78.0/+esm";
import { SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAIL, TOTAL, TYPES, MILESTONES } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);

/** @type {{id:number,type:string,created_at:string}[]} */
let stickers = [];
let session = null;
let busy = false;

const wantsAdmin = new URLSearchParams(location.search).has("admin");
const isAdmin = () => session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

const fmtDate = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", timeZone: "America/Lima" });
const GIFT = '<svg class="gift" viewBox="0 0 24 24" fill="none" stroke="#c9302c" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M2 9h20v-3H2zM12 6v15M12 6c-1.5-3-5-3.5-5-1s3 1 5 1c2 0 5 1.5 5-1s-3.5-2-5 1z"/></svg>';
const rot = (i) => ((i * 37) % 17) - 8; // inclinación "a mano", estable por casilla

// ---------- Utilidades ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin storage: no pasa nada */ } },
};

let snackTimer;
function snack(text) {
  const el = $("snack");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function stickerImg(type, r = 0) {
  const t = TYPES[type];
  if (!t) return "";
  return `<img class="die" src="${t.img}" alt="${t.name}" style="--r:${r}deg" draggable="false">`;
}

const milestoneKeys = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);

// ---------- Datos ----------
async function load() {
  const { data, error } = await sb
    .from("stickers")
    .select("id,type,created_at")
    .order("id", { ascending: true })
    .limit(TOTAL);
  if (error) throw error;
  stickers = data ?? [];
}

// ---------- Render ----------
function render(justAdded = -1) {
  let html = "";
  for (let i = 1; i <= TOTAL; i++) {
    const m = MILESTONES[i];
    const s = stickers[i - 1];
    const cls = ["cell"];
    if (m) cls.push("milestone", "t" + m.tier);
    if (m && s) cls.push("reached");
    if (i === justAdded) cls.push("just-added");
    const inner = `<span class="num">${i}</span>${s ? stickerImg(s.type, rot(i)) : m ? GIFT : ""}${m ? `<span class="label">${m.label}</span>` : ""}`;
    html += s
      ? `<button class="${cls.join(" ")}" data-i="${i}" aria-label="Recuadro ${i}: ${TYPES[s.type]?.name ?? s.type}">${inner}</button>`
      : `<div class="${cls.join(" ")}" ${m ? `aria-label="Recuadro ${i}: ${m.label}"` : ""}>${inner}</div>`;
  }
  $("grid").innerHTML = html;

  const count = stickers.length;
  const next = milestoneKeys.find((k) => k > count);
  $("next").textContent = next ? `${MILESTONES[next].label} — faltan ${next - count}` : "¡Cartilla completa!";
  $("points").textContent = `${count} / ${TOTAL}`;
  $("bar").style.width = `${(count / TOTAL) * 100}%`;

  $("legend").innerHTML =
    "<h2>LEYENDA</h2>" +
    Object.entries(TYPES)
      .map(([k, t]) => `<div class="lg">${stickerImg(k)}<div><b>${t.name}</b><small>${t.reason}</small></div><span class="count">×${stickers.filter((s) => s.type === k).length}</span></div>`)
      .join("");

  renderAdmin();
}

function renderAdmin() {
  const box = $("admin");
  if (isAdmin()) {
    box.hidden = false;
    const full = stickers.length >= TOTAL;
    box.innerHTML =
      `<span class="tag">Modo admin</span>` +
      Object.entries(TYPES)
        .map(([k, t]) => `<button type="button" data-add="${k}" ${full || busy ? "disabled" : ""}><img src="${t.img}" alt="">+ ${t.name}</button>`)
        .join("") +
      `<button type="button" data-undo ${!stickers.length || busy ? "disabled" : ""}>↶ Deshacer</button>` +
      `<button type="button" class="link" data-logout>Salir</button>`;
  } else if (wantsAdmin) {
    box.hidden = false;
    if (!box.querySelector("form")) {
      box.innerHTML = `
        <span class="tag">Acceso admin</span>
        <form id="login">
          <input type="email" name="email" autocomplete="username" placeholder="Correo" value="${ADMIN_EMAIL}" required>
          <input type="password" name="password" autocomplete="current-password" placeholder="Contraseña" required>
          <button type="submit">Entrar</button>
          <span class="err" id="login-err"></span>
        </form>`;
    }
  } else {
    box.hidden = true;
    box.innerHTML = "";
  }
}

// ---------- Celebración ----------
function celebrate(text) {
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#c9302c", "#e8b23a", "#7d9fc0", "#8cc63f", "#6b7486", "#ffffff"];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--d", 1.8 + Math.random() * 1.6 + "s");
    p.style.setProperty("--x", Math.random() * 200 - 100 + "px");
    p.style.animationDelay = Math.random() * 0.4 + "s";
    wrap.appendChild(p);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = "¡" + text + "!";
  document.body.append(wrap, t);
  setTimeout(() => { wrap.remove(); t.remove(); }, 3600);
}

/** Celebra el premio más alto alcanzado entre (prev, now]. */
function celebrateRange(prev, now) {
  const hit = milestoneKeys.filter((k) => k > prev && k <= now).pop();
  if (hit) celebrate(MILESTONES[hit].label);
}

// ---------- Acciones admin ----------
async function addSticker(type) {
  if (busy || stickers.length >= TOTAL) return;
  busy = true; renderAdmin();
  const { data, error } = await sb.from("stickers").insert({ type }).select("id,type,created_at").single();
  busy = false;
  if (error) { renderAdmin(); snack("No se pudo pegar: " + error.message); return; }
  stickers.push(data);
  const n = stickers.length;
  store.set("seenCount", String(n));
  render(n);
  snack(`Sticker de ${TYPES[type].name} pegado en el recuadro ${n}`);
  if (MILESTONES[n]) celebrate(MILESTONES[n].label);
}

async function undoLast() {
  const last = stickers[stickers.length - 1];
  if (busy || !last) return;
  if (!confirm(`¿Quitar el sticker de ${TYPES[last.type]?.name ?? last.type} del recuadro ${stickers.length}?`)) return;
  busy = true; renderAdmin();
  const { error } = await sb.from("stickers").delete().eq("id", last.id);
  busy = false;
  if (error) { renderAdmin(); snack("No se pudo deshacer: " + error.message); return; }
  stickers.pop();
  store.set("seenCount", String(stickers.length));
  render();
  snack("Sticker quitado");
}

// ---------- Eventos ----------
$("admin").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.type !== "button") return;
  if (b.dataset.add) addSticker(b.dataset.add);
  else if ("undo" in b.dataset) undoLast();
  else if ("logout" in b.dataset) sb.auth.signOut();
});

$("admin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const err = $("login-err");
  err.textContent = "Entrando…";
  const { error } = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
  err.textContent = error ? "No se pudo entrar: revisa el correo y la contraseña." : "";
});

$("grid").addEventListener("click", (e) => {
  const cell = e.target.closest("button.cell");
  if (!cell) return;
  const i = Number(cell.dataset.i);
  const s = stickers[i - 1];
  const t = TYPES[s.type];
  snack(`#${i} · ${t.name} — ${t.reason} · ${fmtDate.format(new Date(s.created_at))}`);
});

// Al volver a la pestaña: refresca y anima lo nuevo
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || busy) return;
  const prev = stickers.length;
  try { await load(); } catch { return; }
  const now = stickers.length;
  if (now !== prev) {
    render(now > prev ? now : -1);
    if (now > prev) celebrateRange(prev, now);
    store.set("seenCount", String(now));
  }
});

sb.auth.onAuthStateChange((_event, s) => {
  session = s;
  renderAdmin();
});

// ---------- Inicio ----------
(async () => {
  render();
  try {
    await load();
  } catch (err) {
    console.error(err);
    $("next").textContent = "No se pudo cargar la cartilla 😕";
    return;
  }
  const seen = Number(store.get("seenCount"));
  const now = stickers.length;
  const hasNew = store.get("seenCount") !== null && now > seen;
  render(hasNew ? now : -1);
  if (hasNew && !isAdmin()) celebrateRange(seen, now);
  store.set("seenCount", String(now));
})();
