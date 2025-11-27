/* =========================================================
   Nokú Travel — tour.js (detalle de tour)
   - Lee ?id= desde la URL
   - Carga assets/data/tours.json
   - Renderiza el detalle del tour
   - CTA -> contact.html?tour=Nombre%20del%20tour#contact-form
   ========================================================= */

(function () {
  'use strict';

  const TOURS_JSON_URL = 'assets/data/tours.json';

  // ===== Helpers =====
  const $ = (id) => document.getElementById(id);
  const getParam = (name) => new URL(location.href).searchParams.get(name);
  const isImageLike = (s) =>
    typeof s === 'string' &&
    (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(s) || /^https?:\/\//i.test(s));

  const setText = (id, txt = '') => { const el = $(id); if (el) el.textContent = txt; };
  const setHTML = (id, html = '') => { const el = $(id); if (el) el.innerHTML = html; };

  function notFound() {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6;">
        <div style="text-align:center;max-width:520px;padding:1rem;">
          <h1 style="font-size:28px;margin:0 0 8px;color:#1a1a1a;">Tour not found</h1>
          <p style="color:#4b5563;margin:0 0 18px;">We couldn't find the tour you're looking for.</p>
          <a href="tours.html" class="btn btn--primary">Back to tours</a>
        </div>
      </div>`;
  }

  // Inyecta estilos para checks en "What to bring" si no existen
  function ensureBringStyles() {
    if (document.getElementById('bring-check-styles')) return;
    const style = document.createElement('style');
    style.id = 'bring-check-styles';
    style.textContent = `
      #tourBring{ list-style:none; padding:0; margin:0; }
      #tourBring li{ position:relative; padding-left:1.5rem; margin-bottom:.35rem; color:var(--gray-700); line-height:1.45; }
      #tourBring li::before{
        content:"✔";
        position:absolute; left:0; top:0; line-height:1;
        color: var(--noku-primary);
        font-weight:800;
      }`;
    document.head.appendChild(style);
  }

  function buildContactURL(tourName = '') {
    const base = 'contact.html';
    const q = tourName ? `?tour=${encodeURIComponent(tourName)}` : '';
    const hash = '#contact-form';
    return `${base}${q}${hash}`;
  }

  async function load() {
    const idRaw = getParam('id');
    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) return notFound();

    let data;
    try {
      const res = await fetch(TOURS_JSON_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error('Error loading tours.json', err);
      return notFound();
    }

    const tours = Array.isArray(data?.tours) ? data.tours : [];
    const tour = tours.find(t => Number(t.id) === id);
    if (!tour) return notFound();

    // SEO title
    document.title = `Nóku Travel — ${tour.name || 'Tour'}`;

    // HERO
    setText('tourName', tour.name || 'Tour');
    const metaParts = [tour.duration, tour.groupSize, tour.difficulty].filter(Boolean);
    setText('tourMeta', metaParts.join(' • '));
    setText('tourPrice', tour.price || '');
    setText('tourLong', tour.longDescription || tour.description || '');

    // GALERÍA
    const gal = $('tourGallery');
    if (gal) {
      const photos = Array.isArray(tour.photos) ? tour.photos : [];
      gal.innerHTML = photos.map((p, i) => {
        const span2 = i === 0 ? 'span-2' : '';
        if (isImageLike(p)) {
          const alt = `${tour.name || 'Tour'} photo ${i + 1}`;
          return `
            <figure class="tour-photo ${span2}">
              <img src="${p}" alt="${alt}" loading="lazy" decoding="async"
                   sizes="(min-width:1024px) 33vw, (min-width:700px) 50vw, 100vw">
            </figure>`;
        }
        return `<div class="tour-photo ${span2}" aria-label="Photo placeholder">${String(p)}</div>`;
      }).join('');
    }

    // HIGHLIGHTS
    const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
    setHTML('tourHighlights', highlights.map(h => `<li>${h}</li>`).join(''));

    // WHAT TO BRING (con ✔ y sin bullets)
    ensureBringStyles();
    const bring = Array.isArray(tour.whatToBring) ? tour.whatToBring : [];
    setHTML('tourBring', bring.map(item => `<li>${item}</li>`).join(''));

    // SCHEDULE (acepta "HH:MM - Texto" o {time:"", text:""})
    const sched = Array.isArray(tour.schedule) ? tour.schedule : [];
    setHTML('tourSchedule', sched.map(s => {
      if (typeof s === 'object' && s) {
        const time = s.time ?? '';
        const text = s.text ?? '';
        return `
          <div class="tour-sched-row">
            <span class="badge">${time}</span>
            <span class="tour-sched-text">${text}</span>
          </div>`;
      }
      const [time, ...rest] = String(s).split(' - ');
      return `
        <div class="tour-sched-row">
          <span class="badge">${time || ''}</span>
          <span class="tour-sched-text">${rest.join(' - ')}</span>
        </div>`;
    }).join(''));

    // INCLUDES (acepta string o array; si es array, renderiza como lista)
    const includesEl = $('tourIncludes');
    if (includesEl) {
      if (Array.isArray(tour.includes)) {
        includesEl.innerHTML = `<ul class="list">${tour.includes.map(x => `<li>${x}</li>`).join('')}</ul>`;
      } else {
        includesEl.textContent = tour.includes || '';
      }
    }

    // ===== OPTIONS (para combos / tours con variantes de precio) =====
    const optionsSection = $('tourOptionsSection');
    const optionsContainer = $('tourOptions');

    if (optionsSection && optionsContainer && tour.options && typeof tour.options === 'object') {
      const entries = Object.entries(tour.options).filter(([label, price]) => label && price);
      if (entries.length) {
        optionsSection.hidden = false;

        optionsContainer.innerHTML = entries.map(([label, price]) => {
          // Resalta si parece un combo grande (3 in 1 / 4 in 1 / Hot Springs)
          const highlight =
            /3 in 1/i.test(label) ||
            /4 in 1/i.test(label) ||
            /Hot Springs/i.test(label)
              ? ' tour-option--highlight'
              : '';
          return `
            <article class="tour-option${highlight}">
              <h3 class="tour-option__title">${label}</h3>
              <div class="tour-option__price">${price}</div>
            </article>`;
        }).join('');
      }
    }


    // CTA (pasa el nombre del tour al formulario de contacto)
    const cta = $('ctaBook');
    if (cta) {
      cta.href = buildContactURL(tour.name || '');
      cta.setAttribute('aria-label', `Open contact form to ask about ${tour.name || 'this tour'}`);
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
