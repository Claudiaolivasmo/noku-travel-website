// assets/js/nav.js
// Header shrink + menú móvil overlay al estilo Natura

(() => {
  const header = document.querySelector('.nav');          // barra superior
  const hamburger = document.getElementById('hamburger'); // botón 3 rayas / X
  const navMobile = document.getElementById('navMobile'); // overlay móvil

  const focusableSelectors =
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const SCROLL_THRESHOLD = 50;
  let ticking = false;

  // ===== Header shrink con scroll =====
  function applyHeaderState() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(applyHeaderState);
      ticking = true;
    }
  }

  // ===== Menú móvil =====
  function openMenu() {
    if (!hamburger || !navMobile) return;

    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');

    // mostrar overlay
    navMobile.hidden = false;
    navMobile.setAttribute('aria-hidden', 'false');

    // bloquear scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('nav-open');

    // foco al primer enlace del menú
    const firstLink = navMobile.querySelector(focusableSelectors);
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    if (!hamburger || !navMobile) return;

    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');

    // activar fade-out
    navMobile.setAttribute('aria-hidden', 'true');

    // esperar a que termine la transición de opacidad
    setTimeout(() => {
      if (navMobile.getAttribute('aria-hidden') === 'true') {
        navMobile.hidden = true;
      }
    }, 250);

    // restaurar scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.classList.remove('nav-open');
  }

  function toggleMenu() {
    if (!hamburger) return;
    const isOpen = hamburger.classList.contains('active');
    isOpen ? closeMenu() : openMenu();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // estado inicial del header
    applyHeaderState();
    window.addEventListener('scroll', onScroll, { passive: true });

    // click en hamburguesa
    if (hamburger) {
      hamburger.addEventListener('click', toggleMenu);
    }

    // cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger && hamburger.classList.contains('active')) {
        closeMenu();
        hamburger.focus();
      }
    });

    // cerrar al hacer click fuera (en el overlay oscuro)
    if (navMobile) {
      navMobile.addEventListener('click', (e) => {
        if (e.target === navMobile) {
          closeMenu();
        }
      });

      // cerrar al hacer click en cualquier enlace del menú
      navMobile.querySelectorAll('[data-close]').forEach((link) => {
        link.addEventListener('click', () => closeMenu());
      });
    }

    // cerrar si se agranda la pantalla a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 900) {
        closeMenu();
      }
    });
  });
})();
