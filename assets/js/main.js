/* ============================================
   IV CENTRAL — main.js  (v3 — fix completo)

   Correcciones aplicadas:
   - _renderGallery: ya no muta s.studioPhotos (usa copia)
   - producerImage / renderStudioDetail: onerror registrado
     con addEventListener, no inline (compatible con CSP)
   - selectStudio: sin setTimeout — usa callback directo
   - initBookingStudios: priceVal validado como número
   ============================================ */

// ── SECURITY: Sanitizar antes de insertar al DOM ──────────────
const _S = {
  html: (s) => String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#x27;"),
  url: (u) => {
    try {
      const parsed = new URL(u, location.origin);
      if (!["http:","https:"].includes(parsed.protocol)) return "#";
      return parsed.href;
    } catch(_){ return "#"; }
  },
  num: (n, fallback = 0) => { const v = parseInt(n); return isNaN(v) ? fallback : v; },
  text: (s, max = 500) => String(s ?? "").replace(/[<>"'`]/g,"").slice(0, max).trim(),
};

// ── RATE LIMITER (per-action, in-memory) ──────────────────────
const _RL = {};
function _rateOk(key, max = 5) {
  const now = Date.now();
  if (!_RL[key]) _RL[key] = [];
  _RL[key] = _RL[key].filter(t => now - t < 60000);
  if (_RL[key].length >= max) return false;
  _RL[key].push(now);
  return true;
}

// ── PAGE NAVIGATION ───────────────────────────────────────────
function showPage(id, btn) {
  if (!_rateOk("nav", 30)) return;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  if (btn) btn.classList.add("active");
  closeSidebar();
  if (id === "productores") renderProducers("all");
  if (id === "inicio")      renderActivity();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSidebar() {
  const sidebar  = document.getElementById("sidebar");
  const btn      = document.getElementById("hamburger");
  const overlay  = document.getElementById("sidebar-overlay");
  const isOpen   = sidebar?.classList.toggle("open");
  btn?.classList.toggle("is-open", isOpen);
  if (overlay) {
    // forzar reflow para que la transición de opacity funcione
    overlay.offsetHeight;
    overlay.classList.toggle("visible", isOpen);
  }
}

function closeSidebar() {
  const sidebar  = document.getElementById("sidebar");
  const btn      = document.getElementById("hamburger");
  const overlay  = document.getElementById("sidebar-overlay");
  sidebar?.classList.remove("open");
  btn?.classList.remove("is-open");
  overlay?.classList.remove("visible");
}

// ── FOTO O EMOJI (helper) ─────────────────────────────────────
// FIX: onerror se registra con addEventListener después de crear
// el elemento, evitando atributo inline que viola CSP.
function producerImage(p, height = "200px") {
  const safeH   = CSS.supports("height", height) ? height : "200px";
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `width:100%;height:${safeH};overflow:hidden;`;

  if (p.photo && p.photo.trim() !== "" && !p.photo.includes("XXXXXXX")) {
    const img = document.createElement("img");
    img.src   = _S.url(p.photo);
    img.alt   = _S.text(p.name);
    img.style.cssText = `width:100%;height:${safeH};object-fit:cover;display:block;`;
    img.addEventListener("error", () => {
      wrapper.innerHTML = `<div class="prod-img-placeholder" style="height:${safeH};background:${_S.html(p.color)}">${_S.html(p.emoji)}</div>`;
    });
    wrapper.appendChild(img);
  } else {
    wrapper.innerHTML = `<div class="prod-img-placeholder" style="height:${safeH};background:${_S.html(p.color)}">${_S.html(p.emoji)}</div>`;
  }
  return wrapper.outerHTML;
}

// ── RENDER ACTIVITY ───────────────────────────────────────────
function renderActivity() {
  const container = document.getElementById("activity-feed");
  if (container) {
    container.innerHTML = ACTIVITY.map(a => `
      <div class="activity-item">
        <div class="activity-icon">${_S.html(a.icon)}</div>
        <div>
          <div class="activity-text">${_S.html(a.text)}</div>
          <div class="activity-time">${_S.html(a.time)}</div>
        </div>
      </div>
    `).join("");
  }

  const recentGrid = document.getElementById("recent-grid");
  if (recentGrid) {
    const recent = PRODUCERS.slice(0, 3);
    recentGrid.innerHTML = recent.map(p => `
      <div class="recent-card">
        <div class="recent-avatar" style="background:${_S.html(p.color)}">${_S.html(p.emoji)}</div>
        <div>
          <div class="recent-name">${_S.html(p.name)}</div>
          <div class="recent-meta">${_S.html(p.city)} · ${_S.html(p.genres.join(" / "))}</div>
        </div>
        <button class="recent-btn" data-action="selectStudio" data-id="${_S.num(p.id)}">VER →</button>
      </div>
    `).join("");
  }
}

// ── RENDER PRODUCERS ──────────────────────────────────────────
function renderProducers(filter) {
  const grid = document.getElementById("prod-grid");
  if (!grid) return;
  const safeFilter = _S.text(filter, 40);
  const list = safeFilter === "all"
    ? PRODUCERS
    : PRODUCERS.filter(p => p.genres.some(g => g.toLowerCase().includes(safeFilter.toLowerCase())));

  grid.innerHTML = list.map(p => {
    const avail = p.available;
    return `
    <div class="prod-card" data-action="selectStudio" data-id="${_S.num(p.id)}">
      ${producerImage(p, "200px")}
      <div class="prod-body">
        <div class="prod-name">${_S.html(p.name)}</div>
        <div class="prod-city">${_S.html(p.city)} · ${_S.html(p.region)}</div>
        <div class="prod-genre">${_S.html(p.genres.join(" / "))}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4;">${_S.html(p.bio.substring(0,80))}...</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="font-size:11px;color:var(--gold);font-weight:700;">${_S.html(p.price)}</span>
          <span style="font-size:9px;padding:3px 8px;border-radius:4px;font-weight:700;letter-spacing:.08em;
            background:${avail?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)"};
            color:${avail?"#22c55e":"#ef4444"};
            border:1px solid ${avail?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"};">
            ${avail?"DISPONIBLE":"OCUPADO"}
          </span>
        </div>
        <button class="prod-btn">VER ESTUDIO ↗</button>
      </div>
    </div>`;
  }).join("");
}

function filterProducers(genre, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderProducers(genre);
}

// ── RENDER STUDIOS ────────────────────────────────────────────
function renderStudios() {
  const tabsEl = document.getElementById("studio-tabs");
  if (!tabsEl) return;
  tabsEl.innerHTML = PRODUCERS.map((p, i) =>
    `<button class="stab${i===0?" active":""}" data-action="selectStudio" data-id="${i}" data-tab="true">${_S.html(p.name)}</button>`
  ).join("");
  renderStudioDetail(0);
}

let _currentStudioIndex = 0;

// FIX: eliminado setTimeout — renderStudioDetail se llama directamente
// después de actualizar las tabs, sin race condition.
function selectStudio(idx, btn) {
  const safeIdx = _S.num(idx, 0);
  if (safeIdx < 0 || safeIdx >= PRODUCERS.length) return;
  _currentStudioIndex = safeIdx;
  showPage("estudios", document.querySelectorAll(".nav-btn")[2]);
  document.querySelectorAll(".stab").forEach((b, i) => b.classList.toggle("active", i === safeIdx));
  renderStudioDetail(safeIdx);
}

function renderStudioDetail(idx) {
  const container = document.getElementById("studio-detail");
  if (!container) return;
  const safeIdx = _S.num(idx, 0);
  if (safeIdx < 0 || safeIdx >= PRODUCERS.length) return;
  const s = PRODUCERS[safeIdx];

  if (typeof gtag !== "undefined") {
    gtag("event", "ver_productor", {
      productor_nombre: s.name,
      productor_ciudad: s.city,
      productor_region: s.region,
      productor_generos: s.genres.join(", "),
    });
  }

  const igHandle = s.instagram ? s.instagram.replace("@", "") : "";
  const bsHandle = s.beatstars || "";

  // FIX: avatar del estudio — se construye el img con addEventListener
  // en lugar de onerror inline.
  let avatarHTML;
  if (s.photo && !s.photo.includes("XXXXXXX") && s.photo.trim() !== "") {
    avatarHTML = `<img id="studio-avatar-img-${safeIdx}"
      src="${_S.url(s.photo)}"
      style="width:100%;height:100%;object-fit:cover;"
      alt="${_S.html(s.name)}" />`;
  } else {
    avatarHTML = `<div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;background:${_S.html(s.color)};font-size:28px;">${_S.html(s.emoji)}</div>`;
  }

  container.innerHTML = `
    <div class="studio-detail-card">
      <div class="studio-header">
        <div style="display:flex;align-items:center;gap:18px;">
          <div id="studio-avatar-wrap-${safeIdx}" style="width:72px;height:72px;border-radius:12px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);">
            ${avatarHTML}
          </div>
          <div>
            <div class="studio-name-big">${_S.html(s.name)}</div>
            <div class="studio-city-tag">${_S.html(s.city)}, ${_S.html(s.region)} · ${_S.html(s.genres.join(" / "))}</div>
          </div>
        </div>
        <div class="studio-avail-badge">${s.available ? "● DISPONIBLE" : "● OCUPADO"}</div>
      </div>

      <div style="padding:16px 24px;font-size:13px;color:var(--muted);line-height:1.65;border-bottom:1px solid var(--border);">${_S.html(s.bio)}</div>

      <div class="studio-body-grid">
        <div>
          <div class="studio-col-label">SERVICIOS</div>
          <div class="service-list">
            ${s.services.map(sv => `<div class="service-item"><i class="ti ti-check"></i>${_S.html(sv)}</div>`).join("")}
          </div>
        </div>
        <div>
          <div class="studio-col-label">EQUIPAMIENTO</div>
          <div class="equip-list">
            ${s.equip.map(e => `<div class="equip-item">${_S.html(e)}</div>`).join("")}
          </div>
        </div>
        <div>
          <div class="studio-col-label">REDES &amp; CONTACTO</div>
          <div class="social-list">
            ${igHandle ? `<a class="social-link" href="${_S.url("https://instagram.com/"+igHandle)}" target="_blank" rel="noopener noreferrer"><i class="ti ti-brand-instagram"></i>${_S.html(s.instagram)}</a>` : ""}
            ${bsHandle ? `<a class="social-link" href="${_S.url("https://www.beatstars.com/"+bsHandle)}" target="_blank" rel="noopener noreferrer"><i class="ti ti-headphones"></i>Beatstars</a>` : ""}
            ${s.whatsapp ? `<a class="social-link" href="${_S.url("https://wa.me/"+s.whatsapp)}" target="_blank" rel="noopener noreferrer"><i class="ti ti-brand-whatsapp"></i>WhatsApp</a>` : ""}
            <a class="social-link" href="#" data-action="prefillAndReservar" data-id="${_S.num(safeIdx)}">
              <i class="ti ti-calendar"></i>Agendar sesión
            </a>
          </div>
        </div>
      </div>

      <div class="studio-footer">
        <div class="price-box">
          <div class="price-label">TARIFA BASE</div>
          <div class="price-val">${_S.html(s.price)}</div>
        </div>
        <button class="btn-gold" data-action="prefillAndReservar" data-id="${_S.num(safeIdx)}">
          <i class="ti ti-calendar"></i> RESERVAR SESIÓN
        </button>
        <button class="btn-outline" data-action="showProductores">VER TODOS</button>
      </div>

      ${_renderGallery(s, safeIdx)}
    </div>
  `;

  // FIX: registrar onerror del avatar con addEventListener (no inline)
  const avatarImg = document.getElementById(`studio-avatar-img-${safeIdx}`);
  if (avatarImg) {
    avatarImg.addEventListener("error", () => {
      const wrap = document.getElementById(`studio-avatar-wrap-${safeIdx}`);
      if (wrap) wrap.innerHTML = `<div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;background:${_S.html(s.color)};font-size:28px;">${_S.html(s.emoji)}</div>`;
    });
  }
}

// ── GALLERY RENDERER ──────────────────────────────────────────
// FIX: ya no muta s.studioPhotos — trabaja sobre una copia del array.
function _renderGallery(s, idx) {
  const raw = Array.isArray(s.studioPhotos) ? [...s.studioPhotos] : [];
  while (raw.length < 6) raw.push("");

  const slides = raw.map((url, i) => {
    if (url && url.trim() !== "") {
      const safeUrl  = _S.url(url);
      const safeName = _S.html(s.name);
      return `
        <div class="sg-slide" data-action="sgLightbox" data-url="${safeUrl}" data-caption="${safeName} — foto ${i+1}">
          <img id="sg-img-${idx}-${i}"
            src="${safeUrl}"
            alt="${safeName} estudio foto ${i+1}"
            loading="lazy" />
          <div class="sg-zoom"><i class="ti ti-zoom-in"></i></div>
        </div>`;
    }
    return `<div class="sg-slide sg-empty"><div class="sg-placeholder"><i class="ti ti-camera"></i><span>Foto ${i+1}</span></div></div>`;
  });

  return `
    <div class="studio-gallery">
      <div class="studio-gallery-label">FOTOS DEL ESTUDIO</div>
      <div class="sg-track-wrap">
        <button class="sg-arrow sg-prev" data-action="sgPrev" data-idx="${idx}" aria-label="Anterior">&#8249;</button>
        <div class="sg-viewport">
          <div class="sg-track" id="sg-track-${idx}">${slides.join("")}</div>
        </div>
        <button class="sg-arrow sg-next" data-action="sgNext" data-idx="${idx}" aria-label="Siguiente">&#8250;</button>
      </div>
      <div class="sg-dots" id="sg-dots-${idx}">
        ${raw.map((_,i)=>`<span class="sg-dot${i===0?" active":""}" data-action="sgDot" data-idx="${idx}" data-dot="${i}"></span>`).join("")}
      </div>
    </div>`;
}

// FIX: registrar onerror de imágenes de galería con addEventListener
// Se llama después de que renderStudioDetail inserta el HTML.
function _attachGalleryErrorHandlers(s, idx) {
  const raw = Array.isArray(s.studioPhotos) ? s.studioPhotos : [];
  raw.forEach((url, i) => {
    if (!url || url.trim() === "") return;
    const img = document.getElementById(`sg-img-${idx}-${i}`);
    if (img) {
      img.addEventListener("error", () => {
        const slide = img.closest(".sg-slide");
        if (slide) {
          slide.classList.add("sg-empty");
          slide.innerHTML = `<div class="sg-placeholder"><i class="ti ti-camera"></i><span>Foto ${i+1}</span></div>`;
        }
      });
    }
  });
}

// ── BOOKING ───────────────────────────────────────────────────
function prefillBooking(idx) {
  const safeIdx = _S.num(idx, 0);
  // 1. Reset: todos los studios y todos los servicios visibles
  initBookingStudios();
  initBookingServices();
  const sel = document.getElementById("book-studio");
  if (sel) {
    sel.value = safeIdx;
    // 2. Filtrar servicios para el productor seleccionado
    _filterServicesForProducer(safeIdx);
    // 3. Limpiar aviso de filtro (navegamos desde un productor)
    const notice = document.getElementById("book-studio-notice");
    if (notice) notice.textContent = "";
  }
}


function _getBaseTotal() {
  const studioSel  = document.getElementById("book-studio");
  const serviceSel = document.getElementById("book-service");
  const hoursSel   = document.getElementById("book-hours");
  if (!studioSel || !serviceSel) return 0;
  const studioIdx  = _S.num(studioSel.value, 0);
  const producer   = PRODUCERS[studioIdx] || PRODUCERS[0];
  const studioRate = producer.priceVal || 35000;
  const svcId      = _S.text(serviceSel.value);
  const svc        = (window.SERVICES || []).find(s => s.id === svcId);
  if (!svc) return studioRate;
  const isHourly = svc.type === "hourly";
  const hours    = _S.num(hoursSel?.value, 1) || 1;
  return isHourly ? studioRate * hours : svc.fixedPrice;
}


function confirmarReserva() {
  if (!_rateOk("booking", 3)) { alert("Demasiadas solicitudes. Espera un momento."); return; }

  const studioSel    = document.getElementById("book-studio");
  const serviceSel   = document.getElementById("book-service");
  const dateInput    = document.getElementById("book-date");
  const timeSel      = document.getElementById("book-time");
  const hoursSel     = document.getElementById("book-hours");
  const artistaInput = document.getElementById("book-artista");
  const notasInput   = document.getElementById("book-notas");
  const clienteInput = document.getElementById("book-cliente");
  const clienteTelInput = document.getElementById("book-cliente-tel");

  if (!dateInput?.value) { alert("Por favor selecciona una fecha."); return; }
  if (!artistaInput?.value.trim()) { alert("Por favor ingresa el nombre del artista / proyecto."); return; }

  const studioIdx  = _S.num(studioSel?.selectedIndex, 0);
  const producer   = PRODUCERS[studioIdx] || PRODUCERS[0];
  const svcId      = _S.text(serviceSel?.value || "");
  const svc        = (window.SERVICES || []).find(s => s.id === svcId);
  const isHourly   = svc ? svc.type === "hourly" : true;

  // FIX: tarifa obtenida desde PRODUCERS directamente (no manipulable desde el DOM)
  const studioRate = producer.priceVal || 35000;
  const rate       = isHourly ? studioRate : (svc ? svc.fixedPrice : studioRate);
  const hours      = isHourly ? (_S.num(hoursSel?.value, 1) || 1) : 1;
  const total      = isHourly ? rate * hours : rate;
  const servicio   = svc ? svc.label : (serviceSel?.options[serviceSel.selectedIndex]?.text || "Sesión");
  const unidad     = svc ? svc.unit : "hora";

  const fecha      = _S.text(dateInput.value, 20);
  const hora       = _S.text(timeSel?.value || "—", 10);
  const artista    = _S.text(artistaInput?.value || "—", 100);
  const notas      = _S.text(notasInput?.value || "", 400);
  const cliente    = _S.text(clienteInput?.value || "", 80);
  const clienteTel = _S.text(clienteTelInput?.value || "", 20);
  const boletaNum  = "IVC-" + Date.now().toString().slice(-6);

  const finalTotal = total;
  const discountAmt = 0;

  const lines = [
    `🎙️ *NUEVA SOLICITUD — IV CENTRAL*`,
    ``,
    `📋 *Boleta:* ${boletaNum}`,
    `🎵 *Productor:* ${producer.name}`,
    `👤 *Artista/Proyecto:* ${artista}`,
    ``,
    `🛠️ *Servicio:* ${servicio}`,
    `📅 *Fecha:* ${formatDate(fecha)}`,
    `⏰ *Hora:* ${hora}`,
    isHourly
      ? `⏱️ *Duración:* ${hours} hora${hours > 1 ? "s" : ""}`
      : `📦 *Modalidad:* precio fijo por ${unidad}`,
    ``,
    `💰 *Tarifa:* $${rate.toLocaleString("es-CL")}/hr`,
    `💵 *TOTAL:* $${finalTotal.toLocaleString("es-CL")} CLP`,
  ];
  if (cliente)    lines.push(``, `📞 *Contacto:* ${cliente}`);
  if (clienteTel) lines.push(`📱 *Teléfono:* ${clienteTel}`);
  if (notas)      lines.push(``, `📝 *Notas:* ${notas}`);
  lines.push(``, `_Enviado desde IV CENTRAL ®_`);

  const waMsg = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  const waURL = `https://wa.me/${producer.whatsapp}?text=${encodeURIComponent(waMsg)}`;

  if (typeof gtag !== "undefined") {
    gtag("event", "reserva_enviada", {
      productor_nombre: producer.name,
      servicio: servicio,
      total_clp: total,
    });
  }

  _incrementSesiones();
  mostrarBoleta({ boletaNum, producer, artista, servicio, isHourly, unidad,
    fecha: formatDate(fecha), hora, hours, rate, total: finalTotal, discountAmt,
    cliente, clienteTel, notas, waURL });
  updatePrice();
}

function formatDate(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  const meses = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${meses[_S.num(m)]} ${y}`;
}

// ── BOLETA MODAL ──────────────────────────────────────────────
function mostrarBoleta(data) {
  cerrarBoleta();
  const overlay = document.createElement("div");
  overlay.id = "boleta-overlay";
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9998;
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(4px);animation:fadeIn .2s ease;`;

  const safeColor = _S.html(data.producer.color);
  const safeEmoji = _S.html(data.producer.emoji);
  const safeName  = _S.html(data.producer.name);

  // Avatar de boleta: img con id para adjuntar onerror después
  let boletaAvatarHTML;
  if (data.producer.photo && !data.producer.photo.includes("XXXXXXX") && data.producer.photo.trim() !== "") {
    boletaAvatarHTML = `<img id="boleta-avatar-img" src="${_S.url(data.producer.photo)}" style="width:100%;height:100%;object-fit:cover;" alt="${safeName}">`;
  } else {
    boletaAvatarHTML = safeEmoji;
  }

  overlay.innerHTML = `
    <div style="background:#111;border:1px solid #333;border-radius:20px;
      max-width:520px;width:100%;max-height:90vh;overflow-y:auto;
      box-shadow:0 0 60px rgba(212,160,23,.15);">
      <div style="background:linear-gradient(135deg,#1a1000,#0a0a0a);border-bottom:1px solid #2a2a2a;
        border-radius:20px 20px 0 0;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#D4A017;letter-spacing:.05em;">IV CENTRAL ®</div>
          <div style="font-size:10px;letter-spacing:.2em;color:#666;margin-top:2px;">BOLETA DE RESERVA</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;color:#666;letter-spacing:.12em;">N°</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#fff;">${_S.html(data.boletaNum)}</div>
        </div>
      </div>

      <div style="padding:24px 28px;display:flex;flex-direction:column;gap:0;">
        <div style="background:#181818;border:1px solid #2a2a2a;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
          <div id="boleta-avatar-wrap" style="width:52px;height:52px;border-radius:10px;overflow:hidden;background:${safeColor};
            display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid #333;">
            ${boletaAvatarHTML}
          </div>
          <div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#fff;">${safeName}</div>
            <div style="font-size:11px;color:#666;margin-top:2px;">${_S.html(data.producer.city)} · ${_S.html(data.producer.genres.join(" / "))}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          ${boletaRow("ARTISTA / PROYECTO", data.artista)}
          ${boletaRow("SERVICIO", data.servicio)}
          ${boletaRow("FECHA", data.fecha)}
          ${boletaRow("HORA INICIO", data.hora)}
          ${data.isHourly ? boletaRow("DURACIÓN", data.hours + " hora" + (data.hours > 1 ? "s" : "")) : boletaRow("MODALIDAD", "Precio fijo / " + data.unidad)}
          ${boletaRow("TARIFA BASE", "$" + data.rate.toLocaleString("es-CL") + "/hr")}
          ${data.cliente    ? boletaRow("NOMBRE CLIENTE", data.cliente)    : ""}
          ${data.clienteTel ? boletaRow("TELÉFONO", data.clienteTel)       : ""}
        </div>

        ${data.notas ? `<div style="background:#181818;border:1px solid #2a2a2a;border-radius:10px;padding:14px;margin-bottom:16px;">
          <div style="font-size:9px;letter-spacing:.15em;color:#666;font-weight:700;margin-bottom:6px;">NOTAS</div>
          <div style="font-size:12px;color:#b0b0b0;line-height:1.5;">${_S.html(data.notas)}</div></div>` : ""}

        <div style="background:linear-gradient(135deg,rgba(212,160,23,.1),rgba(212,160,23,.04));
          border:1px solid rgba(212,160,23,.25);border-radius:12px;
          padding:18px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div>
            <div style="font-size:9px;letter-spacing:.18em;color:#D4A017;font-weight:700;">TOTAL A PAGAR</div>
            <div style="font-size:10px;color:#666;margin-top:4px;">IVA incluido · Pago acordado con el productor</div>
          </div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:#D4A017;line-height:1;">
            $${data.total.toLocaleString("es-CL")}<span style="font-size:14px;color:#666;"> CLP</span>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="${_S.url(data.waURL)}" target="_blank" rel="noopener noreferrer" style="
            flex:1;min-width:140px;background:#25D366;color:#000;
            font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;
            letter-spacing:.1em;border:none;border-radius:10px;padding:13px 16px;
            cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;"
            data-action="cerrarBoleta">
            <i class="ti ti-brand-whatsapp" style="font-size:18px;"></i> ENVIAR POR WHATSAPP
          </a>
          <button data-action="imprimirBoleta" style="background:#181818;color:#e8e8e8;
            font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:11px;
            letter-spacing:.1em;border:1px solid #333;border-radius:10px;padding:13px 16px;cursor:pointer;">
            <i class="ti ti-printer" style="font-size:16px;"></i> IMPRIMIR
          </button>
          <button data-action="cerrarBoleta" style="background:transparent;color:#666;
            font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;
            letter-spacing:.08em;border:1px solid #2a2a2a;border-radius:10px;padding:13px 16px;cursor:pointer;">
            CERRAR
          </button>
        </div>

        <div style="font-size:10px;color:#444;text-align:center;margin-top:16px;line-height:1.5;">
          Esta boleta es un comprobante de solicitud. La confirmación oficial<br>
          la recibirás directamente del productor por WhatsApp.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) cerrarBoleta(); });

  // FIX: onerror del avatar de boleta con addEventListener
  const boletaAvatarImg = overlay.querySelector("#boleta-avatar-img");
  if (boletaAvatarImg) {
    boletaAvatarImg.addEventListener("error", () => {
      const wrap = overlay.querySelector("#boleta-avatar-wrap");
      if (wrap) wrap.innerHTML = `<div style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:${safeColor};font-size:22px;">${safeEmoji}</div>`;
    });
  }
}

function boletaRow(label, value) {
  if (!value) return "";
  return `<div style="background:#181818;border:1px solid #2a2a2a;border-radius:8px;padding:12px 14px;">
    <div style="font-size:9px;letter-spacing:.14em;color:#555;font-weight:700;margin-bottom:4px;">${_S.html(label)}</div>
    <div style="font-size:13px;color:#e8e8e8;font-weight:500;">${_S.html(value)}</div>
  </div>`;
}

function cerrarBoleta() {
  document.getElementById("boleta-overlay")?.remove();
}
function imprimirBoleta() { window.print(); }

// ── BOOKING SELECT INIT ───────────────────────────────────────
// El value del <option> es el índice del productor en PRODUCERS[].
// La tarifa se obtiene de PRODUCERS[idx].priceVal en confirmarReserva(),
// haciendo imposible manipularla desde el DOM.
//
// FILTRO DINÁMICO:
// - Al cambiar servicio → se filtran productores que tienen ese serviceId
// - Al cambiar productor → se filtran servicios que ese productor ofrece
// - Si no hay serviceIds definidos en un productor, se muestra para todos

function _getProducersForService(svcId) {
  if (!svcId) return PRODUCERS;
  return PRODUCERS.filter(p => {
    // Si el productor no tiene serviceIds definidos, aparece en todos
    if (!Array.isArray(p.serviceIds) || p.serviceIds.length === 0) return true;
    return p.serviceIds.includes(svcId);
  });
}

function _getServicesForProducer(producerIdx) {
  const p = PRODUCERS[producerIdx];
  if (!p || !Array.isArray(p.serviceIds) || p.serviceIds.length === 0) {
    return window.SERVICES || [];
  }
  return (window.SERVICES || []).filter(s => p.serviceIds.includes(s.id));
}

function initBookingStudios() {
  const sel = document.getElementById("book-studio");
  if (!sel) return;
  sel.innerHTML = PRODUCERS.map((p, i) =>
    `<option value="${i}">${_S.html(p.name)} — ${_S.html(p.city)}</option>`
  ).join("");
}

function initBookingServices() {
  const sel = document.getElementById("book-service");
  if (!sel || !window.SERVICES) return;
  sel.innerHTML = SERVICES.map(s =>
    `<option value="${_S.html(s.id)}">${_S.html(s.label)} — ${s.type === "hourly" ? "tarifa/hr del productor" : "$" + s.fixedPrice.toLocaleString("es-CL") + " / " + s.unit}</option>`
  ).join("");
  updatePrice();
}

// ── FILTRO: al cambiar servicio, actualiza el select de productores ───────────
function _filterStudiosForService(svcId) {
  const sel = document.getElementById("book-studio");
  if (!sel) return;
  const prevValue = sel.value;
  const filtered  = _getProducersForService(svcId);

  sel.innerHTML = "";

  if (filtered.length === 0) {
    // Ningún productor disponible para este servicio
    const opt = document.createElement("option");
    opt.value    = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = "— Sin productores para este servicio —";
    sel.appendChild(opt);
    _showStudioFilterNotice(true, svcId);
    return;
  }

  filtered.forEach(p => {
    const realIdx = PRODUCERS.indexOf(p);
    const opt = document.createElement("option");
    opt.value = realIdx;
    opt.textContent = `${p.name} — ${p.city}`;
    sel.appendChild(opt);
  });

  // Intentar mantener la selección anterior si sigue disponible
  const stillAvailable = filtered.some(p => PRODUCERS.indexOf(p) === parseInt(prevValue));
  if (!stillAvailable) sel.selectedIndex = 0;

  const hasFilter = filtered.length < PRODUCERS.length;
  _showStudioFilterNotice(false, svcId, filtered.length, hasFilter);
  updatePrice();
}

// ── FILTRO: al cambiar productor, actualiza el select de servicios ────────────
function _filterServicesForProducer(producerIdx) {
  const sel = document.getElementById("book-service");
  if (!sel || !window.SERVICES) return;
  const prevValue = sel.value;
  const filtered  = _getServicesForProducer(producerIdx);

  sel.innerHTML = "";

  if (filtered.length === 0) {
    const opt = document.createElement("option");
    opt.value    = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = "— Sin servicios disponibles —";
    sel.appendChild(opt);
    return;
  }

  filtered.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.label} — ${s.type === "hourly" ? "tarifa/hr del productor" : "$" + s.fixedPrice.toLocaleString("es-CL") + " / " + s.unit}`;
    sel.appendChild(opt);
  });

  // Mantener servicio seleccionado si sigue disponible
  const stillAvailable = filtered.some(s => s.id === prevValue);
  if (stillAvailable) sel.value = prevValue;
  else sel.selectedIndex = 0;

  updatePrice();
}

// ── AVISO VISUAL de filtro activo ─────────────────────────────────────────────
function _showStudioFilterNotice(empty, svcId, count, hasFilter) {
  let notice = document.getElementById("book-studio-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "book-studio-notice";
    notice.style.cssText = `font-size:10px;margin-top:5px;line-height:1.4;transition:all .2s;`;
    const studioGroup = document.getElementById("book-studio")?.closest(".form-group");
    if (studioGroup) studioGroup.appendChild(notice);
  }
  if (empty) {
    notice.style.color = "#ef4444";
    const svc = (window.SERVICES || []).find(s => s.id === svcId);
    notice.textContent = `Ningún productor ofrece "${svc ? svc.label : svcId}". Elige otro servicio.`;
  } else if (hasFilter) {
    notice.style.color = "var(--gold)";
    notice.textContent = `★ Mostrando ${count} productor${count !== 1 ? "es" : ""} que ofrecen este servicio.`;
  } else {
    notice.textContent = "";
  }
}

// ── PRICE UPDATE ──────────────────────────────────────────────
// FIX: lee la tarifa desde PRODUCERS (fuente segura), no desde el value del select.
function updatePrice() {
  const studioSel  = document.getElementById("book-studio");
  const serviceSel = document.getElementById("book-service");
  const hoursSel   = document.getElementById("book-hours");
  const hoursGroup = document.getElementById("hours-group");
  const hoursRow   = document.getElementById("sum-hours-row");
  const el = id => document.getElementById(id);
  if (!studioSel || !serviceSel) return;

  const studioIdx  = _S.num(studioSel.value, 0);
  const producer   = PRODUCERS[studioIdx] || PRODUCERS[0];
  const studioRate = producer.priceVal || 35000;

  const svcId = _S.text(serviceSel.value);
  const svc = (window.SERVICES || []).find(s => s.id === svcId);
  if (!svc) return;
  const isHourly = svc.type === "hourly";
  const hours = _S.num(hoursSel?.value, 1) || 1;
  if (hoursGroup) hoursGroup.style.display = isHourly ? "" : "none";
  if (hoursRow)   hoursRow.style.display   = isHourly ? "" : "none";
  const rate  = isHourly ? studioRate : svc.fixedPrice;
  const total = isHourly ? rate * hours : rate;
  if (el("sum-rate-label")) el("sum-rate-label").textContent = isHourly ? "Tarifa del productor" : "Precio fijo (" + svc.unit + ")";
  if (el("sum-rate"))       el("sum-rate").textContent       = "$" + rate.toLocaleString("es-CL") + (isHourly ? "/hr" : "");
  if (el("sum-hours"))      el("sum-hours").textContent      = isHourly ? "× " + hours + " hora" + (hours > 1 ? "s" : "") : "precio fijo";
  if (el("sum-total"))      el("sum-total").textContent      = "$" + total.toLocaleString("es-CL");
  if (el("sum-note"))       el("sum-note").textContent       = isHourly
    ? "* Precio por hora según tarifa del productor. IVA incluido."
    : "* Precio fijo por " + svc.unit + ". IVA incluido.";
  let descText = svc.desc || "";
  if (svc.unit === "proyecto") descText += " · 📅 El plazo se calendariza con el productor.";
  if (el("book-service-desc")) el("book-service-desc").textContent = descText;
}

function reservarServicio(svcId) {
  // Navega a reservar y preselecciona el servicio, filtrando los productores
  showPage("reservar", document.querySelectorAll(".nav-btn")[3]);
  setTimeout(() => {
    // 1. Reset: todos los studios visibles
    initBookingStudios();
    // 2. Reset servicios y seleccionar el que corresponde
    initBookingServices();
    const sel = document.getElementById("book-service");
    if (sel) {
      const idx = Array.from(sel.options).findIndex(o => o.value === _S.text(svcId));
      if (idx >= 0) {
        sel.selectedIndex = idx;
        // 3. Filtrar productores para este servicio
        _filterStudiosForService(_S.text(svcId));
      } else {
        updatePrice();
      }
    }
  }, 60);
}

// ── STUDIO GALLERY ────────────────────────────────────────────
const _sgState = {};
function _sgGet(id) { return _sgState[id] || 0; }

function sgGoTo(studioId, idx) {
  const track = document.getElementById(`sg-track-${studioId}`);
  if (!track) return;
  const slides = track.querySelectorAll(".sg-slide");
  const total  = slides.length;
  if (!total) return;
  const i = ((idx % total) + total) % total;
  _sgState[studioId] = i;
  track.style.transform = `translateX(-${i * 100}%)`;
  document.querySelectorAll(`#sg-dots-${studioId} .sg-dot`).forEach((d, n) => d.classList.toggle("active", n === i));
}

function sgMove(studioId, dir) { sgGoTo(studioId, _sgGet(studioId) + dir); }

function sgLightbox(url, caption) {
  document.getElementById("sg-lightbox")?.remove();
  const safeUrl     = _S.url(url);
  const safeCaption = _S.html(caption);
  const lb = document.createElement("div");
  lb.id = "sg-lightbox";
  lb.innerHTML = `
    <div class="sg-lb-backdrop" data-action="removeLightbox"></div>
    <div class="sg-lb-box">
      <button class="sg-lb-close" data-action="removeLightboxById"><i class="ti ti-x"></i></button>
      <img src="${safeUrl}" alt="${safeCaption}" />
      <div class="sg-lb-caption">${safeCaption}</div>
    </div>`;
  document.body.appendChild(lb);
  requestAnimationFrame(() => lb.classList.add("open"));
  const esc = e => { if (e.key === "Escape") { lb.remove(); document.removeEventListener("keydown", esc); } };
  document.addEventListener("keydown", esc);
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initStats();
  renderActivity();
  renderProducers("all");
  renderStudios();
  initBookingStudios();
  initBookingServices();

  // Listeners de reserva con filtro dinámico bidireccional
  // Al cambiar SERVICIO → filtra qué productores lo ofrecen
  document.getElementById("book-service")?.addEventListener("change", () => {
    const svcId = document.getElementById("book-service")?.value;
    _filterStudiosForService(svcId);
  });

  // Al cambiar PRODUCTOR → filtra qué servicios ofrece ese productor
  document.getElementById("book-studio")?.addEventListener("change", () => {
    const idx = parseInt(document.getElementById("book-studio")?.value ?? "0");
    _filterServicesForProducer(isNaN(idx) ? 0 : idx);
  });

  document.getElementById("book-hours")?.addEventListener("change", updatePrice);

  // Inicializar aviso (por si el servicio default ya filtra)
  const initSvcId = document.getElementById("book-service")?.value;
  if (initSvcId) _filterStudiosForService(initSvcId);

  const dateInput = document.getElementById("book-date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  // Nav del sidebar: listener directo en cada botón — funciona en móvil web y app
  document.querySelectorAll(".nav-btn[data-action='navPage']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const page   = btn.dataset.page;
      const navIdx = parseInt(btn.dataset.nav ?? "0", 10);
      const navBtn = document.querySelectorAll(".nav-btn")[navIdx];
      showPage(page, navBtn || btn);
    });
  });

  document.getElementById("main")?.addEventListener("click", (e) => {
    // Solo cerrar si el click NO viene de un elemento interactivo
    if (!e.target.closest("[data-action]")) closeSidebar();
  });
  document.getElementById("sidebar-overlay")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("sidebar-overlay")) closeSidebar();
  });
  document.getElementById("sidebar-close")?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeSidebar();
      cerrarBoleta();
      document.getElementById("postula-modal")?.classList.remove("open");
    }
  });

  // Float subscribe btn — only show if not subscribed
  if (!localStorage.getItem("ivc_subscribed")) {
    const floatBtn = document.createElement("button");
    floatBtn.id = "sub-float-btn";
    floatBtn.innerHTML = `<i class="ti ti-bell"></i> SUSCRIBIRSE`;
    floatBtn.addEventListener("click", () => {
      if (typeof IVC_Subscribe !== "undefined") IVC_Subscribe.open();
    });
    document.body.appendChild(floatBtn);
  }

  const appBanner = document.getElementById("app-banner");
  if (appBanner) document.body.classList.add("has-banner");

  // Tab MENÚ — listener directo (ya no usa data-action)
  document.getElementById("hamburger")?.addEventListener("click", toggleSidebar);
});

// ── STATS DINÁMICOS ───────────────────────────────────────────
function initStats() {
  const total    = PRODUCERS.length;
  const regiones = [...new Set(PRODUCERS.map(p => p.region))].length;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("stat-estudios",       total);
  set("stat-productores",    total);
  set("stat-regiones",       regiones);
  set("sidebar-estudios",    total);
  set("sidebar-productores", total);
  set("prod-count",          total);
  _fetchSesiones();
}

async function _fetchSesiones() {
  try {
    const IVC = window._IVC_CONFIG;
    if (!IVC) return;
    const res = await fetch(
      `${IVC.SUPABASE_URL}/rest/v1/sesiones?select=count`,
      {
        headers: {
          "apikey": IVC.SUPABASE_ANON,
          "Authorization": `Bearer ${IVC.SUPABASE_ANON}`,
          "Prefer": "count=exact",
        },
      }
    );
    const range = res.headers.get("content-range") || "";
    const total = parseInt(range.split("/")[1]);
    if (!isNaN(total)) {
      const el = document.getElementById("stat-sesiones");
      if (el) el.textContent = total;
    }
  } catch (_) {}
}

async function _incrementSesiones() {
  try {
    const IVC = window._IVC_CONFIG;
    if (!IVC) return;
    await fetch(
      `${IVC.SUPABASE_URL}/rest/v1/sesiones`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": IVC.SUPABASE_ANON,
          "Authorization": `Bearer ${IVC.SUPABASE_ANON}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ created_at: new Date().toISOString() }),
      }
    );
    _fetchSesiones();
  } catch (_) {}
}

// ── EVENT DELEGATION ──────────────────────────────────────────
document.addEventListener("click", function(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const id     = _S.num(el.dataset.id, 0);
  const idx    = _S.num(el.dataset.idx, 0);

  switch (action) {
    case "selectStudio":
      if (el.dataset.tab === "true") {
        selectStudio(id, el);
      } else {
        selectStudio(id);
      }
      break;

    case "prefillAndReservar":
      e.preventDefault();
      prefillBooking(id);
      showPage("reservar", document.querySelectorAll(".nav-btn")[3]);
      break;

    case "showProductores":
      showPage("productores", document.querySelectorAll(".nav-btn")[1]);
      break;

    case "sgLightbox": {
      const url     = el.dataset.url     || "";
      const caption = el.dataset.caption || "";
      sgLightbox(_S.url(url), _S.html(caption));
      break;
    }

    case "sgPrev":
      sgMove(idx, -1);
      break;

    case "sgNext":
      sgMove(idx, 1);
      break;

    case "sgDot":
      sgGoTo(idx, _S.num(el.dataset.dot, 0));
      break;

    case "cerrarBoleta":
      cerrarBoleta();
      break;

    case "imprimirBoleta":
      imprimirBoleta();
      break;

    case "removeLightbox":
      el.parentElement?.remove();
      break;

    case "removeLightboxById":
      document.getElementById("sg-lightbox")?.remove();
      break;

    case "navPage": {
      const navIdx = _S.num(el.dataset.nav, 0);
      const navBtn = document.querySelectorAll(".nav-btn")[navIdx];
      showPage(el.dataset.page, navBtn || el);
      break;
    }
    case "gotoPage": {
      const navIdx = _S.num(el.dataset.nav, 0);
      showPage(el.dataset.page, document.querySelectorAll(".nav-btn")[navIdx]);
      break;
    }
    case "toggleSidebar":
      toggleSidebar();
      break;

    case "filter":
      filterProducers(el.dataset.filter, el);
      break;

    case "confirmarReserva":
      confirmarReserva();
      break;

    case "reservarServicio":
      if (typeof reservarServicio === "function") reservarServicio(el.dataset.svc);
      break;

    case "openPostulaModal":
      if (typeof openPostulaModal === "function") openPostulaModal();
      break;

    case "closePostulaModal":
      if (typeof closePostulaModal === "function") closePostulaModal();
      break;

    case "closePostulaBackdrop":
      if (typeof closePostulaModalBackdrop === "function") closePostulaModalBackdrop(e);
      break;
  }
});

// ── RENDER PRICES FROM DATA ───────────────────────────────────
// Lee los fixedPrice de SERVICES y los escribe en los elementos
// con id="price-{serviceId}" en las páginas Videoclips y Diseño.
// Así un solo cambio en data.js actualiza todo.
function renderStaticPrices() {
  if (!window.SERVICES) return;
  window.SERVICES.forEach(svc => {
    const el = document.getElementById("price-" + svc.id);
    if (!el) return;
    if (svc.fixedPrice != null) {
      el.textContent = "$" + svc.fixedPrice.toLocaleString("es-CL");
    }
  });
}

document.addEventListener("DOMContentLoaded", renderStaticPrices);
