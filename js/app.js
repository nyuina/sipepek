/**
 * SPOT — Main Application
 */

import { loadPoints, savePoints, generateId, exportToJson, importFromJson } from './storage.js';
import {
  initMap, getMap, setTempMarker, removeTempMarker, renderMarkers,
  renderConnectionLines, setShowLines, setHighlightPanel, clearHighlight,
  flyToPoint, locateUser, fitBounds,
} from './map.js';
import { getPanelConnections, setPanelLamps, clearPanelReferences } from './groups.js';
import {
  initFormHandlers, fillForm, resetForm,
  setCoords, getSelectedType, switchToFormTab, updatePanelSelect,
  renderPointList, filterPoints, showDetailModal, deleteUploadedImage,
  initTabs, initModalClose, showToast,
} from './forms.js';

let points = [];
let activePointId = null;

function refreshUI() {
  const connections = getPanelConnections(points);
  const activePanel = activePointId
    ? points.find((p) => p.id === activePointId && p.type === 'panel')
    : null;

  if (activePanel) {
    setHighlightPanel(activePanel.id);
  } else {
    clearHighlight();
  }

  renderMarkers(points, handleMarkerClick, connections);
  renderConnectionLines(connections, activePanel?.id ?? null);

  const search = document.getElementById('search-input').value;
  const typeFilter = document.getElementById('filter-type').value;
  const filtered = filterPoints(points, search, typeFilter);
  renderPointList(filtered, points, activePointId, handleListClick);
}

function handleMapClick(lat, lng) {
  setCoords(lat, lng);
  setTempMarker(lat, lng, getSelectedType());
}

function handleSubmit(data) {
  if (isNaN(data.lat) || isNaN(data.lng)) {
    showToast('Silakan tentukan lokasi di peta terlebih dahulu', true);
    return;
  }

  const now = new Date().toISOString();

  if (data.id) {
    const idx = points.findIndex((p) => p.id === data.id);
    if (idx !== -1) {
      const updated = { ...points[idx], ...data, updatedAt: now };
      if (updated.type === 'lampu' && !data.panelId) {
        delete updated.panelId;
      }
      points[idx] = updated;
      showToast('Titik berhasil diperbarui');
    }
  } else {
    const newPoint = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    if (newPoint.type === 'lampu' && !newPoint.panelId) {
      delete newPoint.panelId;
    }
    points.push(newPoint);
    showToast('Titik berhasil disimpan');
  }

  savePoints(points);
  resetForm(points);
  removeTempMarker();
  activePointId = null;
  refreshUI();
}

function handleCancel() {
  resetForm(points);
  removeTempMarker();
  activePointId = null;
  refreshUI();
}

function openDetail(point) {
  activePointId = point.id;
  showDetailModal(
    point,
    points,
    handleEdit,
    handleDelete,
    handleGroupChange,
    handleLampFromGroup
  );
  refreshUI();
}

function handleMarkerClick(point) {
  openDetail(point);
}

function handleListClick(point) {
  flyToPoint(point.lat, point.lng);
  openDetail(point);
}

function handleLampFromGroup(lamp) {
  flyToPoint(lamp.lat, lamp.lng);
  openDetail(lamp);
}

function handleEdit(point) {
  fillForm(point, points);
  setTempMarker(point.lat, point.lng, point.type);
  switchToFormTab();
}

async function handleDelete(point) {
  const extra = point.type === 'panel'
    ? `\n\n${points.filter((p) => p.panelId === point.id).length} lampu akan lepas dari panel ini.`
    : '';
  if (!confirm(`Hapus titik "${point.name}"?${extra}`)) return;

  if (point.photoData) {
    const result = await deleteUploadedImage(point.photoData);
    if (!result.ok) {
      showToast('Titik dihapus, tetapi gambar tidak dapat dihapus.', true);
    }
  }

  if (point.type === 'panel') {
    points = clearPanelReferences(points, point.id);
  }
  points = points.filter((p) => p.id !== point.id);
  savePoints(points);
  activePointId = null;
  resetForm(points);
  removeTempMarker();
  showToast('Titik dihapus');
  refreshUI();
}

function handleGroupChange(panelId, lampIds) {
  points = setPanelLamps(points, panelId, lampIds);
  const now = new Date().toISOString();
  points = points.map((p) =>
    p.id === panelId ? { ...p, updatedAt: now } : p
  );
  savePoints(points);
  showToast(`${lampIds.length} lampu terhubung ke panel`);

  const panel = points.find((p) => p.id === panelId);
  if (panel) openDetail(panel);
  else refreshUI();
}

function initApp() {
  points = loadPoints();
  updatePanelSelect(points);

  initMap('map', handleMapClick);
  initTabs();
  initModalClose();

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    sidebarToggle.setAttribute('aria-label', collapsed ? 'Buka navigasi' : 'Minimalkan navigasi');

    const mapInstance = getMap();
    if (mapInstance) {
      requestAnimationFrame(() => {
        setTimeout(() => mapInstance.invalidateSize(), 180);
      });
    }
      updateSidebarTogglePos();
  });

  // Mobile: allow swipe gestures on the sidebar header to minimize/expand
  const sidebarHeader = document.querySelector('.sidebar-header');
  let touchStartY = null;
  if (sidebarHeader) {
    sidebarHeader.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sidebarHeader.addEventListener('touchend', (e) => {
      if (touchStartY == null) return;
      const endY = e.changedTouches[0].clientY;
      const delta = touchStartY - endY;
      // swipe up (positive delta) -> expand; swipe down (negative delta) -> collapse
      if (Math.abs(delta) > 30) {
        if (delta > 0) {
          sidebar.classList.remove('collapsed');
        } else {
          sidebar.classList.add('collapsed');
        }
        sidebarToggle.setAttribute('aria-label', sidebar.classList.contains('collapsed') ? 'Buka navigasi' : 'Minimalkan navigasi');
        const mapInstance = getMap();
        if (mapInstance) {
          requestAnimationFrame(() => {
            setTimeout(() => mapInstance.invalidateSize(), 180);
          });
        }
      }
      touchStartY = null;
    }, { passive: true });
  }

    // adjust floating toggle position to sit beside sidebar when open
    function updateSidebarTogglePos() {
      const btn = document.getElementById('sidebar-mobile-toggle');
      if (!btn) return;
      const sb = document.getElementById('sidebar');
      if (sb && !sb.classList.contains('collapsed')) {
        const rect = sb.getBoundingClientRect();
        const left = Math.max(8, rect.right + 12);
        btn.style.left = `${left}px`;
      } else {
        btn.style.left = '12px';
      }
    }

  window.addEventListener('resize', () => {
    const mapInstance = getMap();
    if (mapInstance) {
      requestAnimationFrame(() => mapInstance.invalidateSize());
    }
      updateSidebarTogglePos();
  });

  initFormHandlers({
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onTypeChange: (type) => {
      if (type === 'lampu') updatePanelSelect(points);
      const lat = parseFloat(document.getElementById('point-lat').value);
      const lng = parseFloat(document.getElementById('point-lng').value);
      if (!isNaN(lat) && !isNaN(lng)) setTempMarker(lat, lng, type);
    },
  });

  const handleLocate = () => {
    locateUser(
      (lat, lng) => {
        handleMapClick(lat, lng);
        flyToPoint(lat, lng);
        showToast('Lokasi ditemukan');
      },
      (msg) => showToast(msg, true)
    );
  };

  const locateButton = document.getElementById('btn-locate');
  if (locateButton) {
    locateButton.addEventListener('click', handleLocate);
  }

  const mapLocateButton = document.getElementById('btn-locate-map');
  if (mapLocateButton) {
    mapLocateButton.addEventListener('click', handleLocate);
  }

  // mobile floating toggle (center-left)
  const mobileToggle = document.getElementById('sidebar-mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('collapsed');
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Buka navigasi' : 'Minimalkan navigasi');
      const mapInstance = getMap();
      if (mapInstance) {
        requestAnimationFrame(() => {
          setTimeout(() => mapInstance.invalidateSize(), 180);
        });
      }
    });
  }

  document.getElementById('toggle-lines').addEventListener('change', (e) => {
    setShowLines(e.target.checked);
    refreshUI();
  });

  const toggleLabels = document.getElementById('toggle-labels');
  if (toggleLabels) {
    // initialize
    // lazy import setShowLabels from map module
    import('./map.js').then((m) => {
      m.setShowLabels(toggleLabels.checked);
    });
    toggleLabels.addEventListener('change', (e) => {
      import('./map.js').then((m) => {
        m.setShowLabels(e.target.checked);
        refreshUI();
      });
    });
  }

  document.getElementById('btn-export').addEventListener('click', () => {
    exportToJson(points);
    showToast(`${points.length} titik diekspor`);
  });

  document.getElementById('input-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imported = await importFromJson(file);
      const merge = confirm(
        `Import ${imported.length} titik.\n\nOK = Gabungkan dengan data existing\nBatal = Ganti semua data`
      );
      if (merge) {
        const existingIds = new Set(points.map((p) => p.id));
        imported.forEach((p) => {
          if (!existingIds.has(p.id)) points.push(p);
        });
      } else {
        points = imported;
      }
      savePoints(points);
      updatePanelSelect(points);
      refreshUI();
      if (points.length > 0) fitBounds(points);
      showToast('Import berhasil');
    } catch {
      showToast('Gagal import: format file tidak valid', true);
    }
    e.target.value = '';
  });

  document.getElementById('search-input').addEventListener('input', refreshUI);
  document.getElementById('filter-type').addEventListener('change', refreshUI);

  document.getElementById('detail-modal').addEventListener('close', () => {
    activePointId = null;
    clearHighlight();
    refreshUI();
  });

  refreshUI();
  if (points.length > 0) fitBounds(points);
    updateSidebarTogglePos();
}

document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 1200);
    });
  }

  initApp();
});
