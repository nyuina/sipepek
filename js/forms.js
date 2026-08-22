/**
 * Modul form dan UI
 */

import { POINT_TYPES, CONDITIONS } from './config.js';
import { getPanels, getLampsForPanel, getPanelForLamp, countLampsForPanel } from './groups.js';

const form = () => document.getElementById('point-form');
let currentPhotoData = null;

export function initFormHandlers({ onSubmit, onCancel, onTypeChange }) {
  form().addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit(collectFormData());
  });

  document.getElementById('btn-cancel').addEventListener('click', onCancel);
  document.getElementById('point-type').addEventListener('change', (e) => {
    toggleTypeFields(e.target.value);
    onTypeChange?.(e.target.value);
  });

  document.getElementById('point-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      currentPhotoData = null;
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      setPhotoPreview(dataUrl, dataUrl);

      const metadata = {
        name: document.getElementById('point-name').value.trim(),
        location: document.getElementById('point-location').value.trim(),
        meterNumber: document.getElementById('meter-number').value.trim(),
      };
      const uploadedUrl = await uploadImage(dataUrl, metadata);
      if (uploadedUrl) {
        currentPhotoData = uploadedUrl;
        setPhotoPreview(uploadedUrl, uploadedUrl);
      } else {
        currentPhotoData = null;
        alert('Gagal mengunggah gambar. Coba lagi.');
      }
    };
    reader.readAsDataURL(file);
  });

  const previewImg = document.getElementById('photo-preview-img');
  const previewLink = document.createElement('a');
  previewLink.href = '#';
  previewLink.className = 'image-popup-link';
  previewLink.style.display = 'inline-block';
  previewLink.style.width = '100%';
  previewLink.style.cursor = 'zoom-in';
  previewImg.parentNode.insertBefore(previewLink, previewImg);
  previewLink.appendChild(previewImg);

  bindMagnificPopup(previewLink);
}

export function toggleTypeFields(type) {
  document.getElementById('fields-lampu').classList.toggle('hidden', type !== 'lampu');
  document.getElementById('fields-panel').classList.toggle('hidden', type !== 'panel');
}

export function collectFormData() {
  const type = document.getElementById('point-type').value;
  const base = {
    id: document.getElementById('point-id').value || null,
    type,
    name: document.getElementById('point-name').value.trim(),
    location: document.getElementById('point-location').value.trim(),
    condition: document.getElementById('point-condition').value,
    notes: document.getElementById('point-notes').value.trim(),
    lat: parseFloat(document.getElementById('point-lat').value),
    lng: parseFloat(document.getElementById('point-lng').value),
  };

  if (type === 'lampu') {
    base.lampType = document.getElementById('lamp-type').value;
    base.lampPower = document.getElementById('lamp-power').value
      ? parseInt(document.getElementById('lamp-power').value, 10)
      : null;
    base.poleHeight = document.getElementById('pole-height').value
      ? parseInt(document.getElementById('pole-height').value, 10)
      : null;
    const panelId = document.getElementById('lamp-panel').value;
    if (panelId) base.panelId = panelId;
  } else {
    base.meterNumber = document.getElementById('meter-number').value.trim();
    base.panelCapacity = document.getElementById('panel-capacity').value
      ? parseFloat(document.getElementById('panel-capacity').value)
      : null;
    base.panelPhase = document.getElementById('panel-phase').value;
    if (currentPhotoData) base.photoData = currentPhotoData;
  }

  return base;
}

export function fillForm(point, allPoints = []) {
  document.getElementById('point-id').value = point.id;
  document.getElementById('point-type').value = point.type;
  document.getElementById('point-name').value = point.name;
  document.getElementById('point-location').value = point.location || '';
  document.getElementById('point-condition').value = point.condition;
  document.getElementById('point-notes').value = point.notes || '';
  document.getElementById('point-lat').value = point.lat;
  document.getElementById('point-lng').value = point.lng;

  toggleTypeFields(point.type);

  if (point.type === 'lampu') {
    document.getElementById('lamp-type').value = point.lampType || 'LED';
    document.getElementById('lamp-power').value = point.lampPower ?? '40';
    document.getElementById('pole-height').value = point.poleHeight ?? '7';
    updatePanelSelect(allPoints, point.panelId || '', point.id);
    currentPhotoData = null;
    setPhotoPreview(null);
  } else {
    document.getElementById('meter-number').value = point.meterNumber || '';
    document.getElementById('panel-capacity').value = point.panelCapacity ?? '';
    document.getElementById('panel-phase').value = point.panelPhase || '3';
    currentPhotoData = point.photoData || null;
    setPhotoPreview(currentPhotoData);
  }

  updateCoordsDisplay(point.lat, point.lng);
  document.getElementById('btn-submit').textContent = 'Perbarui Titik';
  document.getElementById('btn-cancel').hidden = false;
}

export function resetForm(allPoints = []) {
  form().reset();
  document.getElementById('point-id').value = '';
  document.getElementById('point-lat').value = '';
  document.getElementById('point-lng').value = '';
  currentPhotoData = null;
  setPhotoPreview(null);
  toggleTypeFields('lampu');
  updatePanelSelect(allPoints);
  updateCoordsDisplay(null, null);
  document.getElementById('btn-submit').textContent = 'Simpan Titik';
  document.getElementById('btn-cancel').hidden = true;
}

export function updatePanelSelect(allPoints, selectedId = '', excludeLampId = null) {
  const select = document.getElementById('lamp-panel');
  const panels = getPanels(allPoints);

  select.innerHTML = '<option value="">— Tidak terhubung —</option>';
  panels.forEach((panel) => {
    const opt = document.createElement('option');
    opt.value = panel.id;
    opt.textContent = `${panel.name}${panel.meterNumber ? ' (' + panel.meterNumber + ')' : ''}`;
    select.appendChild(opt);
  });
  select.value = selectedId || '';
}

export function updateCoordsDisplay(lat, lng) {
  const el = document.querySelector('#coords-display .coords-value');
  if (lat != null && lng != null) {
    el.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    el.classList.add('set');
  } else {
    el.textContent = 'Klik peta untuk menentukan lokasi';
    el.classList.remove('set');
  }
}

export function setCoords(lat, lng) {
  document.getElementById('point-lat').value = lat;
  document.getElementById('point-lng').value = lng;
  updateCoordsDisplay(lat, lng);
}

function setPhotoPreview(dataUrl, previewHref = null) {
  const preview = document.getElementById('photo-preview');
  const img = document.getElementById('photo-preview-img');
  const previewLink = document.querySelector('#photo-preview .image-popup-link');
  if (!dataUrl) {
    if (previewLink) previewLink.href = '#';
    preview.classList.add('hidden');
    img.src = '';
    return;
  }
  if (previewLink) previewLink.href = previewHref || dataUrl;
  img.src = dataUrl;
  preview.classList.remove('hidden');
  openPreviewPopup(previewLink?.href || dataUrl);
}

function openPreviewPopup(src) {
  if (!src || typeof $ !== 'function' || !$.magnificPopup) return;
  $.magnificPopup.open({
    items: { src },
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    mainClass: 'mfp-img-mobile',
    image: {
      verticalFit: true,
      titleSrc: 'alt',
    },
  });
}

async function uploadImage(dataUrl, metadata = {}) {
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, ...metadata }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.ok ? result.url : null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

export async function deleteUploadedImage(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return { ok: false, error: 'URL tidak valid' };
  }

  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: photoUrl }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return { ok: false, error: result?.error || 'Gagal menghapus gambar' };
    }

    const result = await response.json();
    return { ok: result.ok, ...result };
  } catch (error) {
    console.error('Delete image failed:', error);
    return { ok: false, error: 'Gagal menghubungi server untuk menghapus gambar' };
  }
}

function bindMagnificPopup(element) {
  if (typeof $ !== 'function' || !$.magnificPopup) return;
  if (!element) return;

  element.addEventListener('click', (event) => {
    event.preventDefault();
    const src = element.getAttribute('href');
    if (!src || src === '#') return;

    $.magnificPopup.open({
      items: { src },
      type: 'image',
      closeOnContentClick: true,
      closeBtnInside: false,
      mainClass: 'mfp-img-mobile',
      image: {
        verticalFit: true,
        titleSrc: 'alt',
      },
    });
  });
}

export function getSelectedType() {
  return document.getElementById('point-type').value;
}

export function switchToFormTab() {
  document.querySelector('.tab[data-tab="form"]').click();
}

/* ---- List rendering ---- */

function renderPanelGroup(panel, lamps, activeId, onItemClick) {
  return `
    <li class="point-item panel-group-heading${panel.id === activeId ? ' active' : ''}" data-id="${panel.id}">
      <div class="point-badge panel">${POINT_TYPES.panel.icon}</div>
      ${panel.photoData ? `<div class="point-thumb"><img src="${panel.photoData}" alt="Foto panel ${escapeHtml(panel.name)}"></div>` : ''}
      <div class="point-info">
        <h4>${escapeHtml(panel.name)}${panel.meterNumber ? ` (${escapeHtml(panel.meterNumber)})` : ''}</h4>
        <p>⚡ ${lamps.length} titik lampu terhubung</p>
      </div>
      <span class="condition-badge condition-${panel.condition}">${CONDITIONS[panel.condition]}</span>
    </li>
    ${lamps
      .map((lamp) => {
        const sub = escapeHtml(lamp.location || 'Lokasi tidak diisi');
        return `
      <li class="point-item grouped-item${lamp.id === activeId ? ' active' : ''}" data-id="${lamp.id}">
        <div class="point-badge ${lamp.type}">${POINT_TYPES[lamp.type].icon}</div>
        <div class="point-info">
          <h4>${escapeHtml(lamp.name)}</h4>
          <p>${sub}</p>
        </div>
        <span class="condition-badge condition-${lamp.condition}">${CONDITIONS[lamp.condition]}</span>
      </li>`;
      })
      .join('')}
  `;
}

function renderUngroupedLamps(lamps, activeId, onItemClick) {
  return lamps
    .map((lamp) => {
      const sub = escapeHtml(lamp.location || 'Lokasi tidak diisi');
      return `
    <li class="point-item${lamp.id === activeId ? ' active' : ''}" data-id="${lamp.id}">
      <div class="point-badge ${lamp.type}">${POINT_TYPES[lamp.type].icon}</div>
      <div class="point-info">
        <h4>${escapeHtml(lamp.name)}</h4>
        <p>${sub}</p>
      </div>
      <span class="condition-badge condition-${lamp.condition}">${CONDITIONS[lamp.condition]}</span>
    </li>`;
    })
    .join('');
}

export function renderPointList(points, allPoints, activeId, onItemClick) {
  const list = document.getElementById('point-list');

  if (points.length === 0) {
    list.innerHTML = '<li class="empty-list">Belum ada titik tersimpan.<br>Tambahkan titik baru melalui tab "Tambah Data".</li>';
    updateCounts(0, 0);
    return;
  }

  const lampuCount = allPoints.filter((p) => p.type === 'lampu').length;
  const panelCount = allPoints.filter((p) => p.type === 'panel').length;
  updateCounts(lampuCount, panelCount);

  const visiblePanels = points.filter((p) => p.type === 'panel');
  const visibleLamps = points.filter((p) => p.type === 'lampu');
  const lampsByPanel = new Map();

  visibleLamps.forEach((lamp) => {
    if (lamp.panelId) {
      const panel = getPanelForLamp(allPoints, lamp);
      if (panel) {
        const key = panel.id;
        if (!lampsByPanel.has(key)) lampsByPanel.set(key, { panel, lamps: [] });
        lampsByPanel.get(key).lamps.push(lamp);
        return;
      }
    }
    if (!lampsByPanel.has('ungrouped')) lampsByPanel.set('ungrouped', { panel: null, lamps: [] });
    lampsByPanel.get('ungrouped').lamps.push(lamp);
  });

  visiblePanels.forEach((panel) => {
    if (!lampsByPanel.has(panel.id)) {
      lampsByPanel.set(panel.id, { panel, lamps: [] });
    }
  });

  let html = '';

  if (visiblePanels.length > 0 || lampsByPanel.size > 0) {
    const panelHeaders = Array.from(lampsByPanel.values()).filter((group) => group.panel);
    panelHeaders.forEach(({ panel, lamps }) => {
      html += renderPanelGroup(panel, lamps, activeId, onItemClick);
    });

    if (lampsByPanel.has('ungrouped')) {
      html += '<li class="group-heading">Lampu tanpa panel</li>';
      html += renderUngroupedLamps(lampsByPanel.get('ungrouped').lamps, activeId, onItemClick);
    }
  } else {
    html = points
      .map((p) => {
        let sub = escapeHtml(p.location || 'Lokasi tidak diisi');
        if (p.type === 'panel') {
          const n = countLampsForPanel(allPoints, p.id);
          sub = `⚡ ${n} titik lampu terhubung`;
        } else if (p.panelId) {
          const panel = getPanelForLamp(allPoints, p);
          sub = panel ? `🔗 ${escapeHtml(panel.name)}` : sub;
        }
        return `
      <li class="point-item${p.id === activeId ? ' active' : ''}" data-id="${p.id}">
        <div class="point-badge ${p.type}">${POINT_TYPES[p.type].icon}</div>
        ${p.type === 'panel' && p.photoData ? `<div class="point-thumb"><img src="${p.photoData}" alt="Foto panel ${escapeHtml(p.name)}"></div>` : ''}
        <div class="point-info">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${sub}</p>
        </div>
        <span class="condition-badge condition-${p.condition}">${CONDITIONS[p.condition]}</span>
      </li>`;
      })
      .join('');
  }

  list.innerHTML = html;

  list.querySelectorAll('.point-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      onItemClick(points.find((p) => p.id === id));
    });
  });
}

function updateCounts(lampu, panel) {
  document.getElementById('count-lampu').textContent = lampu;
  document.getElementById('count-panel').textContent = panel;
}

export function filterPoints(points, search, typeFilter) {
  return points.filter((p) => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.meterNumber && p.meterNumber.toLowerCase().includes(q));
    return matchType && matchSearch;
  });
}

/* ---- Modal ---- */

export function showDetailModal(point, allPoints, onEdit, onDelete, onGroupChange, onLampClick) {
  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-body');
  const groupSection = document.getElementById('modal-group-section');
  const typeInfo = POINT_TYPES[point.type];

  let extraRows = '';
  if (point.type === 'lampu') {
    const panel = getPanelForLamp(allPoints, point);
    extraRows = `
      <div class="detail-row"><span class="detail-label">Jenis Lampu</span><span class="detail-value">${point.lampType || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Daya</span><span class="detail-value">${point.lampPower ? point.lampPower + ' W' : '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Tinggi Tiang</span><span class="detail-value">${point.poleHeight ? point.poleHeight + ' m' : '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Panel Meter</span><span class="detail-value">${panel ? escapeHtml(panel.name) : 'Tidak terhubung'}</span></div>`;
    groupSection.classList.add('hidden');
    groupSection.innerHTML = '';
  } else {
    extraRows = `
      <div class="detail-row"><span class="detail-label">Nomor Meter</span><span class="detail-value">${escapeHtml(point.meterNumber || '-')}</span></div>
      <div class="detail-row"><span class="detail-label">Kapasitas</span><span class="detail-value">${point.panelCapacity ? point.panelCapacity + ' kVA' : '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Fase</span><span class="detail-value">${point.panelPhase === '1' ? '1 Fase' : '3 Fase'}</span></div>`;
    renderGroupSection(groupSection, point, allPoints, onGroupChange, onLampClick);
  }

  const lampCount = point.type === 'panel' ? countLampsForPanel(allPoints, point.id) : 0;
  const titleExtra = point.type === 'panel' ? ` <span class="lamp-count-badge">${lampCount} lampu</span>` : '';
  const photoSection = point.photoData
    ? `<div class="detail-photo"><img src="${point.photoData}" alt="Foto ${escapeHtml(point.name)}"></div>`
    : '';

  body.innerHTML = `
    <h3>${typeInfo.icon} ${escapeHtml(point.name)}${titleExtra}</h3>
    ${photoSection}
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">Jenis</span><span class="detail-value">${typeInfo.label}</span></div>
      <div class="detail-row"><span class="detail-label">Lokasi</span><span class="detail-value">${escapeHtml(point.location || '-')}</span></div>
      <div class="detail-row"><span class="detail-label">Kondisi</span><span class="detail-value">${CONDITIONS[point.condition]}</span></div>
      ${extraRows}
      <div class="detail-row"><span class="detail-label">Koordinat</span><span class="detail-value">${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}</span></div>
      ${point.notes ? `<div class="detail-row"><span class="detail-label">Catatan</span><span class="detail-value">${escapeHtml(point.notes)}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Diperbarui</span><span class="detail-value">${formatDate(point.updatedAt)}</span></div>
    </div>`;

  document.getElementById('modal-edit').onclick = () => {
    modal.close();
    onEdit(point);
  };
  document.getElementById('modal-delete').onclick = () => {
    modal.close();
    onDelete(point);
  };

  const detailPhotoDiv = body.querySelector('.detail-photo');
  if (detailPhotoDiv && point.photoData) {
    detailPhotoDiv.innerHTML = `<a class="image-popup-link" href="${point.photoData}"><img src="${point.photoData}" alt="Foto ${escapeHtml(point.name)}"></a>`;
    const detailLink = detailPhotoDiv.querySelector('a.image-popup-link');
    bindMagnificPopup(detailLink);
  }

  modal.showModal();
}

function renderGroupSection(container, panel, allPoints, onGroupChange, onLampClick) {
  const connected = getLampsForPanel(allPoints, panel.id);
  const allLamps = allPoints.filter((p) => p.type === 'lampu');
  const connectedIds = new Set(connected.map((l) => l.id));

  container.classList.remove('hidden');
  container.innerHTML = `
    <h4 class="group-title">Kelola Titik Lampu Terhubung</h4>
    <p class="group-desc">Centang lampu yang disuplai oleh panel meter ini.</p>
    <div class="group-list" id="group-lamp-list">
      ${allLamps.length === 0
        ? '<p class="group-empty">Belum ada titik lampu. Tambahkan lampu terlebih dahulu.</p>'
        : allLamps.map((lamp) => {
            const otherPanel = lamp.panelId && lamp.panelId !== panel.id
              ? getPanelForLamp(allPoints, lamp)
              : null;
            const disabled = otherPanel ? ' disabled' : '';
            const hint = otherPanel
              ? ` <span class="group-hint">(terhubung ke ${escapeHtml(otherPanel.name)})</span>`
              : '';
            return `
              <label class="group-item${connectedIds.has(lamp.id) ? ' checked' : ''}${disabled ? ' disabled' : ''}">
                <input type="checkbox" value="${lamp.id}"${connectedIds.has(lamp.id) ? ' checked' : ''}${disabled}>
                <span class="group-item-info">
                  <strong>${escapeHtml(lamp.name)}</strong>
                  <small>${escapeHtml(lamp.location || 'Tanpa lokasi')}${hint}</small>
                </span>
              </label>`;
          }).join('')}
    </div>
    ${connected.length > 0 ? `
      <ul class="connected-lamps">
        ${connected.map((l) => `
          <li><button type="button" class="link-btn" data-lamp-id="${l.id}">💡 ${escapeHtml(l.name)}</button></li>
        `).join('')}
      </ul>` : ''}
    <button type="button" class="btn btn-primary btn-sm" id="btn-save-group">Simpan Grup</button>`;

  container.querySelector('#btn-save-group')?.addEventListener('click', () => {
    const checked = [...container.querySelectorAll('#group-lamp-list input:checked')].map((cb) => cb.value);
    onGroupChange(panel.id, checked);
  });

  container.querySelectorAll('.link-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lamp = allPoints.find((p) => p.id === btn.dataset.lampId);
      if (lamp) onLampClick(lamp);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function initTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

export function initModalClose() {
  const modal = document.getElementById('detail-modal');
  document.getElementById('modal-close').addEventListener('click', () => {
    modal.close();
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.close();
    }
  });
}

export function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
    padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600',
    zIndex: '9999', color: 'white',
    background: isError ? '#ef4444' : '#10b981',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}
