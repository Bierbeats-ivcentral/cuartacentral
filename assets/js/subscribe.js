/* ============================================
   IV CENTRAL — subscribe.js  (v3 — fix completo)

   Correcciones aplicadas:
   - handleSubscribe: escribe localStorage "ivc_subscribed"
     para que _autoPromptSubscribe no repita el modal
   - _showIOSInstallModal: botón cerrar usa addEventListener,
     no onclick inline (compatible con CSP)
   - openSubscribeModal: botón "CERRAR" del success view
     usa data-action en lugar de onclick inline
   - subscribePush: avisa en consola cuando VAPID no está
     configurado en lugar de fallar silenciosamente
   ============================================ */

// ── CONFIG (pública — anon key solo) ─────────────────────────
const IVC = Object.freeze({
  SUPABASE_URL: "https://xtdtzptqlfxkmoalnarm.supabase.co",
  SUPABASE_ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZHR6cHRxbGZ4a21vYWxuYXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzQ5NTIsImV4cCI6MjA5NDkxMDk1Mn0.aImUlHygCzehVensgiVwq9pfQyr2Ei0ybeLc04-Mqgs",
  VAPID_PUBLIC: "", // ← Pega tu VAPID public key cuando la generes en Supabase
  WA_NUMBER: "56927042286",
  FORMSPREE_ID: "xbdbdqpo",
});
window._IVC_CONFIG = IVC;

// ── RATE LIMITER ─────────────────────────────────────────────
const _rateLimits = {};
function _rateOk(key, maxPerMin = 3) {
  const now = Date.now();
  if (!_rateLimits[key]) _rateLimits[key] = [];
  _rateLimits[key] = _rateLimits[key].filter((t) => now - t < 60000);
  if (_rateLimits[key].length >= maxPerMin) return false;
  _rateLimits[key].push(now);
  return true;
}

// ── SANITIZER ────────────────────────────────────────────────
function _san(str, maxLen = 300) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>"'`]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" }[c]))
    .trim()
    .slice(0, maxLen);
}

function _sanEmail(e) {
  const s = _san(e, 100).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

// ── SUPABASE FETCH WRAPPER ────────────────────────────────────
async function _sbFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": IVC.SUPABASE_ANON,
      "Authorization": `Bearer ${IVC.SUPABASE_ANON}`,
      "Prefer": "return=representation",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${IVC.SUPABASE_URL}/rest/v1/${path}`, opts);
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data: json };
}


// ── GUARDAR SUSCRIPTOR EN SUPABASE ───────────────────────────
async function saveSubscriber(email, nombre, intereses, pushSub) {
  const payload = {
    email,
    nombre: _san(nombre, 80),
    intereses: intereses.join(","),
    push_endpoint: pushSub ? pushSub.endpoint : null,
    push_p256dh: pushSub ? btoa(String.fromCharCode(...new Uint8Array(pushSub.getKey("p256dh")))) : null,
    push_auth: pushSub ? btoa(String.fromCharCode(...new Uint8Array(pushSub.getKey("auth")))) : null,
    created_at: new Date().toISOString(),
    source: "web",
    active: true,
  };
  return _sbFetch("subscribers?on_conflict=email", "POST", payload);
}

// ── PUSH SUBSCRIPTION ────────────────────────────────────────
async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!IVC.VAPID_PUBLIC) {
    // FIX: aviso explícito en lugar de falla silenciosa
    console.info("[IV CENTRAL] Push notifications desactivadas: VAPID_PUBLIC no configurada en subscribe.js");
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(IVC.VAPID_PUBLIC),
    });
    return sub;
  } catch (_) {
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ── MODAL DE SUSCRIPCIÓN ──────────────────────────────────────
function openSubscribeModal() {
  if (document.getElementById("sub-modal")) return;

  const modal = document.createElement("div");
  modal.id = "sub-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Suscribirse a IV CENTRAL");
  modal.innerHTML = `
    <div class="sub-backdrop" id="sub-backdrop"></div>
    <div class="sub-box">
      <button class="sub-close" id="sub-close" aria-label="Cerrar">
        <i class="ti ti-x"></i>
      </button>

      <div id="sub-form-view">
        <div class="sub-logo-wrap">
          <span style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#D4A017;letter-spacing:.1em;">IV CENTRAL</span>
        </div>
        <h2 class="sub-title">ÚNETE A LA RED</h2>
        <p class="sub-sub">Recibe novedades, acceso a sorteos y alertas de nuevos productores directamente.</p>

        <div class="sub-tags-wrap">
          <label class="sub-tag"><input type="checkbox" value="noticias" checked /> 📰 Noticias</label>
          <label class="sub-tag"><input type="checkbox" value="sorteos" checked /> 🎁 Sorteos</label>
          <label class="sub-tag"><input type="checkbox" value="lanzamientos" /> 🎵 Lanzamientos</label>
          <label class="sub-tag"><input type="checkbox" value="estudios" /> 🎛️ Nuevos estudios</label>
        </div>

        <div class="sub-field-group">
          <input id="sub-nombre" type="text" class="form-input" placeholder="Tu nombre artístico o real" maxlength="80" autocomplete="name" />
          <input id="sub-email" type="email" class="form-input" placeholder="tu@email.com *" required maxlength="100" autocomplete="email" />
        </div>

        <div class="sub-push-row" id="sub-push-row" style="display:none;">
          <label class="sub-push-label">
            <input type="checkbox" id="sub-push-check" checked />
            <span>🔔 Activar notificaciones push (promociones instantáneas)</span>
          </label>
        </div>

        <div class="sub-legal">
          Al suscribirte aceptas recibir comunicaciones de IV CENTRAL. Puedes cancelar cuando quieras.
        </div>

        <button class="btn-gold" id="sub-submit-btn" style="width:100%;padding:14px;font-size:12px;margin-top:4px;">
          <i class="ti ti-bell"></i> SUSCRIBIRME GRATIS
        </button>
        <div id="sub-error" class="sub-error"></div>
      </div>

      <div id="sub-success-view" style="display:none;">
        <div class="sub-success-icon"><i class="ti ti-circle-check"></i></div>
        <div class="sub-success-title">¡ESTÁS DENTRO!</div>
        <p class="sub-success-text">Ya eres parte de la comunidad IV CENTRAL. Pronto recibirás novedades y acceso anticipado a sorteos exclusivos.</p>
        <!-- FIX: data-action en lugar de onclick inline -->
        <button class="btn-gold" data-action="closeSubscribeModal" style="margin-top:16px;padding:12px 24px;font-size:11px;">CERRAR</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("open"));

  if ("PushManager" in window && "serviceWorker" in navigator) {
    document.getElementById("sub-push-row").style.display = "flex";
  }

  document.getElementById("sub-backdrop").addEventListener("click", closeSubscribeModal);
  document.getElementById("sub-close").addEventListener("click", closeSubscribeModal);
  document.getElementById("sub-submit-btn").addEventListener("click", handleSubscribe);
  document.addEventListener("keydown", _subEscListener);
}

function _subEscListener(e) {
  if (e.key === "Escape") closeSubscribeModal();
}

function closeSubscribeModal() {
  const m = document.getElementById("sub-modal");
  if (!m) return;
  m.classList.remove("open");
  document.removeEventListener("keydown", _subEscListener);
  setTimeout(() => m.remove(), 300);
}

// ── FORMSPREE FALLBACK (si Supabase no está disponible o falla) ──────────
async function _saveSubscriberFormspree(email, nombre, intereses) {
  const formData = new FormData();
  formData.append("email",     email);
  formData.append("nombre",    nombre || "—");
  formData.append("intereses", intereses.join(", "));
  formData.append("_subject",  "🔔 Nueva suscripción IV CENTRAL");
  formData.append("source",    "web-subscribe");
  try {
    const res = await fetch(`https://formspree.io/f/${IVC.FORMSPREE_ID}`, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && !json.errors;
  } catch (_) {
    return false;
  }
}

async function handleSubscribe() {
  if (!_rateOk("subscribe", 2)) {
    _showSubError("Demasiados intentos. Espera un momento.");
    return;
  }

  const emailRaw  = document.getElementById("sub-email")?.value || "";
  const nombreRaw = document.getElementById("sub-nombre")?.value || "";
  const email     = _sanEmail(emailRaw);

  if (!email) {
    _showSubError("Ingresa un email válido.");
    return;
  }

  const intereses = [...document.querySelectorAll("#sub-modal .sub-tag input:checked")]
    .map((el) => el.value);

  const btn = document.getElementById("sub-submit-btn");
  btn.innerHTML = '<i class="ti ti-loader-2"></i> PROCESANDO...';
  btn.disabled = true;
  _showSubError("");

  let pushSub = null;
  const wantsPush = document.getElementById("sub-push-check")?.checked;
  if (wantsPush) {
    const perm = await Notification.requestPermission().catch(() => "denied");
    if (perm === "granted") {
      pushSub = await subscribePush();
    }
  }

  // ── Intentar Supabase ─────────────────────────────────────────────────
  let saved = false;
  const { ok, data } = await saveSubscriber(email, nombreRaw, intereses, pushSub)
    .catch(() => ({ ok: false, data: null }));

  if (ok) {
    saved = true;
  } else {
    // Email duplicado → igual es éxito
    const isDup = data && (JSON.stringify(data).includes("duplicate") || JSON.stringify(data).includes("23505"));
    if (isDup) {
      saved = true;
    } else {
      // Supabase no disponible (allowlist, red, config) → Formspree como respaldo
      console.info("[IV CENTRAL] Supabase no disponible — guardando via Formspree");
      saved = await _saveSubscriberFormspree(email, nombreRaw, intereses);
    }
  }

  if (!saved) {
    btn.innerHTML = '<i class="ti ti-bell"></i> SUSCRIBIRME GRATIS';
    btn.disabled = false;
    _showSubError("No se pudo guardar. Intenta de nuevo o contáctanos por WhatsApp.");
    return;
  }

  if (typeof gtag !== "undefined") {
    gtag("event", "subscribe", { method: "email", content_type: intereses.join(",") });
  }

  localStorage.setItem("ivc_subscribed", "1");

  // Ocultar el botón flotante inmediatamente
  const floatBtn = document.getElementById("sub-float-btn");
  if (floatBtn) floatBtn.remove();

  _showSubscribeSuccess();
}

function _showSubscribeSuccess() {
  const formView    = document.getElementById("sub-form-view");
  const successView = document.getElementById("sub-success-view");
  if (formView)    formView.style.display = "none";
  if (successView) successView.style.display = "flex";
}

function _showSubError(msg) {
  const el = document.getElementById("sub-error");
  if (el) el.textContent = msg;
}

// FIX: handler del botón "CERRAR" del success view via event delegation
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-action='closeSubscribeModal']")) {
    closeSubscribeModal();
  }
});

// ── BANNER INMEDIATO (se muestra al abrir la página) ─────────────
function _autoPromptSubscribe_banner() {
  if (sessionStorage.getItem("ivc_sub_dismissed")) return;
  if (localStorage.getItem("ivc_subscribed")) return;
  // Show subscription banner immediately at page open
  if (!document.querySelector(".pm-modal.open") && !document.getElementById("sub-modal")) {
    openSubscribeModal();
    sessionStorage.setItem("ivc_sub_dismissed", "1");
  }
}

// ── AUTO-PROMPT ───────────────────────────────────────────────
function _autoPromptSubscribe() {
  if (sessionStorage.getItem("ivc_sub_dismissed")) return;
  // FIX: ahora sí revisa el flag que handleSubscribe escribe
  if (localStorage.getItem("ivc_subscribed")) return;
  setTimeout(() => {
    if (!document.querySelector(".pm-modal.open") && !document.getElementById("sub-modal")) {
      openSubscribeModal();
      sessionStorage.setItem("ivc_sub_dismissed", "1");
    }
  }, 8000);
}

// ── BANNER DE APP MÓVIL + MODAL PWA ──────────────────────────
let _deferredInstall = null;
let _installBtnRef = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredInstall = e;
  // Si el botón ya existe en el DOM, habilitarlo inmediatamente
  const btn = document.getElementById("app-install-btn") || _installBtnRef;
  if (btn) {
    btn.disabled = false;
    btn.textContent = "INSTALAR";
    btn.style.cssText = ""; // reset any override styles
  }
});

// FIX: modal iOS sin onclick inline — usa addEventListener
function _showIOSInstallModal() {
  if (document.getElementById("ios-install-modal")) return;
  const modal = document.createElement("div");
  modal.id = "ios-install-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10001;display:flex;align-items:flex-end;
    justify-content:center;padding:0;background:rgba(0,0,0,.75);
    backdrop-filter:blur(6px);animation:fadeIn .2s ease;
  `;
  modal.innerHTML = `
    <div style="
      background:#111;border:1px solid rgba(212,160,23,.25);
      border-radius:24px 24px 0 0;width:100%;max-width:480px;
      padding:32px 28px 48px;position:relative;
      animation:slideUp .3s cubic-bezier(.22,1,.36,1);
    ">
      <button id="ios-modal-close" style="
        position:absolute;top:14px;right:16px;background:rgba(255,255,255,.08);
        border:none;color:#888;width:30px;height:30px;border-radius:50%;
        font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;
      " aria-label="Cerrar">×</button>

      <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#D4A017;letter-spacing:.05em;margin-bottom:4px;">
        IV CENTRAL
      </div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:#fff;margin-bottom:20px;">
        INSTALA LA APP EN TU iPHONE
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;gap:16px;background:#181818;border-radius:14px;padding:16px;">
          <div style="width:44px;height:44px;background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);
            border-radius:12px;display:flex;align-items:center;justify-content:center;
            font-size:22px;flex-shrink:0;">1️⃣</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">Toca el botón Compartir</div>
            <div style="font-size:12px;color:#888;line-height:1.4;">El ícono <strong style="color:#D4A017;">□↑</strong> en la barra inferior de Safari</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;background:#181818;border-radius:14px;padding:16px;">
          <div style="width:44px;height:44px;background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);
            border-radius:12px;display:flex;align-items:center;justify-content:center;
            font-size:22px;flex-shrink:0;">2️⃣</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">Selecciona "Añadir a pantalla de inicio"</div>
            <div style="font-size:12px;color:#888;line-height:1.4;">Desplázate hacia abajo en el menú de opciones</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;background:#181818;border-radius:14px;padding:16px;">
          <div style="width:44px;height:44px;background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);
            border-radius:12px;display:flex;align-items:center;justify-content:center;
            font-size:22px;flex-shrink:0;">3️⃣</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">Toca "Añadir"</div>
            <div style="font-size:12px;color:#888;line-height:1.4;">La app aparecerá en tu pantalla de inicio como una app nativa</div>
          </div>
        </div>
      </div>

      <div style="margin-top:24px;text-align:center;font-size:11px;color:#555;">
        Solo funciona desde <strong style="color:#888;">Safari</strong> en iPhone/iPad
      </div>
    </div>
  `;

  if (!document.getElementById("ivc-modal-anim")) {
    const style = document.createElement("style");
    style.id = "ivc-modal-anim";
    style.textContent = `@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // FIX: addEventListener en lugar de onclick inline
  document.getElementById("ios-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

// ── BANNER PRINCIPAL ──────────────────────────────────────────
function _initAppBanner() {
  const ua           = navigator.userAgent || "";
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const dismissed    = localStorage.getItem("ivc_app_banner_dismissed");

  if (isStandalone || dismissed) return;

  const isIOS     = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari  = /Safari/i.test(ua) && !/Chrome/i.test(ua);

  const banner = document.createElement("div");
  banner.id = "app-banner";

  if (isIOS) {
    banner.innerHTML = `
      <div class="app-banner-inner">
        <span class="app-banner-logo" style="font-size:20px;">🎛️</span>
        <div class="app-banner-text">
          <strong><span class="app-banner-badge">NUEVO</span>IV CENTRAL ya tiene app</strong>
          <span>${isSafari ? "Instálala gratis en tu iPhone — sin App Store" : "Ábrela en Safari para instalar"}</span>
        </div>
        <button class="app-banner-btn" id="app-install-btn">
          ${isSafari ? "CÓMO INSTALAR" : "ABRIR EN SAFARI"}
        </button>
        <button class="app-banner-close" id="app-banner-close" aria-label="Cerrar">×</button>
      </div>`;
  } else if (isAndroid) {
    banner.innerHTML = `
      <div class="app-banner-inner">
        <span class="app-banner-logo" style="font-size:20px;">🎛️</span>
        <div class="app-banner-text">
          <strong><span class="app-banner-badge">NUEVO</span>IV CENTRAL ya tiene app</strong>
          <span>Instala gratis · Sin ir al Play Store</span>
        </div>
        <button class="app-banner-btn" id="app-install-btn">INSTALAR</button>
        <button class="app-banner-close" id="app-banner-close" aria-label="Cerrar">×</button>
      </div>`;
  } else {
    banner.innerHTML = `
      <div class="app-banner-inner">
        <span class="app-banner-logo" style="font-size:20px;">🖥️</span>
        <div class="app-banner-text">
          <strong><span class="app-banner-badge">NUEVO</span>IV CENTRAL ya tiene app</strong>
          <span>Instala gratis en tu PC · También en iPhone y Android</span>
        </div>
        <button class="app-banner-btn" id="app-install-btn" disabled>INSTALAR</button>
        <button class="app-banner-close" id="app-banner-close" aria-label="Cerrar">×</button>
      </div>`;
  }

  document.body.prepend(banner);
  banner.getBoundingClientRect();
  banner.classList.add("visible");
  document.body.classList.add("has-banner");

  document.getElementById("app-banner-close").addEventListener("click", () => {
    banner.classList.remove("visible");
    document.body.classList.remove("has-banner");
    setTimeout(() => {
      banner.remove();
      // Re-show after 60 seconds if not installed
      setTimeout(() => {
        const stillStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
        if (!stillStandalone && !localStorage.getItem("ivc_app_installed")) {
          _initAppBanner();
        }
      }, 60000);
    }, 350);
  });

  const installBtn = document.getElementById("app-install-btn");
  if (!installBtn) return;
  _installBtnRef = installBtn;

  // Si el evento ya llegó antes de que apareciera el banner, habilitarlo
  if (_deferredInstall) installBtn.disabled = false;

  async function _triggerInstallPrompt() {
    if (!_deferredInstall) {
      // No debería pasar a los 20s, pero por si acaso
      installBtn.textContent = "Menú ⋯ Agregar a inicio";
      installBtn.style.fontSize = "10px";
      installBtn.disabled = true;
      return;
    }
    installBtn.disabled = true;
    installBtn.textContent = "···";
    try {
      await _deferredInstall.prompt();
      const { outcome } = await _deferredInstall.userChoice;
      if (outcome === "accepted") {
        banner.classList.remove("visible");
        document.body.classList.remove("has-banner");
        localStorage.setItem("ivc_app_banner_dismissed", "1");
        localStorage.setItem("ivc_app_installed", "1");
        setTimeout(() => banner.remove(), 350);
      } else {
        installBtn.disabled = false;
        installBtn.textContent = "INSTALAR";
      }
    } catch(err) {
      console.warn("Install prompt error:", err);
      installBtn.disabled = false;
      installBtn.textContent = "INSTALAR";
    }
    _deferredInstall = null;
  }

  if (isIOS) {
    installBtn.addEventListener("click", () => _showIOSInstallModal());
  } else if (isAndroid) {
    installBtn.addEventListener("click", _triggerInstallPrompt);
  } else {
    window.addEventListener("beforeinstallprompt", () => { installBtn.disabled = false; });
    installBtn.addEventListener("click", _triggerInstallPrompt);
  }
}

// ── SERVICE WORKER REGISTRATION ───────────────────────────────
async function _registerSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
  } catch (_) {}
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  _registerSW();
  _autoPromptSubscribe_banner();
  setTimeout(_autoPromptSubscribe, 500);

  // Banner de instalación: esperar 20s tras window.load para que
  // el navegador ya tenga el beforeinstallprompt listo
  const _launchBanner = () => setTimeout(_initAppBanner, 20000);
  if (document.readyState === "complete") {
    _launchBanner();
  } else {
    window.addEventListener("load", _launchBanner, { once: true });
  }
});

// ── EXPORT PÚBLICO ────────────────────────────────────────────
window.IVC_Subscribe = { open: openSubscribeModal, close: closeSubscribeModal };
