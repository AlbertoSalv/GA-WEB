/* =========================================================
   GA WEB — main.js (PRO)
   - Intro sobre → muestra web + desbloquea scroll
   - Scroll reveal + stagger timeline
   - Countdown real (26/06/2026 19:00) con eficiencia y sin drift
   - Modales accesibles + focus trap + ESC + click fuera
   ========================================================= */

(() => {
  "use strict";

  // ===============================
  // Helpers
  // ===============================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function pad2(n) { return String(n).padStart(2, "0"); }
  function pad3(n) { return String(n).padStart(3, "0"); }

  // ===============================
  // Intro (Sobre) -> mostrar sitio
  // ===============================
  const intro = $("#intro");
  const openBtn = $("#openEnvelope");
  const site = $("#site");

  let isOpening = false;

  // Bloqueo scroll mientras está la intro (más “premium”)
  if (intro) document.documentElement.style.overflow = "hidden";

  if (openBtn && intro && site) {
    openBtn.addEventListener("click", () => {
      if (isOpening) return;
      isOpening = true;

      intro.classList.add("intro--open");

      // Preparamos el sitio
      site.style.opacity = "0";
      site.classList.remove("site--hidden");

      // Cierre del sobre
      window.setTimeout(() => {
        intro.classList.add("intro--closing");

        window.setTimeout(() => {
          intro.style.display = "none";

          // Desbloquea scroll al entrar
          document.documentElement.style.overflow = "";

          requestAnimationFrame(() => {
            site.style.opacity = "1";
          });

          // Arriba del todo (sin animación)
          try {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          } catch {
            window.scrollTo(0, 0);
          }

          // Foco al main (mejor accesibilidad)
          site.setAttribute("tabindex", "-1");
          site.focus({ preventScroll: true });
          site.removeAttribute("tabindex");
        }, 520);
      }, 750);
    });
  }

  // ===============================
  // Scroll reveal + stagger (tItem)
  // ===============================
  const revealEls = $$(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Stagger SOLO para items de timeline
        if (entry.target.classList.contains("tItem")) {
          const rows = $$(".tItem.reveal");
          const idx = rows.indexOf(entry.target);
          entry.target.style.transitionDelay = `${idx * 70}ms`;
        } else {
          entry.target.style.transitionDelay = "0ms";
        }

        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14 });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ===============================
  // Countdown real (26/06/2026 19:00)
  // - Interval alineado al siguiente segundo (más estable)
  // ===============================
  const targetDate = new Date(2026, 5, 26, 19, 0, 0); // (mes 5 = junio)

  const dEl = $('[data-cd="days"]');
  const hEl = $('[data-cd="hours"]');
  const mEl = $('[data-cd="mins"]');
  const sEl = $('[data-cd="secs"]');

  function tickCountdown() {
    const now = new Date();
    let diff = targetDate.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (dEl) dEl.textContent = pad3(days);
    if (hEl) hEl.textContent = pad2(hours);
    if (mEl) mEl.textContent = pad2(mins);
    if (sEl) sEl.textContent = pad2(secs);
  }

  // Primera ejecución
  tickCountdown();

  // Alinea el refresco al “inicio” del siguiente segundo
  const startDelay = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
  }, startDelay);

  // ===============================
  // Modales (accesibles + focus trap)
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

  // Focus trap
  function getFocusable(container) {
    const focusables = $$(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    });
    return focusables;
  }

  function openModal(key, openerEl = null) {
    if (!modal || !modalContent) return;

    lastFocusedEl = openerEl || document.activeElement;

    modalContent.innerHTML = modalTemplates[key] || "<p>Contenido no disponible.</p>";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // Bloquea scroll del body
    document.body.style.overflow = "hidden";

    // Foco al botón cerrar
    if (closeBtn) window.setTimeout(() => closeBtn.focus(), 0);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Devuelve foco
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      window.setTimeout(() => lastFocusedEl.focus(), 0);
    }
    lastFocusedEl = null;
  }

  // Botones que abren modal
  $$("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal, btn));
  });

  // Cerrar por click fuera / botón X
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.hasAttribute("data-close")) closeModal();
    });
  }

  // ESC + TAB trap
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

      // Shift+Tab
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

})();
