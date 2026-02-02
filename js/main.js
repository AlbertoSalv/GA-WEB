/* =========================================================
   GA WEB — main.js (PRO)
   - Intro sobre + fadeIn (animate.css)
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
  const pad2 = (n) => String(n).padStart(2, "0");
  const pad3 = (n) => String(n).padStart(3, "0");

  function lockScroll() {
    document.documentElement.style.overflow = "hidden";
  }
  function unlockScroll() {
    document.documentElement.style.overflow = "";
  }

  // =========================================================
  // 1) INTRO (SOBRE) -> mostrar sitio + fadeIn animate.css
  // =========================================================
  const intro = $("#intro");
  const openBtn = $("#openEnvelope");
  const site = $("#site");

  let isOpening = false;

  if (intro) lockScroll();

  function applyFadeInToHero() {
    // Usamos animate.css si está cargado.
    // (si no lo está, no rompe nada)
    const heroText = $(".heroText");
    const heroPhoto = $(".heroPhoto--full");

    const apply = (el) => {
      if (!el) return;
      el.classList.remove("animate__animated", "animate__fadeIn");
      // reflow para reiniciar animación
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.classList.add("animate__animated", "animate__fadeIn");
      el.classList.add("animate__faster");
    };

    if (!prefersReducedMotion) {
      apply(heroPhoto);
      apply(heroText);
    }
  }

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
          unlockScroll();

          requestAnimationFrame(() => {
            site.style.opacity = "1";
            applyFadeInToHero();
          });

          window.scrollTo(0, 0);
        }, 520);
      }, 750);
    });
  }

  // =========================================================
  // 2) COUNTDOWN exacta Europe/Madrid (fix 1h robusto)
  // =========================================================
  const countdownWrap = $("#countdown");

  const EVENT = {
    year: 2026,
    month: 6,   // 1..12
    day: 26,
    hour: 19,
    minute: 0,
    second: 0,
    timeZone: "Europe/Madrid"
  };

  /**
   * Convierte "fecha/hora local en timeZone" a UTC ms de forma robusta.
   * Método:
   * 1) Partimos de un guess UTC con esos componentes.
   * 2) Vemos qué hora sería ese guess en timeZone.
   * 3) Ajustamos por la diferencia.
   *
   * Evita el bug típico del +1h en cambios DST.
   */
  function tzDateToUtcMs({ year, month, day, hour, minute, second, timeZone }) {
    const guess = Date.UTC(year, month - 1, day, hour, minute, second);

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

    const parts = dtf.formatToParts(new Date(guess));
    const map = {};
    for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;

    let y = Number(map.year);
    let mo = Number(map.month);
    let d = Number(map.day);
    let h = Number(map.hour);
    let mi = Number(map.minute);
    let s = Number(map.second);

    // Normaliza "24:xx" si ocurriera
    if (h === 24) {
      h = 0;
      const tmp = new Date(Date.UTC(y, mo - 1, d, 0, mi, s));
      tmp.setUTCDate(tmp.getUTCDate() + 1);
      y = tmp.getUTCFullYear();
      mo = tmp.getUTCMonth() + 1;
      d = tmp.getUTCDate();
    }

    // "guess" visto en TZ convertido a UTC ms
    const asTZ = Date.UTC(y, mo - 1, d, h, mi, s);

    // Diferencia entre lo que queríamos (componentes) y lo que resulta en TZ
    const diff = asTZ - guess;

    // Ajuste final: restar diff
    return guess - diff;
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

  // =========================================================
  // 3) Timeline line draw (stroke-dash)
  // =========================================================
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

  // =========================================================
  // 4) RSVP desplegable + estado recibido
  // =========================================================
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
    // si modal abierto, lo gestiona el handler del modal
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

  // =========================================================
  // 5) Música (toggle) — UI REAL, sin “ON falso”
  // =========================================================
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
    // Estado inicial: no reproducimos nunca.
    // UI inicial: OFF siempre (evita ON falso). Cuando hagan click, ya se pone bien.
    setMusicUI(false);

    musicBtn.addEventListener("click", async () => {
      const canPlayNow = hasAudioSource(bgMusic);

      if (!canPlayNow) {
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
        setMusicUI(false);
        saveMusicPref(false);
      }
    });

    // Si el audio cambia de estado por el navegador, reflejamos UI
    bgMusic.addEventListener("pause", () => setMusicUI(false));
    bgMusic.addEventListener("play", () => setMusicUI(true));

    // Si en algún momento quieres “recordar” preferencia:
    // Solo intentamos reanudar cuando el usuario haga su primer click en la página.
    const wantsOn = loadMusicPref();
    if (wantsOn && hasAudioSource(bgMusic)) {
      const once = async () => {
        document.removeEventListener("pointerdown", once);
        try {
          await bgMusic.play();
          setMusicUI(true);
        } catch {
          setMusicUI(false);
          saveMusicPref(false);
        }
      };
      document.addEventListener("pointerdown", once, { once: true });
    }
  }

  // =========================================================
  // 6) Microparallax (hero + countdown, desktop, suave)
  // =========================================================
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
      const x = (lastX - rect.left) / rect.width;
      const y = (lastY - rect.top) / rect.height;
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

  createMicroParallax({
    rootSel: ".heroPhoto--full",
    targetSel: ".heroPhoto__bg",
    scale: 1.06,
    strength: 10
  });

  createMicroParallax({
    rootSel: "#faltan",
    targetSel: "#countdown .cdChip",
    scale: 1.00,
    strength: 6
  });

  // =========================================================
  // 7) Add to Calendar (.ics) — compatible
  // =========================================================
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
    // 19:00–23:30 Madrid
    const startUtcMs = tzDateToUtcMs({ ...EVENT, hour: 19, minute: 0, second: 0 });
    const endUtcMs = tzDateToUtcMs({ ...EVENT, hour: 23, minute: 30, second: 0 });

    const dtStamp = toICSDateUTC(new Date());
    const dtStart = toICSDateUTC(new Date(startUtcMs));
    const dtEnd = toICSDateUTC(new Date(endUtcMs));

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

  // =========================================================
  // 8) Modal (Dress/Bus/Tips/Save + Galería)
  // =========================================================
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

    lockScroll();
    if (closeBtn) window.setTimeout(() => closeBtn.focus(), 0);
  }

  function openModal(key, openerEl = null) {
    openModalHTML(modalTemplates[key] || "<p>Contenido no disponible.</p>", openerEl);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    unlockScroll();

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      window.setTimeout(() => lastFocusedEl.focus(), 0);
    }
    lastFocusedEl = null;

    if (modalContent) modalContent.innerHTML = "";
  }

  $$("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal, btn));
  });

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

  if (modal) {
    modal.addEventListener("click", (e) => {
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
