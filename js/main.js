/* =========================================================
   GA WEB — main.js (PRO)
   - Intro sobre → muestra web + desbloquea scroll
   - Scroll reveal + stagger timeline
   - Countdown real (26/06/2026 19:00) con eficiencia y sin drift
   - Modales accesibles + focus trap + ESC + click fuera
   - Skybands “fixdate-like” (nubes + trazo + pieza + corazón) re-animación segura
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

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ===============================
  // Intro (Sobre) -> mostrar sitio
  // ===============================
  const intro = $("#intro");
  const openBtn = $("#openEnvelope");
  const site = $("#site");

  let isOpening = false;

  // Bloqueo scroll mientras está la intro
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

          // Foco al main
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
  // - Rellena #countdown si está vacío (tu HTML actual lo usa así)
  // - Si existen [data-cd], también los actualiza (compatibilidad)
  // ===============================
  const targetDate = new Date(2026, 5, 26, 19, 0, 0); // (mes 5 = junio)

  const countdownWrap = $("#countdown");

  // Compatibilidad con el markup antiguo
  const dElOld = $('[data-cd="days"]');
  const hElOld = $('[data-cd="hours"]');
  const mElOld = $('[data-cd="mins"]');
  const sElOld = $('[data-cd="secs"]');

  function ensureCountdownMarkup() {
    if (!countdownWrap) return;

    // Si ya viene el markup dentro, no lo pisa
    if (countdownWrap.children && countdownWrap.children.length) return;

    countdownWrap.innerHTML = `
      <div class="cdItem">
        <div class="cdNum" data-cd="days">000</div>
        <div class="cdLab">Días</div>
      </div>
      <div class="cdSep" aria-hidden="true"></div>
      <div class="cdItem">
        <div class="cdNum" data-cd="hours">00</div>
        <div class="cdLab">Horas</div>
      </div>
      <div class="cdSep" aria-hidden="true"></div>
      <div class="cdItem">
        <div class="cdNum" data-cd="mins">00</div>
        <div class="cdLab">Min</div>
      </div>
      <div class="cdSep" aria-hidden="true"></div>
      <div class="cdItem">
        <div class="cdNum" data-cd="secs">00</div>
        <div class="cdLab">Seg</div>
      </div>
    `;
  }

  function getCountdownEls() {
    // Primero intenta dentro del wrap (nuevo)
    const dEl = countdownWrap ? $('[data-cd="days"]', countdownWrap) : null;
    const hEl = countdownWrap ? $('[data-cd="hours"]', countdownWrap) : null;
    const mEl = countdownWrap ? $('[data-cd="mins"]', countdownWrap) : null;
    const sEl = countdownWrap ? $('[data-cd="secs"]', countdownWrap) : null;

    // Si no existen, cae al viejo
    return {
      dEl: dEl || dElOld,
      hEl: hEl || hElOld,
      mEl: mEl || mElOld,
      sEl: sEl || sElOld,
    };
  }

  function tickCountdown() {
    const now = new Date();
    let diff = targetDate.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const { dEl, hEl, mEl, sEl } = getCountdownEls();

    if (dEl) dEl.textContent = pad3(days);
    if (hEl) hEl.textContent = pad2(hours);
    if (mEl) mEl.textContent = pad2(mins);
    if (sEl) sEl.textContent = pad2(secs);
  }

  // Inicializa markup si hace falta
  ensureCountdownMarkup();

  // Primera ejecución
  tickCountdown();

  // Alinea el refresco al inicio del siguiente segundo
  const startDelay = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
  }, startDelay);

  // ===============================
  // Skyband “de vez en cuando”
  // - Hace que NO estén siempre visibles, y reaparezcan en “oleadas”
  // - Sin tocar tu HTML: actúa sobre .skyband existentes (si los añades)
  // ===============================
  const skybands = $$(".skyband");

  function setSkybandVisible(el, visible) {
    if (!el) return;
    el.style.transition = "opacity 700ms ease";
    el.style.opacity = visible ? "0.95" : "0";
    el.style.pointerEvents = "none";
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function scheduleSkybands() {
    if (!skybands.length) return;

    // Si el usuario prefiere menos movimiento: se queda visible y sin “parpadeos”
    if (prefersReducedMotion) {
      skybands.forEach((sb) => setSkybandVisible(sb, true));
      return;
    }

    // Arranca oculto y aparece “a ratos”
    skybands.forEach((sb) => setSkybandVisible(sb, false));

    const loop = (sb) => {
      // Tiempo oculto (18–36s) + visible (7–12s)
      const hiddenMs = randomBetween(18000, 36000);
      const visibleMs = randomBetween(7000, 12000);

      window.setTimeout(() => {
        setSkybandVisible(sb, true);

        window.setTimeout(() => {
          setSkybandVisible(sb, false);
          loop(sb);
        }, visibleMs);

      }, hiddenMs);
    };

    // Desfase para que no salgan todos a la vez
    skybands.forEach((sb, i) => {
      const initialDelay = 1200 + i * 1400;
      window.setTimeout(() => loop(sb), initialDelay);
    });
  }

  scheduleSkybands();

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
