/* =========================================================
   GA WEB — main.js (PRO) — FIX + OPTIMIZADO (2026)
   - Intro sobre + fadeIn (animate.css)
   - Countdown exacta: 26/06/2026 19:00 Europe/Madrid
   - RSVP: abre/cierra + estado “recibido” (modo demo)
   - Timeline:
       • línea se dibuja al entrar en pantalla
       • items reveal on-viewport (premium)
       • iconos Lottie: load ligero + play once al entrar (fallback emoji)
   - Música: toggle sin autoplay + estado real
   - Microparallax suave (hero + countdown, solo desktop)
   - Modales accesibles + click-to-open (galería + cubo)
   - Galería: drag-to-scroll pro (mouse + touch) + evita “click” tras arrastrar
   - Cubo: drag rotate (mouse + touch) + inercia + auto-rotate + click en caras abre modal
   - Add to Calendar (.ics)
   ========================================================= */

(() => {
  "use strict";

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

    // Si no hay items, no hacemos nada
    if (!items.length) return;

    // Si reduce motion, no animamos: dejamos contenido visible y emojis.
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      // Asegura que no quede en estado "is-ready" oculto
      timeline.classList.remove("is-ready");
      items.forEach((it) => it.classList.add("is-in"));
      return;
    }

    // Activamos estado inicial (CSS hará los items invisibles hasta entrar)
    timeline.classList.add("is-ready");

    // Carga de Lottie (si existe librería). Si no existe, solo reveal.
    const hasLottieLib = typeof window.lottie !== "undefined" && window.lottie && typeof window.lottie.loadAnimation === "function";
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

          // Estado inicial: frame 0, y ocultamos emoji fallback cuando haya lottie
          anim.goToAndStop(0, true);
          instances.set(holder, anim);

          const dot = holder.closest(".tDot");
          if (dot) dot.classList.add("has-lottie");
        } catch {
          // Si falla una animación, simplemente dejamos el emoji
        }
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const item = entry.target;

          // Reveal item
          item.classList.add("is-in");

          // Play Lottie once (si existe y no se ha reproducido)
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
  // 4) RSVP
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

  const footerRSVPLink = $("#footerRSVPLink");
  if (footerRSVPLink) {
    footerRSVPLink.addEventListener("click", (e) => {
      e.preventDefault();
      openRSVP({ scrollIntoView: true });
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
    // Evento empieza 26/06/2026 19:00 (Madrid)
    const startUtcMs = tzDateToUtcMs({ ...EVENT, hour: 19, minute: 0, second: 0 });

    // Termina 27/06/2026 02:00 (Madrid)
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

  // ✅ Click-to-open universal: data-gallery="true" + (data-full opcional)
  function bindGalleryClickables(root = document) {
    const clickables = $$('[data-gallery="true"]', root);
    if (!clickables.length) return;

    clickables.forEach((el) => {
      if (el.__gaBound) return;
      el.__gaBound = true;

      el.addEventListener("click", () => {
        const full = (el.getAttribute("data-full") || "").trim();
        const src = full || el.getAttribute("src") || el.getAttribute("data-src");
        const alt = el.getAttribute("alt") || el.getAttribute("aria-label") || "Imagen";
        if (!src) return;

        const html = `
          <h2>Galería</h2>
          <p style="margin-top:6px; color: rgba(22,22,22,.62);">${alt}</p>
          <img class="modalImage" src="${src}" alt="${alt}">
        `;
        openModalHTML(html, el);
      });
    });
  }

  bindGalleryClickables();

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
  // 9) Galería: drag-to-scroll PRO (y evita click tras drag)
  // =========================================================
  function enableDragScroll(track, { dragThresholdPx = 6 } = {}) {
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let pointerId = null;
    let moved = false;

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

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
    };

    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      pointerId = null;
      track.classList.remove("is-dragging");

      // Si arrastró, bloquea click fantasma
      if (moved) {
        const killClick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          track.removeEventListener("click", killClick, true);
        };
        track.addEventListener("click", killClick, true);
        window.setTimeout(() => track.removeEventListener("click", killClick, true), 180);
      }
    };

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("mouseleave", onUp);
  }

  $$(".galleryTrack").forEach((t) => enableDragScroll(t));

  // =========================================================
  // 10) CUBO: drag rotate + inercia + auto-rotate + click-to-open
  // =========================================================
  function enableCube(cubeEl, { threshold = 10 } = {}) {
    if (!cubeEl) return;

    // Marca para CSS (cursor/touch-action)
    cubeEl.setAttribute("data-cube", "true");

    let isDown = false;
    let lastX = 0;
    let lastY = 0;

    let rotX = -14;
    let rotY = 28;

    let movedPx = 0;
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
        if (!auto || isDown) return;
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

    function onDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isDown = true;
      movedPx = 0;
      vx = 0;
      vy = 0;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTs = performance.now();

      stopAuto();
      stopInertia();

      cubeEl.classList.add("is-dragging");
      try { cubeEl.setPointerCapture(e.pointerId); } catch {}

      // Pausa animación CSS mientras arrastras (si estuviera)
      cubeEl.style.animation = "none";
    }

    function onMove(e) {
      if (!isDown) return;

      const x = e.clientX;
      const y = e.clientY;

      const dx = x - lastX;
      const dy = y - lastY;

      movedPx += Math.abs(dx) + Math.abs(dy);

      const sens = 0.18;
      rotY += dx * sens;
      rotX -= dy * sens;
      rotX = clamp(rotX, -70, 70);

      // Velocidad para inercia
      const now = performance.now();
      const dt = Math.max(16, now - lastTs);
      vx = (dx * sens) / (dt / 16);
      vy = (dy * sens) / (dt / 16);
      lastTs = now;

      apply();

      lastX = x;
      lastY = y;
    }

    function onUp() {
      if (!isDown) return;
      isDown = false;
      cubeEl.classList.remove("is-dragging");

      if (movedPx >= threshold) {
        const killClick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          cubeEl.removeEventListener("click", killClick, true);
        };
        cubeEl.addEventListener("click", killClick, true);
        window.setTimeout(() => cubeEl.removeEventListener("click", killClick, true), 220);

        startInertia();
      } else {
        cubeEl.style.animation = "";
        startAuto();
      }
    }

    cubeEl.addEventListener("pointerdown", onDown);
    cubeEl.addEventListener("pointermove", onMove);
    cubeEl.addEventListener("pointerup", onUp);
    cubeEl.addEventListener("pointercancel", onUp);
    cubeEl.addEventListener("mouseleave", onUp);

    apply();
    startAuto();
  }

  const cubeEl = $('[data-cube], #kidsCube');
  if (cubeEl) enableCube(cubeEl);

  // =========================================================
  // ESC global + trap focus modal
  // =========================================================
  document.addEventListener("keydown", (e) => {
    // 1) Modal abierto
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

  (function () {
  const track = document.querySelector(".galleryTrack");
  if (!track) return;

  // --- 1) Diferenciar click vs drag (desktop) ---
  let isPointerDown = false;
  let startX = 0;
  let startY = 0;
  let dragged = false;

  const DRAG_THRESHOLD = 8; // px

  track.addEventListener("pointerdown", (e) => {
    isPointerDown = true;
    dragged = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  track.addEventListener("pointermove", (e) => {
    if (!isPointerDown) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) dragged = true;
  });

  track.addEventListener("pointerup", () => {
    isPointerDown = false;
  });

  track.addEventListener("pointercancel", () => {
    isPointerDown = false;
  });

  // --- 2) Abrir modal al click REAL (no drag) ---
  document.addEventListener("click", (e) => {
    const img = e.target.closest('img[data-gallery="true"]');
    if (!img) return;

    // si venimos de arrastre, no abrimos
    if (dragged) return;

    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");
    if (!modal || !modalContent) return;

    const full = img.getAttribute("data-full") || img.getAttribute("src");
    const alt = img.getAttribute("alt") || "Imagen";
    if (!full) return;

    e.preventDefault();

    modalContent.innerHTML = `
      <h2>Galería</h2>
      <p>${alt}</p>
      <img class="modalImage" src="${full}" alt="${alt}">
    `;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }, { passive: true });

  // --- 3) Flechas desktop para mover carrusel ---
  const prevBtn = document.querySelector(".galleryNav--prev");
  const nextBtn = document.querySelector(".galleryNav--next");

  const scrollByOneCard = (dir) => {
    // ancho de una tarjeta aprox
    const firstItem = track.querySelector(".galleryItem");
    if (!firstItem) return;

    const itemWidth = firstItem.getBoundingClientRect().width;
    const gap = 14; // coincide con tu CSS
    const step = itemWidth + gap;

    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (prevBtn) prevBtn.addEventListener("click", () => scrollByOneCard(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => scrollByOneCard(1));
})();


    // 2) Modal NO abierto: ESC puede cerrar RSVP
    if (e.key === "Escape") {
      if (rsvpPanel && rsvpPanel.classList.contains("is-open")) closeRSVP();
    }
  });

})();
