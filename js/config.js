/**
 * Konfigurasi aplikasi SPOT
 */

export const CONFIG = {
  storageKey: 'spot_points_data',
  defaultCenter: [-6.2088, 106.8456], // Jakarta
  defaultZoom: 13,
  mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const POINT_TYPES = {
  lampu: {
    label: 'Penerangan Jalan',
    icon: '💡',
    color: '#f59e0b',
  },
  panel: {
    label: 'Panel Meter Listrik',
    icon: '⚡',
    color: '#10b981',
  },
};

export const CONDITIONS = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  tidak_aktif: 'Tidak Aktif',
};
