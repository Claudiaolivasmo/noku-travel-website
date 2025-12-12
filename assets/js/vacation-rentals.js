// vacation-rentals.js — improved
// Loads assets/data/vacation-rentals.json

async function loadRentals() {
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


function createCard(r) {
  // Ensure we have safe defaults
  const price = r.price_night || r.price || '$--';
  const guests = r.max_guests || r.capacity || '-';
  const beds = r.beds ?? '-';
  const img = r.image || 'assets/img/rentals/placeholder.jpg';
  const propertyUrl = `property.html?id=${encodeURIComponent(r.id)}`;

  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <div class="card__media">
      <img src="${img}" alt="${escapeHtml(r.name)}" class="img-cover" loading="lazy" decoding="async">
      ${ r.badge ? `<span class="card__badge">${escapeHtml(r.badge)}</span>` : '' }
    </div>

    <div class="card__pad">
      <h3 class="card__title">${escapeHtml(r.name)}</h3>
      <p class="card__text clamp-2">${escapeHtml(truncate(r.short_description || r.description || '', 140))}</p>

      <div class="card__meta" aria-hidden="false">
        <span class="badge badge--soft">${guests} guests</span>
        <span class="badge">${beds} bed(s)</span>
      </div>

      <div class="card__cta" style="margin-top:.6rem;display:flex;gap:.5rem;align-items:center;">
        <!-- VIEW: link to property page -->
        <a class="btn" href="${propertyUrl}" aria-label="View ${escapeHtml(r.name)}">View</a>

        <!-- BOOK: external or internal booking -->
        <a class="btn btn--primary" href="${r.book_url || '#'}" data-id="${escapeHtml(r.id)}" ${r.book_url ? 'target="_blank" rel="noopener"' : ''}>Book Now</a>
      </div>
    </div>
  `;
  return article;
}


/* helper: simple escape (avoid XSS when injecting JSON) */
function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function truncate(text, n) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

function renderList(list) {
  const grid = document.getElementById('rentals-grid');
  grid.innerHTML = '';
  grid.setAttribute('aria-busy', 'true');

  if (!list || !list.length) {
    const p = document.createElement('p');
    p.className = 'text';
    p.textContent = 'No cabins available.';
    grid.appendChild(p);
    grid.setAttribute('aria-busy', 'false');
    return;
  }

  // render cards directly into the grid (grid CSS handles columns)
  const fragment = document.createDocumentFragment();
  list.forEach(r => fragment.appendChild(createCard(r)));
  grid.appendChild(fragment);

  // attach listeners for View buttons
  grid.querySelectorAll('button[data-id]').forEach(b => {
    b.addEventListener('click', (e) => openModal(String(e.currentTarget.dataset.id), list));
  });

  grid.setAttribute('aria-busy', 'false');
}

function openModal(id, list) {
  const item = list.find(x => String(x.id) === String(id));
  if (!item) return;
  document.getElementById('modal-title').textContent = `${item.name}`;
  const body = document.getElementById('modal-body');

  // Build gallery + info - accessible structure
  const galleryHtml = (item.gallery && item.gallery.length)
    ? item.gallery.map((img, i) => `<img src="${img}" alt="${escapeHtml(item.name)} photo ${i+1}" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:.5rem"/>`).join('')
    : `<img src="${item.image || 'assets/img/rentals/placeholder.jpg'}" alt="${escapeHtml(item.name)}" loading="lazy" style="width:100%;height:220px;object-fit:cover;border-radius:6px;margin-bottom:.5rem"/>`;

  const amenities = (item.amenities && item.amenities.length) ? escapeHtml(item.amenities.join(', ')) : '—';
  body.innerHTML = `
    <div style="display:grid;gap:1rem;">
      <div class="modal__gallery">${galleryHtml}</div>
      <div>
        <p class="text">${escapeHtml(item.description || '')}</p>
        <ul class="list" style="margin-top:.6rem;">
          <li><strong>Max guests:</strong> ${item.max_guests ?? '—'}</li>
          <li><strong>Beds:</strong> ${item.beds ?? '—'}</li>
          <li><strong>Amenities:</strong> ${amenities}</li>
        </ul>
        <div style="margin-top:1rem;">
          <a class="btn btn--primary" href="${item.book_url || '#'}" ${item.book_url ? 'target="_blank" rel="noopener"' : ''}>Book now</a>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('modal');
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');

  // Accessibility: focus management
  trapFocus(modal);
}

/* Focus trap (simple): focus first focusable element in modal; return focus to last active after close */
let lastActiveEl = null;
function trapFocus(modal) {
  lastActiveEl = document.activeElement;
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const focusables = modal.querySelectorAll(focusableSelector);
  if (focusables.length) {
    focusables[0].focus();
  } else {
    modal.querySelector('.modal__dialog').focus();
  }

  function keyHandler(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      // keep focus inside modal
      const nodes = Array.from(modal.querySelectorAll(focusableSelector));
      if (nodes.length === 0) { e.preventDefault(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  modal.__keyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  // close on overlay click
  modal.addEventListener('click', modal.__overlayHandler = function (ev) {
    if (ev.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');

  // remove handlers
  if (modal.__keyHandler) document.removeEventListener('keydown', modal.__keyHandler);
  if (modal.__overlayHandler) modal.removeEventListener('click', modal.__overlayHandler);

  // return focus
  if (lastActiveEl) lastActiveEl.focus();
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadRentals();
  window._rentals = data;
  renderList(data);

  // Filters
  const searchEl = document.getElementById('search');
  const guestsEl = document.getElementById('guests');
  const clearEl = document.getElementById('clear');

  function applyFilters() {
    const q = (searchEl.value || '').trim().toLowerCase();
    const g = guestsEl.value;

    const results = data.filter(r => {
      // search
      if (q) {
        const hay = ((r.name || '') + ' ' + (r.description || '') + ' ' + ((r.amenities || []).join(' '))).toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // guests filter: show items that can host AT LEAST the requested number
      if (g) {
        const required = parseInt(g, 10);
        const capacity = parseInt(r.max_guests || r.capacity || 0, 10);
        if (Number.isFinite(required)) {
          if (capacity < required) return false; // skip cabins with smaller capacity
        }
      }
      return true;
    });
    renderList(results);
  }

  searchEl.addEventListener('input', applyFilters);
  guestsEl.addEventListener('change', applyFilters);
  clearEl.addEventListener('click', () => {
    searchEl.value = '';
    guestsEl.value = '';
    applyFilters();
    searchEl.focus();
  });

  // Modal close button
  const modalClose = document.getElementById('modal-close');
  modalClose.addEventListener('click', closeModal);

  // Keyboard accessibility: close modal with Escape if open (backup)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal');
      if (modal && !modal.hidden) closeModal();
    }
  });
});
