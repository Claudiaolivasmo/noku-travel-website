// assets/js/property.js
// Minimal, nav-free script to load and render a property from JSON.

async function fetchRentals() {
  try {
    const res = await fetch('assets/data/vacation-rentals.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to fetch JSON');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Could not load rentals JSON:', err);
    return [];
  }
}

function getIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrice(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' || !isNaN(Number(v))) return `$${Number(v).toFixed(0)}`;
  return String(v);
}

function buildGallery(images = [], name = '') {
  if (!images || !images.length) {
    return `<div class="gallery"><img src="assets/img/rentals/placeholder.jpg" class="large" alt="${escapeHtml(name)}"></div>`;
  }
  const imgs = images.slice(0, 5);
  const first = imgs[0];
  const rest = imgs.slice(1);
  return `
    <div class="gallery">
      <img src="${escapeHtml(first)}" class="large" alt="${escapeHtml(name)}">
      ${rest.map(src => `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}">`).join('')}
    </div>
  `;
}

function buildPropertyHtml(p) {
  const priceText = formatPrice(p.price_night ?? p.price);
  const galleryHtml = buildGallery(p.gallery || [p.image], p.name);
  const amenitiesHtml = (p.amenities || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
  const locationText = p.location ? `${escapeHtml(p.location.area || '')}${p.location.country ? ', ' + escapeHtml(p.location.country) : ''}` : 'Costa Rica';

  return `
    <h1 class="property-title">${escapeHtml(p.name)}</h1>
    <div class="property-location muted">${locationText}</div>

    ${galleryHtml}

    <div class="grid">
      <div class="left-col">
        <h2>Description</h2>
        <p>${escapeHtml(p.description || '')}</p>

        <h2 style="margin-top:1.5rem;">Amenities</h2>
        <ul class="features">${amenitiesHtml}</ul>
      </div>

      <aside class="info-card" aria-label="Booking information">
        <h3>Your stay</h3>
        <div class="meta-row"><span class="meta-term">Max guests:</span><span class="meta-data">${escapeHtml(String(p.max_guests ?? p.capacity ?? '—'))}</span></div>
        <div class="meta-row"><span class="meta-term">Beds:</span><span class="meta-data">${escapeHtml(String(p.beds ?? '—'))}</span></div>
        <div class="meta-row"><span class="meta-term">Check-in:</span><span class="meta-data">3:00 PM</span></div>
        <div class="meta-row"><span class="meta-term">Check-out:</span><span class="meta-data">11:00 AM</span></div>

        ${ priceText ? `<div class="price-box">${priceText} / night</div>` : `<div class="price-box price-box--hidden"></div>` }

        <div style="margin-top:.75rem;">
          ${ p.book_url ? `<a class="btn-primary" href="${escapeHtml(p.book_url)}" target="_blank" rel="noopener">Book on Airbnb</a>` : `<a class="btn-ghost" href="contact.html">Request booking</a>` }
        </div>
      </aside>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const target = document.getElementById('property-content');
  if (!target) return;

  const id = getIdFromUrl();
  if (!id) {
    target.innerHTML = '<p>No property selected.</p>';
    return;
  }

  const list = await fetchRentals();
  const item = list.find(x => String(x.id) === String(id));
  if (!item) {
    target.innerHTML = '<p>Property not found.</p>';
    return;
  }

  target.innerHTML = buildPropertyHtml(item);

  // Accessibility: focus title
  const title = target.querySelector('.property-title');
  if (title) { title.setAttribute('tabindex', '-1'); title.focus(); }
});
