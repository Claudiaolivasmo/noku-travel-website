'use strict';


/* ========== Config ========== */
const TOURS_JSON_URL = 'assets/data/tours.json';
const DEFAULT_TOUR_IMG = 'assets/img/tours/_placeholder.jpg';

/* ========== Helpers ========== */
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function textOr(str, fb = '') {
  return typeof str === 'string' ? str : fb;
}

/* Small DL row builder with our CSS */
function rowDL(term, dataHTML) {
  const row = el('div', 'info__row');
  const dt = el('dt', 'info__term', term);
  const dd = el('dd', 'info__data'); dd.innerHTML = dataHTML;
  row.appendChild(dt); row.appendChild(dd);
  return row;
}


document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".fade-section");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  sections.forEach(section => observer.observe(section));
});



/* Builds one tour card matching our CSS */
/* Builds one tour card matching our CSS */
function renderTourCard(tour) {
  const {
    name,
    image,
    description,
    duration,
    price,
    difficulty,
    highlights = [],
    badge
  } = tour || {};

  // <article class="card">
  const card = el('article', 'card');

  // figure.media
  const media = el('figure', 'card__media');
  const img = el('img');
  img.src = textOr(image, DEFAULT_TOUR_IMG);
  img.alt = textOr(name, 'Tour photo');
  img.loading = 'lazy';
  img.decoding = 'async';
  media.appendChild(img);

  if (badge) {
    const b = el('span', 'card__badge', textOr(badge));
    media.appendChild(b);
  }
  card.appendChild(media);

  // body
  const body = el('div', 'card__pad');
  const title = el('h3', 'card__title', textOr(name, 'Untitled tour'));
  const desc = el('p', 'card__text clamp-3', textOr(description, ''));
  body.appendChild(title);
  body.appendChild(desc);

  // meta chips
  const meta = el('div', 'card__meta');
  if (difficulty) meta.appendChild(el('span', 'badge badge--soft', textOr(difficulty)));
  if (duration)   meta.appendChild(el('span', 'badge', `⏱ ${textOr(duration)}`));
  body.appendChild(meta);

  // highlights (máx 3)
  if (Array.isArray(highlights) && highlights.length) {
    const list = el('ul', 'list');
    highlights.slice(0, 3).forEach(h => list.appendChild(el('li', null, textOr(h))));
    body.appendChild(list);
  }

  // info table
  const info = el('dl', 'info');
  if (duration)  info.appendChild(rowDL('Duration:', textOr(duration)));
  if (price)     info.appendChild(rowDL('Price:', `<span class="price">${textOr(price)}</span>`));
  if (info.children.length) body.appendChild(info);

  // CTA -> link al detalle
  const cta = el('div', 'card__cta');
  const link = el('a', 'btn btn--primary btn--full-width', 'View Details');
  link.href = `tour.html?id=${tour.id}`;
  link.setAttribute('aria-label', `Open ${name} details and booking`);
  cta.appendChild(link);
  body.appendChild(cta);


  // ⬇️ Estas dos líneas y el cierre faltaban
  card.appendChild(body);
  return card;
}


/* ========== TOURS ========== */
async function loadTours() {
  const container = document.getElementById('tours-container');
  const tourSelect = document.getElementById('tour-interest'); 
  if (!container) return;

  try {
    const res = await fetch(TOURS_JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} when loading tours.json`);
    const data = await res.json();
    const tours = Array.isArray(data?.tours) ? data.tours : [];

    container.innerHTML = '';
    if (tourSelect) {
      tourSelect.innerHTML = '';
      const ph = el('option'); ph.value = ''; ph.textContent = 'Select a tour…';
      tourSelect.appendChild(ph);
    }

    tours.forEach(t => {
      container.appendChild(renderTourCard(t));
      if (tourSelect && t?.name) {
        const opt = document.createElement('option');
        opt.value = t.name; opt.textContent = t.name;
        tourSelect.appendChild(opt);
      }
    });


  } catch (err) {
    console.error('Error loading tours:', err);
    if (container && !container.children.length) {
      const warn = el('div', 'card');
      warn.innerHTML = `
        <div class="card__pad">
          <h3 class="card__title">We couldn’t load tours</h3>
          <p class="card__text">Please try again later or contact us on WhatsApp.</p>
        </div>`;
      container.appendChild(warn);
    }
  }
}

/* ========== Select tour into form ========== */
function selectTour(tourName) {
  const select = document.getElementById('tour-interest');
  const subjectInput = document.getElementById('subject');
  const nameInput = document.getElementById('name');

  if (select && typeof tourName === 'string') {
    select.value = tourName;
  } else if (subjectInput) {
    subjectInput.value = `Inquiry about: ${tourName}`;
  }
  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  nameInput?.focus();
}

/* ========== NAV ========== */
function setupNavigation() {
  const mobileMenuBtn = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('navMenu');
  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenu.setAttribute('aria-hidden', 'true');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('is-open');

  mobileMenuBtn.addEventListener('click', () => {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    const next = !isExpanded;
    mobileMenuBtn.setAttribute('aria-expanded', String(next));
    mobileMenu.setAttribute('aria-hidden', String(!next));
    mobileMenu.classList.toggle('is-open', next);
    (next ? mobileMenu.querySelector('a') : mobileMenuBtn)?.focus();
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenuBtn.getAttribute('aria-expanded') === 'true') {
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.focus();
    }
  });
}

/* ========== FORM (light) ========== */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    console.log('Form Submitted', data);
    form.reset();
    document.getElementById('name')?.focus();
  });
}

/* ========== HERO video ========== */
function setupHeroVideo() {
  const video = document.querySelector('.hero__video') || document.getElementById('heroVideo');
  if (!video) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { video.pause(); video.classList.add('is-paused'); return; }
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => { video.classList.add('is-paused'); });
  }
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  loadTours();
  setupNavigation();
  setupContactForm();
  setupHeroVideo();
});
