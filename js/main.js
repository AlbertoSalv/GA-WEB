/* =========================================================
   GA WEB — main.js (PRO)
   - Intro sobre
   - Countdown exacta: 26/06/2026 19:00 Europe/Madrid (aunque el invitado esté fuera)
   - RSVP: abre/cierra + estado “recibido” (modo demo)
   - Timeline: línea se dibuja al entrar en pantalla (stroke-dash)
   - Música: toggle sin autoplay + estado real (sin “ON falso”)
   - Microparallax suave (hero + countdown, solo desktop)
   - Modales accesibles + Galería click-to-open (imagen contain, no recorta)
   - Add to Calendar (.ics) compatible
   - Guardar web
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isCoarsePointer = window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  // Helpers
  function pad2(n) { return String(n).padStart(2, "0"); }
  function pad3(n) { return String(n).padStart(3, "0"); }

  // ===============================
  // Intro (Sobre) -> mostrar sitio
  // ===============================
  const intro = $("#intro");
  const openBtn = $("#openEnvelope");
  const site = $("#site");

  let isOpening = false;

  if (intro) document.documentElement.style.overflow = "hidden";

  if (openBtn && intro && site) {
    openBtn.addEventListener("click", () => {
      if (isOpening) return;
      isOpening = true;

      intro.classList.add("intro--open");
      site.style.opacity = "0";
      site.classList.remove("site--hidden");

      window.setTimeout(() => {
        intro.classList.add("intro--closing");

        window.setTimeout(() => {
          intro.style.display = "none";
          document.documentElement.style.overflow = "";

          requestAnimationFrame(() => {
            site.style.opacity = "1";
          });

          window.scrollTo(0, 0);
        }, 520);
      }, 750);
    });
  }

  // ===============================
  // Countdown exacta Europe/Madrid
  // ===============================
  const countdownWrap = $("#countdown");

  // Evento fijo en Madrid:
  const EVENT = {
    year: 2026,
    month: 6,   // 1..12
    day: 26,
    hour: 19,
    minute: 0,
    second: 0,
    timeZone: "Europe/Madrid"
  };

  // Devuelve partes de una fecha interpretada en timeZone (sin literales).
  function formatPartsInTZ(date, timeZone) {
    // en-GB tiende a ser más estable con 24h
    const dtf = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const parts = dtf.formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }
    return map;
  }

  // Offset (ms) de timeZone respecto a UTC para un instante (date)
  function getTimeZoneOffsetMs(date, timeZone) {
    const parts = formatPartsInTZ(date, timeZone);

    // Algunos motores pueden devolver hour="24" en casos límite: normalizamos.
    let y = Number(parts.year);
    let mo = Number(parts.month);
    let d = Number(parts.day);
    let h = Number(parts.hour);
    let mi = Number(parts.minute);
    let s = Number(parts.second);

    if (h === 24) {
      h = 0;
      // sumar 1 día en UTC (lo más simple: crear un Date UTC y añadir un día)
      const tmp = new Date(Date.UTC(y, mo - 1, d, 0, mi, s));
      tmp.setUTCDate(tmp.getUTCDate() + 1);
      y = tmp.getUTCFullYear();
      mo = tmp.getUTCMonth() + 1;
      d = tmp.getUTCDate();
    }

    // "Como se vería date en Madrid" convertido a UTC
    const asTZ = Date.UTC(y, mo - 1, d, h, mi, s);
    const utc = date.getTime();

    // offset = (hora en TZ) - (hora en UTC)
    return asTZ - utc;
  }

  // Convierte una fecha/hora en Europe/Madrid a timestamp UTC (ms)
  function tzDateToUtcMs({ year, month, day, hour, minute, second, timeZone }) {
    // 1) creamos un "guess" en UTC con esos componentes
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

    // 2) calculamos offset real del TZ en ese instante guess
    const offsetMs = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);

    // 3) para que "Madrid 19:00" sea correcto: restamos offset
    return utcGuess - offsetMs;
  }

  const targetUtcMs = tzDateToUtcMs(EVENT);

  function tickCountdown() {
    if (!countdownWrap) return;

    const dEl = $('[data-cd="days"]', countdownWrap);
    const hEl = $('[data-cd="hours"]', countdownWrap);
    const mEl = $('[data-cd="mins"]', countdownWrap);
    const sEl = $('[data-cd="secs"]', countdownWrap);

    if (!dEl || !hEl || !mEl || !sEl) return;

    const nowMs = Date.now();
    let diff = targetUtcMs - nowMs;
    if (diff < 0) diff = 0;

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    dEl.textContent = pad3(days);
    hEl.textContent = pad2(hours);
    mEl.textContent = pad2(mins);
    sEl.textContent = pad2(secs);
  }

  tickCountdown();
  const startDelay = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
  }, startDelay);

  // ===============================
  // Timeline line draw (stroke-dash)
  // ===============================
  const timeline = $("#timeline");
  if (timeline && "IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        timeline.classList.add("is-drawn");
        io.disconnect();
      });
    }, { threshold: 0.25 });
    io.observe(timeline);
  } else if (timeline) {
    timeline.classList.add("is-drawn");
  }

  // ===============================
  // RSVP desplegable + estado recibido
  // ===============================
  const rsvpToggle = $("#rsvpToggle");
  const rsvpPanel = $("#rsvpPanel");
  const rsvpForm = $("#rsvpForm");
  const rsvpCloseBtn = $("#rsvpCloseBtn");
  const rsvpStatus = $("#rsvpStatus");

  function openRSVP({ scrollIntoView = false } = {}) {
    if (!rsvpPanel) return;

    rsvpPanel.classList.add("is-open");
    rsvpPanel.setAttribute("aria-hidden", "false");
    if (rsvpToggle) rsvpToggle.setAttribute("aria-expanded", "true");

    if (scrollIntoView) {
      const top = rsvpPanel.getBoundingClientRect().top + window.pageYOffset - 12;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    const firstInput = $("input, select, textarea", rsvpPanel);
    if (firstInput) window.setTimeout(() => firstInput.focus(), 80);
  }

  function closeRSVP() {
    if (!rsvpPanel) return;
    rsvpPanel.classList.remove("is-open");
    rsvpPanel.setAttribute("aria-hidden", "true");
    if (rsvpToggle) rsvpToggle.setAttribute("aria-expanded", "false");
  }

  if (rsvpToggle && rsvpPanel) {
    rsvpToggle.addEventListener("click", () => {
      const isOpen = rsvpPanel.classList.contains("is-open");
      if (isOpen) closeRSVP();
      else openRSVP();
    });
  }
  if (rsvpCloseBtn) rsvpCloseBtn.addEventListener("click", closeRSVP);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (rsvpPanel && rsvpPanel.classList.contains("is-open")) closeRSVP();
  });

  function setRSVPStatus(msg) {
    if (!rsvpStatus) return;
    rsvpStatus.textContent = msg;
    rsvpStatus.classList.add("is-ok");
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", (e) => {
      const action = (rsvpForm.getAttribute("action") || "").trim();
      const isPlaceholder = action === "" || action === "#";

      if (isPlaceholder) {
        e.preventDefault();
        setRSVPStatus("✅ ¡Recibido! Gracias por confirmarlo. (Modo demo: después lo conectamos para que llegue de verdad)");
        closeRSVP();

        try { rsvpForm.reset(); } catch {}
      }
    });
  }

  // Footer link abre RSVP
  const footerRSVPLink = $("#footerRSVPLink");
  if (footerRSVPLink) {
    footerRSVPLink.addEventListener("click", (e) => {
      e.preventDefault();
      openRSVP({ scrollIntoView: true });
    });
  }

  // ===============================
  // Música (toggle) — solo suena con click, UI real
  // ===============================
  const musicBtn = $("#musicToggle");
  const bgMusic = $("#bgMusic");
  const MUSIC_KEY = "gaweb_music_on";

  function hasAudioSource(audioEl) {
    if (!audioEl) return false;
    const srcAttr = (audioEl.getAttribute("src") || "").trim();
    if (srcAttr) return true;
    const source = audioEl.querySelector("source");
    return !!(source && (source.getAttribute("src") || "").trim());
  }

  function setMusicUI(on) {
    if (!musicBtn) return;
    musicBtn.classList.toggle("is-on", on);
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pausar música" : "Activar música");
  }

  function saveMusicPref(on) {
    try { localStorage.setItem(MUSIC_KEY, on ? "1" : "0"); } catch {}
  }

  function loadMusicPref() {
    try { return localStorage.getItem(MUSIC_KEY) === "1"; } catch { return false; }
  }

  if (musicBtn && bgMusic) {
    // Estado inicial: nunca reproducimos, solo UI si hay source y pref guardada
    const canPlay = hasAudioSource(bgMusic);
    const wantsOn = loadMusicPref();

    setMusicUI(!!(canPlay && wantsOn && !bgMusic.paused));

    musicBtn.addEventListener("click", async () => {
      const canPlayNow = hasAudioSource(bgMusic);

      if (!canPlayNow) {
        // No hay canción cargada todavía
        setMusicUI(false);
        saveMusicPref(false);
        return;
      }

      try {
        if (bgMusic.paused) {
          await bgMusic.play();
          setMusicUI(true);
          saveMusicPref(true);
        } else {
          bgMusic.pause();
          setMusicUI(false);
          saveMusicPref(false);
        }
      } catch {
        // Bloqueo del navegador o error
        setMusicUI(false);
        saveMusicPref(false);
      }
    });

    bgMusic.addEventListener("pause", () => setMusicUI(false));
    bgMusic.addEventListener("play", () => setMusicUI(true));
  }

  // ===============================
  // Microparallax (hero + countdown, desktop, suave)
  // ===============================
  function createMicroParallax({ rootSel, targetSel, scale = 1.06, strength = 10 }) {
    const root = $(rootSel);
    if (!root || prefersReducedMotion || isCoarsePointer) return;

    const target = targetSel ? $(targetSel, root) : root;
    if (!target) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    function apply() {
      raf = 0;
      const rect = root.getBoundingClientRect();

      const x = (lastX - rect.left) / rect.width;  // 0..1
      const y = (lastY - rect.top) / rect.height;  // 0..1

      const tx = (x - 0.5) * strength;
      const ty = (y - 0.5) * strength;

      target.style.transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
    }

    function onMove(e) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(apply);
    }

    function reset() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      target.style.transform = `scale(${scale}) translate(0px, 0px)`;
    }

    if (window.matchMedia && window.matchMedia("(min-width: 980px)").matches) {
      root.addEventListener("mousemove", onMove);
      root.addEventListener("mouseleave", reset);
    }
  }

  // Hero: movemos el fondo blur suavemente
  createMicroParallax({
    rootSel: ".heroPhoto--full",
    targetSel: ".heroPhoto__bg",
    scale: 1.06,
    strength: 10
  });

  // Countdown: micro (muy sutil) en el chip completo
  createMicroParallax({
    rootSel: "#faltan",
    targetSel: "#countdown .cdChip",
    scale: 1.00,
    strength: 6
  });

  // ===============================
  // Add to Calendar (.ics) — compatible
  // ===============================
  const addToCal = $("#addToCalendarLink");

  const eventTitle = "Boda de Gema & Alberto";
  const eventLocation = "El Hueco Bodas y Banquetes · Valladolid";
  const eventDescription =
    "Boda de Gema y Alberto.\n\nCeremonia: 19:00 — El Hueco.\nCelebración: 20:00 — El Hueco.\n\n¡Nos vemos allí!";

  function toICSDateUTC(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
  }

  function escapeICS(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function downloadICS() {
    // Evento: 19:00–23:30 Madrid (más realista y útil)
    const startUtcMs = tzDateToUtcMs({ ...EVENT, minute: 0, second: 0 });
    const endUtcMs = tzDateToUtcMs({ ...EVENT, hour: 23, minute: 30, second: 0 });

    const startUtc = new Date(startUtcMs);
    const endUtc = new Date(endUtcMs);

    const dtStamp = toICSDateUTC(new Date());
    const dtStart = toICSDateUTC(startUtc);
    const dtEnd = toICSDateUTC(endUtc);

    const uid = `gaweb-${EVENT.year}${pad2(EVENT.month)}${pad2(EVENT.day)}-${Date.now()}@ga-web`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GA WEB//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeICS("Boda Gema & Alberto")}`,
      `X-WR-TIMEZONE:${EVENT.timeZone}`,
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(eventTitle)}`,
      `LOCATION:${escapeICS(eventLocation)}`,
      `DESCRIPTION:${escapeICS(eventDescription)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Gema-y-Alberto-26-06-2026.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  if (addToCal) {
    addToCal.addEventListener("click", (e) => {
      e.preventDefault();
      downloadICS();
    });
  }

  // ===============================
  // Modal (Dress/Bus/Tips/Save + Galería)
  // ===============================
  const modal = $("#modal");
  const modalContent = $("#modalContent");
  const closeBtn = modal ? $(".modal__close", modal) : null;

  let lastFocusedEl = null;

  const modalTemplates = {
    dress: `
      <h2>Dress Code</h2>
      <p>Sin etiqueta. Ven cómodo y con tu estilo, con un toque arreglado.</p>
      <p><strong>Evita el blanco</strong> para no coincidir con la novia.</p>
    `,
    bus: `
      <h2>Autobús</h2>
      <p>Horarios y paradas (pendiente de confirmar). Aquí pondremos toda la info.</p>
    `,
    tips: `
      <h2>Tips y notas</h2>
      <p>Información adicional: alojamientos, recomendaciones, etc.</p>
    `,
    save: `
      <h2>Guardar la web</h2>
      <p>Así la tendrás como si fuera una app:</p>
      <p><strong>iPhone (Safari):</strong> Compartir → “Añadir a pantalla de inicio”.</p>
      <p><strong>Android (Chrome):</strong> Menú (⋮) → “Añadir a pantalla de inicio”.</p>
      <p><strong>PC:</strong> añade a marcadores (⭐) para tenerla a mano.</p>
    `
  };

  function getFocusable(container) {
    return $$(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function openModalHTML(html, openerEl = null) {
    if (!modal || !modalContent) return;

    lastFocusedEl = openerEl || document.activeElement;

    modalContent.innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (closeBtn) window.setTimeout(() => closeBtn.focus(), 0);
  }

  function openModal(key, openerEl = null) {
    openModalHTML(modalTemplates[key] || "<p>Contenido no disponible.</p>", openerEl);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      window.setTimeout(() => lastFocusedEl.focus(), 0);
    }
    lastFocusedEl = null;

    if (modalContent) modalContent.innerHTML = "";
  }

  // Botones de cards (dress/bus/tips)
  $$("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal, btn));
  });

  // Guardar web (footer)
  const saveToHomeLink = $("#saveToHomeLink");
  if (saveToHomeLink) {
    saveToHomeLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal("save", saveToHomeLink);
    });
  }

  // Galería: click -> modal con imagen grande (usa data-full si existe)
  const galleryImages = $$(".galleryItem img");
  if (galleryImages.length) {
    galleryImages.forEach((img) => {
      img.addEventListener("click", () => {
        const full = (img.getAttribute("data-full") || "").trim();
        const src = full || img.getAttribute("src");
        const alt = img.getAttribute("alt") || "Imagen";
        const html = `
          <h2>Galería</h2>
          <p style="margin-top:6px; color: rgba(22,22,22,.62);">${alt}</p>
          <img class="modalImage" src="${src}" alt="${alt}">
        `;
        openModalHTML(html, img);
      });
    });
  }

  // Click fuera / cerrar
  if (modal) {
    modal.addEventListener("click", (e) => {
      // Cierra si clic en backdrop o en elementos con data-close
      const t = e.target;
      if (!t) return;
      if (t.hasAttribute("data-close") || t.classList.contains("modal__backdrop")) {
        closeModal();
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  // Trap focus + ESC
  document.addEventListener("keydown", (e) => {
    if (!modal || !modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const panel = $(".modal__panel", modal);
      if (!panel) return;

      const focusables = getFocusable(panel);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

})();
