// ===============================
// Intro (Sobre) -> mostrar sitio
// ===============================
const intro = document.getElementById("intro");
const openBtn = document.getElementById("openEnvelope");
const site = document.getElementById("site");

let isOpening = false;

openBtn.addEventListener("click", () => {
  if (isOpening) return;
  isOpening = true;

  intro.classList.add("intro--open");

  // Preparamos el sitio
  site.style.opacity = "0";
  site.classList.remove("site--hidden");

  // Esperamos a que “se note” la animación del sobre
  setTimeout(() => {
    intro.classList.add("intro--closing"); // fade out

    setTimeout(() => {
      intro.style.display = "none";
      requestAnimationFrame(() => {
        site.style.opacity = "1";
      });

      // Arriba del todo (sin animación)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Por si el foco se queda “perdido”
      site.setAttribute("tabindex", "-1");
      site.focus({ preventScroll: true });
      site.removeAttribute("tabindex");

    }, 520);

  }, 750);
});


// ===============================
// Scroll reveal + stagger (timeline)
// ===============================
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Stagger SOLO para timeline rows
      if (entry.target.classList.contains("timeline__row")) {
        const rows = Array.from(document.querySelectorAll(".timeline__row.reveal"));
        const idx = rows.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 70}ms`;
      } else {
        entry.target.style.transitionDelay = "0ms";
      }

      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el) => io.observe(el));
} else {
  // Fallback navegadores viejos
  revealEls.forEach((el) => el.classList.add("is-visible"));
}


// ===============================
// Countdown real (26/06/2026)
// ===============================
// Consejo: para evitar líos de zona horaria, construimos fecha local:
const targetDate = new Date(2026, 5, 26, 19, 0, 0); // (mes 5 = junio) 19:00

function pad2(n) { return String(n).padStart(2, "0"); }
function pad3(n) { return String(n).padStart(3, "0"); }

function tickCountdown() {
  const now = new Date();
  let diff = targetDate.getTime() - now.getTime();
  if (diff < 0) diff = 0;

  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const dEl = document.querySelector('[data-cd="days"]');
  const hEl = document.querySelector('[data-cd="hours"]');
  const mEl = document.querySelector('[data-cd="mins"]');
  const sEl = document.querySelector('[data-cd="secs"]');

  if (dEl) dEl.textContent = pad3(days);
  if (hEl) hEl.textContent = pad2(hours);
  if (mEl) mEl.textContent = pad2(mins);
  if (sEl) sEl.textContent = pad2(secs);
}

tickCountdown();
setInterval(tickCountdown, 1000);


// ===============================
// Modales (pestañas) - perfecto
// ===============================
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeBtn = modal ? modal.querySelector(".modal__close") : null;

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

function openModal(key, openerEl = null) {
  if (!modal || !modalContent) return;

  lastFocusedEl = openerEl || document.activeElement;

  modalContent.innerHTML = modalTemplates[key] || "<p>Contenido no disponible.</p>";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  // Bloquea scroll del body
  document.body.style.overflow = "hidden";

  // Foco al botón cerrar (mejor UX)
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 0);
  }
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  // Devuelve el foco a donde estaba
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
    setTimeout(() => lastFocusedEl.focus(), 0);
  }
  lastFocusedEl = null;
}

// Botones que abren modal
document.querySelectorAll("[data-modal]").forEach((btn) => {
  btn.addEventListener("click", () => openModal(btn.dataset.modal, btn));
});

// Cerrar por click fuera o botón X
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
}

// Cerrar por ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
    closeModal();
  }
});
