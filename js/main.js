/* =========================================================
   GA WEB — main.js (STEP)
   Cambios:
   - Sin CTAs que “lleven” a secciones (salvo link final opcional)
   - Fecha: sin animaciones (solo se muestra en HTML)
   - RSVP: se abre/cierra bajo "La línea del día" (panel desplegable)
   - RSVP incluye: nombre + asistencia (sí/no) + alergias + autobús (sí/no) + canción (opcional)
   - Envío: placeholder hasta conectar (Google Forms / Sheets recomendado)
   - Modales accesibles (Dress/Bus/Tips)
   - Add to Calendar (.ics)
   ========================================================= */

(() => {
  "use strict";

  // ===============================
  // Helpers
  // ===============================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

          try {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          } catch {
            window.scrollTo(0, 0);
          }

          site.setAttribute("tabindex", "-1");
          site.focus({ preventScroll: true });
          site.removeAttribute("tabindex");
        }, 520);
      }, 750);
    });
  }

  // ===============================
  // (Opcional) Reveal (si usas .reveal)
  // ===============================
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14 });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ===============================
  // Countdown real (si existe #countdown con [data-cd])
  // ===============================
  const targetDate = new Date(2026, 5, 26, 19, 0, 0);
  const countdownWrap = $("#countdown");

  function tickCountdown() {
    if (!countdownWrap) return;

    const dEl = $('[data-cd="days"]', countdownWrap);
    const hEl = $('[data-cd="hours"]', countdownWrap);
    const mEl = $('[data-cd="mins"]', countdownWrap);
    const sEl = $('[data-cd="secs"]', countdownWrap);

    // Si no existe markup, no hacemos nada (tu HTML ya lo trae)
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
  // RSVP desplegable bajo "La línea del día"
  // - #rsvpToggle (botón)
  // - #rsvpPanel  (panel)
  // - #rsvpForm   (form)
  // ===============================
  const rsvpToggle = $("#rsvpToggle");
  const rsvpPanel = $("#rsvpPanel");
  const rsvpForm = $("#rsvpForm");

  function openRSVP({ scrollIntoView = false } = {}) {
    if (!rsvpPanel) return;

    rsvpPanel.classList.add("is-open");
    rsvpPanel.setAttribute("aria-hidden", "false");
    if (rsvpToggle) rsvpToggle.setAttribute("aria-expanded", "true");

    if (scrollIntoView) {
      const top = rsvpPanel.getBoundingClientRect().top + window.pageYOffset - 10;
      if (prefersReducedMotion) window.scrollTo(0, top);
      else window.scrollTo({ top, behavior: "smooth" });
    }

    // foco al primer input
    const firstInput = $("input, select, textarea, button", rsvpPanel);
    if (firstInput) window.setTimeout(() => firstInput.focus(), 80);
  }

  function closeRSVP() {
    if (!rsvpPanel) return;

    rsvpPanel.classList.remove("is-open");
    rsvpPanel.setAttribute("aria-hidden", "true");
    if (rsvpToggle) rsvpToggle.setAttribute("aria-expanded", "false");
  }

  function toggleRSVP() {
    if (!rsvpPanel) return;
    const isOpen = rsvpPanel.classList.contains("is-open");
    if (isOpen) closeRSVP();
    else openRSVP();
  }

  if (rsvpToggle && rsvpPanel) {
    rsvpToggle.addEventListener("click", toggleRSVP);
  }

  // Cerrar RSVP con ESC si está abierto
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (rsvpPanel && rsvpPanel.classList.contains("is-open")) closeRSVP();
  });

  // Envío: placeholder hasta conectar action real (Google Forms recomendado)
  function toast(msg) {
    try { alert(msg); } catch {}
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", (e) => {
      const action = (rsvpForm.getAttribute("action") || "").trim();
      const isPlaceholder = action === "" || action === "#";

      if (isPlaceholder) {
        e.preventDefault();
        toast("✅ Enviado (modo demo). Para que os llegue de verdad, hay que conectar el formulario a Google Forms/Sheets o similar.");
      }
    });
  }

  // Link del footer para abrir RSVP (opcional)
  // - En tu HTML pon: <a id="footerRSVPLink" href="#">Confirmar asistencia</a>
  const footerRSVPLink = $("#footerRSVPLink");
  if (footerRSVPLink) {
    footerRSVPLink.addEventListener("click", (e) => {
      e.preventDefault();
      openRSVP({ scrollIntoView: true }); // si no quieres scroll, pon false
    });
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
    const start = new Date(2026, 5, 26, 19, 0, 0);
    const end = new Date(2026, 5, 26, 19, 45, 0);

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
  // Modales (Dress/Bus/Tips)
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
