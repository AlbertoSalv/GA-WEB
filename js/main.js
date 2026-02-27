/* =========================================================
   GA WEB — main.js (PRO) — FIX + OPTIMIZADO (2026) — V2
   ✅ Incluye TODO lo hablado + arregla el “código pegado dentro del keydown”
   - Intro sobre + fadeIn (animate.css)
   - Countdown exacta: 26/06/2026 19:00 Europe/Madrid
   - RSVP: abre/cierra + estado “recibido” (modo demo)
   - Timeline:
       • línea se dibuja al entrar en pantalla
       • items reveal on-viewport (premium)
       • iconos Lottie: carga ligera + play once al entrar (fallback emoji)
   - Música: toggle sin autoplay + estado real
   - Microparallax suave (hero + countdown, solo desktop)
   - Modales accesibles + click-to-open (galería + cubo) + scroll-lock robusto
   - Galería:
       • drag-to-scroll pro (mouse + touch)
       • flechas (desktop) por “paso” de tarjeta
       • evita “click fantasma” tras drag (abre imagen solo si fue click real)
   - Cubo:
       • drag rotate (mouse + touch) + inercia + auto-rotate
       • click en caras abre modal (y no se rompe por drag)
   - Add to Calendar (.ics)
   ========================================================= */

(() => {
  "use strict";

  // =========================================================
  // Utils
  // =========================================================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion =
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const isCoarsePointer =
    !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  const pad2 = (n) => String(n).padStart(2, "0");
  const pad3 = (n) => String(n).padStart(3, "0");

  // =========================================================
  // Scroll lock robusto (para modal/intro)
  // =========================================================
  let scrollLockCount = 0;
  let savedScrollY = 0;

  function lockScroll() {
    scrollLockCount += 1;
    if (scrollLockCount > 1) return;

    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount !== 0) return;

    const top = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    const y = top ? Math.abs(parseInt(top, 10)) : savedScrollY;
    window.scrollTo(0, y || 0);
  }

  // =========================================================
  // 1) INTRO (SOBRE)
  // =========================================================
  const intro = $("#intro");
  const openBtn = $("#openEnvelope");
  const site = $("#site");

  let isOpening = false;

  if (intro) lockScroll();

  function applyFadeInToHero() {
    if (prefersReducedMotion) return;

    const heroText = $(".heroText");
    const heroPhoto = $(".heroPhoto--full");

    const apply = (el) => {
      if (!el) return;
      el.classList.remove("animate__animated", "animate__fadeIn", "animate__faster");
      // reflow para reiniciar animación
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.classList.add("animate__animated", "animate__fadeIn", "animate__faster");
    };

    apply(heroPhoto);
    apply(heroText);
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
  // 2) COUNTDOWN Europe/Madrid (robusto DST)
  // =========================================================
  const countdownWrap = $("#countdown");

  const EVENT = {
    year: 2026,
    month: 6,
    day: 26,
    hour: 19,
    minute: 0,
    second: 0,
    timeZone: "Europe/Madrid"
  };

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
    const mi = Number(map.minute);
    const s = Number(map.second);

    // Corrección 24:xx
    if (h === 24) {
      h = 0;
      const tmp = new Date(Date.UTC(y, mo - 1, d, 0, mi, s));
      tmp.setUTCDate(tmp.getUTCDate() + 1);
      y = tmp.getUTCFullYear();
      mo = tmp.getUTCMonth() + 1;
      d = tmp.getUTCDate();
    }

    const asTZ = Date.UTC(y, mo - 1, d, h, mi, s);
    const diff = asTZ - guess;
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
  // 3) Timeline (line draw + item reveal + Lottie icons)
  // =========================================================
  const timeline = $("#timeline");

  // 3.1) Línea se dibuja al entrar
  if (timeline && "IntersectionObserver" in window && !prefersReducedMotion) {
    const ioLine = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          timeline.classList.add("is-drawn");
          ioLine.disconnect();
          break;
        }
      },
      { threshold: 0.25 }
    );
    ioLine.observe(timeline);
  } else if (timeline) {
    timeline.classList.add("is-drawn");
  }

  // 3.2) Items: reveal premium + play once Lottie al entrar
  function initTimelineLottieAndReveal() {
    if (!timeline) return;

    const items = $$("[data-tl-item]", timeline);
    const lottieHolders = $$("[data-lottie]", timeline);

    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      timeline.classList.remove("is-ready");
      items.forEach((it) => it.classList.add("is-in"));
      return;
    }

    timeline.classList.add("is-ready");

    const hasLottieLib =
      typeof window.lottie !== "undefined" &&
      window.lottie &&
      typeof window.lottie.loadAnimation === "function";

    const instances = new Map();

    if (hasLottieLib && lottieHolders.length) {
      lottieHolders.forEach((holder) => {
        const path = (holder.getAttribute("data-lottie") || "").trim();
        if (!path) return;

        const loop = holder.getAttribute("data-loop") === "true";
        const autoplay = holder.getAttribute("data-autoplay") === "true";

        try {
          const anim = window.lottie.loadAnimation({
            container: holder,
            renderer: "svg",
            loop,
            autoplay,
            path,
            rendererSettings: {
              progressiveLoad: true,
              preserveAspectRatio: "xMidYMid meet"
            }
          });

          anim.goToAndStop(0, true);
          instances.set(holder, anim);

          const dot = holder.closest(".tDot");
          if (dot) dot.classList.add("has-lottie");
        } catch {
          // fallback emoji
        }
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const item = entry.target;

          item.classList.add("is-in");

          const holder = $("[data-lottie]", item);
          const anim = holder ? instances.get(holder) : null;

          if (anim && !item.dataset.played) {
            item.dataset.played = "1";
            anim.stop();
            anim.play();
          }

          io.unobserve(item);
        });
      },
      {
        threshold: 0.45,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    items.forEach((it) => io.observe(it));
  }

  initTimelineLottieAndReveal();

  // =========================================================
// 4) RSVP (con honeypot anti-bots)
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

function toggleRSVP({ scrollIntoView = false } = {}) {
  if (!rsvpPanel) return;
  const isOpen = rsvpPanel.classList.contains("is-open");
  if (isOpen) closeRSVP();
  else openRSVP({ scrollIntoView });
}

if (rsvpToggle && rsvpPanel) {
  rsvpToggle.addEventListener("click", () => toggleRSVP({ scrollIntoView: true }));
}
if (rsvpCloseBtn) rsvpCloseBtn.addEventListener("click", closeRSVP);

function setRSVPStatus(msg, ok = true) {
  if (!rsvpStatus) return;
  rsvpStatus.textContent = msg;
  rsvpStatus.classList.toggle("is-ok", ok);
}

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const action = (rsvpForm.getAttribute("action") || "").trim();
    if (!action || action === "#") {
      setRSVPStatus("⚠️ Falta conectar el formulario (action).", false);
      return;
    }

    // ✅ Honeypot anti-bots (campo invisible "website")
    const hp = rsvpForm.querySelector('input[name="website"]');
    if (hp && (hp.value || "").trim().length > 0) {
      // Simulamos éxito para que el bot “crea” que ha enviado
      setRSVPStatus("✅ ¡Recibido! Gracias por confirmarlo. Te esperamos 💓", true);
      closeRSVP();
      try { rsvpForm.reset(); } catch {}
      return;
    }

    // Datos del formulario
    const fd = new FormData(rsvpForm);
    const payload = Object.fromEntries(fd.entries());

    // (Opcional) eliminamos el honeypot del payload para no ensuciar la hoja
    delete payload.website;

    // Botón enviar (bloquear mientras envía)
    const submitBtn = rsvpForm.querySelector('button[type="submit"]');
    const prevText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando…";
    }

    try {
      await fetch(action, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      setRSVPStatus("✅ ¡Recibido! Gracias por confirmarlo. Te esperamos 💓", true);
      closeRSVP();
      try { rsvpForm.reset(); } catch {}
    } catch (err) {
      setRSVPStatus("❌ No se pudo enviar. Prueba de nuevo en unos segundos.", false);
      // console.error(err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevText || "Enviar";
      }
    }
  });
}

  // =========================================================
  // 5) Música (toggle)
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
  musicBtn.textContent = on ? "♫" : "♪";
}

  function saveMusicPref(on) {
    try { localStorage.setItem(MUSIC_KEY, on ? "1" : "0"); } catch {}
  }
  function loadMusicPref() {
    try { return localStorage.getItem(MUSIC_KEY) === "1"; } catch { return false; }
  }

  if (musicBtn && bgMusic) {
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

    bgMusic.addEventListener("pause", () => setMusicUI(false));
    bgMusic.addEventListener("play", () => setMusicUI(true));

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
  // 6) Microparallax (desktop, suave)
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
    scale: 1.0,
    strength: 6
  });

  // =========================================================
  // 7) Add to Calendar (.ics)
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
    const startUtcMs = tzDateToUtcMs({ ...EVENT, hour: 19, minute: 0, second: 0 });

    const endUtcMs = tzDateToUtcMs({
      year: 2026, month: 6, day: 27, hour: 2, minute: 0, second: 0, timeZone: EVENT.timeZone
    });

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
  // 8) MODAL + click-to-open (galería + cubo)
  // =========================================================
  const modal = $("#modal");
  const modalContent = $("#modalContent");
  const closeBtn = modal ? $(".modal__close", modal) : null;
  let lastFocusedEl = null;

  const modalTemplates = {
    dress: `
      <h2>Dress Code</h2>
      <p>Sin etiqueta. Ven cómodo y con tu estilo, pero añade un toque elegante.</p>
      <p><strong>Evita el blanco</strong> para no coincidir con la novia.</p>
    `,
    bus: `
      <h2>Autobús</h2>
      <p>Horarios y paradas (pendiente de confirmar). Aquí pondremos toda la info.</p>
    `,
    tips: `
      <h2>Tips y notas</h2>
      <p>- El cóctel será en el jardín, tenlo en cuenta para el calzado.</p>
      <p>- Si tienes cualquier duda, contáctanos. ALBERTO 620 57 91 01 - GEMA 680 96 21 64</p>
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

  // ✅ Abrir imagen: solo si fue un click real (no drag)
  let recentlyDragged = false;
  let dragResetTimer = 0;

  function markDragged() {
    recentlyDragged = true;
    window.clearTimeout(dragResetTimer);
    dragResetTimer = window.setTimeout(() => { recentlyDragged = false; }, 220);
  }

  function openImageFromEl(el) {
    const full = (el.getAttribute("data-full") || "").trim();
    const src = full || el.getAttribute("src") || el.getAttribute("data-src");
    const alt = el.getAttribute("alt") || el.getAttribute("aria-label") || "Imagen";
    if (!src) return;

    const safeAlt = alt.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeSrc = String(src).replace(/"/g, "%22");

    const html = `
      <h2>Galería</h2>
      <p style="margin-top:6px; color: rgba(22,22,22,.62);">${safeAlt}</p>
      <img class="modalImage" src="${safeSrc}" alt="${safeAlt}">
    `;
    openModalHTML(html, el);
  }

  // Delegación: vale para galería + cubo + dibujo grande
  document.addEventListener("click", (e) => {
    const img =
  (e.target && e.target.closest && e.target.closest('img[data-gallery="true"]')) ||
  (e.target && e.target.closest && e.target.closest('.cubeFace') && e.target.closest('.cubeFace').querySelector('img[data-gallery="true"]'));

if (!img) return;

    // si venimos de drag, no abrimos
    if (recentlyDragged) return;

    e.preventDefault();
    openImageFromEl(img);
  }, true);

  // Cerrar modal por backdrop
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

  // =========================================================
  // 9) Galería: drag-to-scroll PRO + flechas por “paso”
  // =========================================================
  function enableDragScroll(track, { dragThresholdPx = 10 } = {}) {
  if (!track) return;

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;
  let pointerId = null;

  const isInteractiveTarget = (target) => {
    if (!target) return false;
    return !!target.closest('img[data-gallery="true"], .galleryNav, button, a, input, textarea, select, label');
  };

  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // ✅ Si pinchas una foto o una flecha, NO activamos drag
    if (isInteractiveTarget(e.target)) return;

    isDown = true;
    moved = false;
    pointerId = e.pointerId;

    try { track.setPointerCapture(pointerId); } catch {}

    startX = e.clientX;
    startScrollLeft = track.scrollLeft;

    track.classList.add("is-dragging");
  };

  const onMove = (e) => {
    if (!isDown) return;

    const dx = e.clientX - startX;
    if (Math.abs(dx) > dragThresholdPx) moved = true;

    track.scrollLeft = startScrollLeft - dx;

    if (moved) markDragged(); // tu función global (recentlyDragged)
  };

  const onUp = () => {
    if (!isDown) return;
    isDown = false;
    pointerId = null;
    track.classList.remove("is-dragging");
  };

  track.addEventListener("pointerdown", onDown);
  track.addEventListener("pointermove", onMove);
  track.addEventListener("pointerup", onUp);
  track.addEventListener("pointercancel", onUp);
  track.addEventListener("mouseleave", onUp);
}

  $$(".galleryTrack").forEach((t) => enableDragScroll(t));

function bindGalleryArrows() {
  // Soporta múltiples galerías en la página
  $$(".gallery").forEach((gallery) => {
    const track = gallery.querySelector(".galleryTrack");
    if (!track) return;

    const prevBtn = gallery.querySelector(".galleryNav--prev");
    const nextBtn = gallery.querySelector(".galleryNav--next");

    const getStep = () => {
      const firstItem = track.querySelector(".galleryItem");
      if (!firstItem) return 320;

      const itemWidth = firstItem.getBoundingClientRect().width;
      const gap = 14; // coincide con tu CSS
      return itemWidth + gap;
    };

    const isAtStart = () => track.scrollLeft <= 2;

    const isAtEnd = () => {
      const max = track.scrollWidth - track.clientWidth;
      return track.scrollLeft >= (max - 2);
    };

    const scrollToPos = (left) => {
      track.scrollTo({
        left,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    const scrollByOneCard = (dir) => {
      const step = getStep();

      // ✅ Wrap infinito
      if (dir > 0 && isAtEnd()) {
        scrollToPos(0); // vuelve al inicio
        return;
      }
      if (dir < 0 && isAtStart()) {
        scrollToPos(track.scrollWidth); // salta al final
        return;
      }

      // normal
      track.scrollBy({
        left: dir * step,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    const onArrowClick = (dir) => (e) => {
      // evita que el drag-to-scroll capture el pointer/click
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      scrollByOneCard(dir);
    };

    // pointerdown para respuesta rápida y evitar pelea con drag
    if (prevBtn) {
      prevBtn.addEventListener("pointerdown", onArrowClick(-1), { passive: false });
      prevBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    }
    if (nextBtn) {
      nextBtn.addEventListener("pointerdown", onArrowClick(1), { passive: false });
      nextBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    }
  });
}

bindGalleryArrows();


  // =========================================================
  // 10) CUBO: drag rotate + inercia + auto-rotate
  // =========================================================
function enableCube(cubeEl, { thresholdMouse = 10, thresholdTouch = 16 } = {}) {
  if (!cubeEl) return;

  cubeEl.setAttribute("data-cube", "true");

  let isPointerDown = false;
  let isDragging = false;

  let startX = 0;
  let startY = 0;

  let lastX = 0;
  let lastY = 0;

  let rotX = -14;
  let rotY = 28;

  let vx = 0;
  let vy = 0;
  let lastTs = 0;

  let inertiaRaf = 0;
  let autoRaf = 0;
  let auto = true;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function apply() {
    cubeEl.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  function stopAuto() {
    auto = false;
    cancelAnimationFrame(autoRaf);
    autoRaf = 0;
  }

  function startAuto() {
    if (prefersReducedMotion) return;
    stopAuto();
    auto = true;

    const loop = () => {
      if (!auto || isPointerDown || isDragging) return;
      rotY += 0.12;
      rotX = clamp(rotX, -70, 70);
      apply();
      autoRaf = requestAnimationFrame(loop);
    };
    autoRaf = requestAnimationFrame(loop);
  }

  function stopInertia() {
    cancelAnimationFrame(inertiaRaf);
    inertiaRaf = 0;
  }

  function startInertia() {
    stopInertia();
    if (prefersReducedMotion) return;

    const friction = 0.92;

    const step = () => {
      vx *= friction;
      vy *= friction;

      if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) {
        stopInertia();
        cubeEl.style.animation = "";
        startAuto();
        return;
      }

      rotY += vx;
      rotX -= vy;
      rotX = clamp(rotX, -70, 70);
      apply();

      inertiaRaf = requestAnimationFrame(step);
    };

    inertiaRaf = requestAnimationFrame(step);
  }

  function getThreshold(e) {
    return e.pointerType === "touch" ? thresholdTouch : thresholdMouse;
  }

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isPointerDown = true;
    isDragging = false;

    startX = lastX = e.clientX;
    startY = lastY = e.clientY;

    vx = 0;
    vy = 0;
    lastTs = performance.now();

    stopAuto();
    stopInertia();

    // IMPORTANTE: NO ponemos is-dragging todavía.
    // Primero decidimos si es TAP (click) o DRAG (arrastre).
  }

  function onMove(e) {
    if (!isPointerDown) return;

    const x = e.clientX;
    const y = e.clientY;

    const dxFromStart = x - startX;
    const dyFromStart = y - startY;

    const dist = Math.hypot(dxFromStart, dyFromStart);
    const threshold = getThreshold(e);

    // hasta que no supere umbral, no se considera drag
    if (!isDragging) {
      if (dist < threshold) return;

      isDragging = true;
      cubeEl.classList.add("is-dragging");

      // ya sí capturamos pointer
      try { cubeEl.setPointerCapture(e.pointerId); } catch {}

      // Pausa animación CSS mientras arrastras
      cubeEl.style.animation = "none";
    }

    // si arrastramos, bloqueamos scroll y rotamos
    e.preventDefault();

    const dx = x - lastX;
    const dy = y - lastY;

    const sens = e.pointerType === "touch" ? 0.22 : 0.12;

    rotY += dx * sens;
    rotX -= dy * sens;
    rotX = clamp(rotX, -70, 70);

    // velocidad para inercia
    const now = performance.now();
    const dt = Math.max(16, now - lastTs);
    vx = (dx * sens) / (dt / 16);
    vy = (dy * sens) / (dt / 16);
    lastTs = now;

    apply();

    lastX = x;
    lastY = y;

    // solo marcamos "drag" si de verdad se arrastró
    markDragged();
  }

function onUp(e) {
  if (!isPointerDown) return;

  isPointerDown = false;

  if (isDragging) {
    isDragging = false;
    cubeEl.classList.remove("is-dragging");
    startInertia();
  } else {
    // ===============================
    // TAP real (no drag)
    // ===============================

    cubeEl.style.animation = "";
    startAuto();

    // ✅ Si existe bandera global de drag reciente, la limpiamos
    if (typeof recentlyDragged !== "undefined") {
      recentlyDragged = false;
    }

    // ✅ Reenviamos el click a la imagen activa del cubo
    if (e && e.target) {
      const face = e.target.closest(".cubeFace");
      if (face) {
        const img = face.querySelector('img[data-gallery="true"]');
        if (img) {
          img.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true
            })
          );
        }
      }
    }
  }
}

  cubeEl.addEventListener("pointerdown", onDown);
  cubeEl.addEventListener("pointermove", onMove, { passive: false });
  cubeEl.addEventListener("pointerup", onUp);
  cubeEl.addEventListener("pointercancel", onUp);
  cubeEl.addEventListener("mouseleave", onUp);

  apply();
  startAuto();
}

  const cubeEl = $("#kidsCube") || $("[data-cube]");
  if (cubeEl) enableCube(cubeEl);

  // =========================================================
// 10.1) Cubo: TAP robusto (reenvía click a la imagen)
// =========================================================
(function bindCubeTapToImage(){
  const cubeRoot = $("#kidsCube") || $("[data-cube]");
  if (!cubeRoot) return;

  cubeRoot.addEventListener("click", (e) => {
    // Si vienes de un drag reciente, no hacemos nada
    // (usa tu bandera global si existe; si no, no bloquea)
    if (typeof recentlyDragged !== "undefined" && recentlyDragged) return;

    const face = e.target.closest(".cubeFace");
    if (!face) return;

    const img = face.querySelector('img[data-gallery="true"]');
    if (!img) return;

    // Re-disparamos un click sobre la imagen para reutilizar tu handler global
    img.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, true);
})();

  // =========================================================
  // 11) Accesibilidad: ESC + trap focus modal
  // =========================================================
  document.addEventListener("keydown", (e) => {
    // Modal abierto
    if (modal && modal.classList.contains("is-open")) {
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
      return;
    }

    // Modal NO abierto: ESC cierra RSVP
    if (e.key === "Escape") {
      if (rsvpPanel && rsvpPanel.classList.contains("is-open")) closeRSVP();
    }
  });

})();
