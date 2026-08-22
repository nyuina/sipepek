/**
 * Modul penyimpanan data (LocalStorage)
 */

import { CONFIG } from './config.js';

export function loadPoints() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePoints(points) {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(points));
}

export function generateId() {
  return `spot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function exportToJson(points) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.1',
    points,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spot_export_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const points = Array.isArray(data) ? data : data.points;
        if (!Array.isArray(points)) throw new Error('Format tidak valid');
        resolve(points);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}
