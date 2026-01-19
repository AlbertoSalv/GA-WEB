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
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 520);

  }, 750);
});
