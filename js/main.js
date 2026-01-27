/* =========================================================
   GA WEB — main.js (PRO)
   - Intro sobre
   - Countdown exacta: 26/06/2026 19:00 España
   - RSVP: abre/cierra + estado “recibido” (modo demo)
   - Timeline: línea se dibuja al entrar en pantalla
   - Música: toggle sin autoplay
   - Microparallax suave en portada (solo desktop)
   - Modales accesibles + Add to Calendar + Guardar web
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isCoarsePointer = window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

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
  // Countdown (26/06/2026 19:00 España)
  // ===============================
  // Ojo: Date() usa tu zona local del usuario. Para “España”, asumimos que el invitado está en España.
  // Si quieres fijarlo siempre a Europe/Madrid aunque estén fuera, habría que usar luxon o similar.
  const targetDate = new Date(2026, 5, 26, 19, 0, 0);
  const countdownWrap = $("#countdown");

  function tickCountdown() {
    if (!countdownWrap) return;

    const dEl = $('[data-cd="days"]', countdownWrap);
    const hEl = $('[data-cd="hours"]', countdownWrap);
    const mEl = $('[data-cd="mins"]', countdownWrap);
    const sEl = $('[data-cd="secs"]', countdownWrap);

    if (!dEl || !hEl || !mEl || !sEl) return;

    const now = new Date();
    let diff = targetDate.getTime() - now.getTime();
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
  // Música (toggle)
  // ===============================
  const musicBtn = $("#musicToggle");
  const bgMusic = $("#bgMusic");

  function setMusic(on) {
    if (!musicBtn) return;
    musicBtn.classList.toggle("is-on", on);
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pausar música" : "Activar música");
  }

  if (musicBtn && bgMusic) {
    musicBtn.addEventListener("click", async () => {
      try {
        if (bgMusic.paused) {
          await bgMusic.play();
          setMusic(true);
        } else {
          bgMusic.pause();
          setMusic(false);
        }
      } catch {
        // Si no hay source o el navegador lo bloquea
        setMusic(false);
      }
    });

    bgMusic.addEventListener("pause", () => setMusic(false));
    bgMusic.addEventListener("play", () => setMusic(true));
  }

  // ===============================
  // Microparallax (solo desktop, muy suave)
  // ===============================
  const heroPhoto = $(".heroPhoto--full");
  if (heroPhoto && !prefersReducedMotion && !isCoarsePointer) {
    const bg = $(".heroPhoto__bg", heroPhoto);

    if (bg) {
      let raf = 0;
      function onMove(e) {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const rect = heroPhoto.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;  // 0..1
          const y = (e.clientY - rect.top) / rect.height; // 0..1

          // rango pequeño
          const tx = (x - 0.5) * 10; // px
          const ty = (y - 0.5) * 10; // px

          bg.style.transform = `scale(1.06) translate(${tx}px, ${ty}px)`;
        });
      }

      heroPhoto.addEventListener("mousemove", onMove);
      heroPhoto.addEventListener("mouseleave", () => {
        bg.style.transform = "scale(1.06) translate(0px, 0px)";
      });
    }
  }

  // ===============================
  // Add to Calendar (.ics)
  // ===============================
  const addToCal = $("#addToCalendarLink");

  const eventTitle = "Boda de Gema & Alberto";
  const eventLocation = "Castillo de Fuensaldaña (Ceremonia) / El Hueco Bodas y Banquetes (Celebración)";
  const eventDescription =
    "Boda de Gema y Alberto.\n\nCeremonia: 19:00 — Castillo de Fuensaldaña.\nCelebración: 20:00 — El Hueco Bodas y Banquetes.\n\n¡Nos vemos allí!";

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
    // Evento: 19:00–19:45 (ajústalo si quieres)
    const start = new Date(2026, 5, 26, 19, 0, 0);
    const end = new Date(2026, 5, 26, 19, 45, 0);

    // Convertimos a “UTC”
    const dtStamp = toICSDateUTC(new Date());
    const dtStart = toICSDateUTC(new Date(start.getTime() - start.getTimezoneOffset() * 60000));
    const dtEnd = toICSDateUTC(new Date(end.getTime() - end.getTimezoneOffset() * 60000));

    const uid = `gaweb-${Date.now()}@ga-web`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GA WEB//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
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
  // Modales (Dress/Bus/Tips + Guardar web)
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

  function openModal(key, openerEl = null) {
    if (!modal || !modalContent) return;

    lastFocusedEl = openerEl || document.activeElement;

    modalContent.innerHTML = modalTemplates[key] || "<p>Contenido no disponible.</p>";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (closeBtn) window.setTimeout(() => closeBtn.focus(), 0);
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
  }

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

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.hasAttribute("data-close")) closeModal();
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

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
