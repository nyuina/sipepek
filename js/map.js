/**
 * Modul peta OpenStreetMap (Leaflet)
 */

import { CONFIG, POINT_TYPES } from './config.js';

let map = null;
let markersLayer = null;
let linesLayer = null;
let tempMarker = null;
let onMapClick = null;
let showLines = true;
let highlightPanelId = null;

function createIcon(type, isTemp = false, isHighlighted = false) {
  const info = POINT_TYPES[type] || POINT_TYPES.lampu;
  const highlightClass = isHighlighted ? ' highlighted' : '';
  return L.divIcon({
    className: '',
    html: `<div class="marker-icon ${type}${isTemp ? ' temp-marker' : ''}${highlightClass}">${info.icon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function initMap(containerId, clickHandler) {
  onMapClick = clickHandler;

  const osmLayer = L.tileLayer(CONFIG.mapTileUrl, {
    attribution: CONFIG.mapAttribution,
    maxZoom: 19,
  });

  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Sumber: Esri, Maxar, Earthstar Geographics, and the GIS user community',
      maxZoom: 19,
    }
  );

  map = L.map(containerId, {
    center: CONFIG.defaultCenter,
    zoom: CONFIG.defaultZoom,
    layers: [osmLayer],
  });

  const baseMaps = {
    'OpenStreetMap': osmLayer,
    'Citra Satelit': satelliteLayer,
  };

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  map.createPane('connectionPane');
  map.getPane('connectionPane').style.zIndex = 400;

  linesLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
  });

  return map;
}

export function getMap() {
  return map;
}

function offsetLatLng(from, to, offsetPixels) {
  if (!map) return from;

  const fromPoint = map.latLngToLayerPoint(from);
  const toPoint = map.latLngToLayerPoint(to);
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return from;

  const ratio = offsetPixels / length;
  const offsetPoint = L.point(fromPoint.x + dx * ratio, fromPoint.y + dy * ratio);
  return map.layerPointToLatLng(offsetPoint);
}

function orderLampsByRoute(panel, lamps) {
  const remaining = [...lamps];
  const route = [];
  let current = { lat: panel.lat, lng: panel.lng };

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    remaining.forEach((lamp, index) => {
      const dx = lamp.lng - current.lng;
      const dy = lamp.lat - current.lat;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    route.push(remaining.splice(nearestIndex, 1)[0]);
    current = route[route.length - 1];
  }

  return route;
}

export function setTempMarker(lat, lng, type = 'lampu') {
  removeTempMarker();
  if (lat == null || lng == null) return;

  tempMarker = L.marker([lat, lng], { icon: createIcon(type, true) }).addTo(map);
  map.panTo([lat, lng]);
}

export function removeTempMarker() {
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

export function renderMarkers(points, onMarkerClick, connections = []) {
  markersLayer.clearLayers();

  const highlightedLampIds = highlightPanelId
    ? new Set(
        connections
          .find((c) => c.panel.id === highlightPanelId)
          ?.lamps.map((l) => l.id) ?? []
      )
    : null;

  points.forEach((point) => {
    const isHighlighted =
      point.id === highlightPanelId ||
      (highlightedLampIds && highlightedLampIds.has(point.id));

    const marker = L.marker([point.lat, point.lng], {
      icon: createIcon(point.type, false, isHighlighted),
    });

    marker.on('click', () => onMarkerClick(point));
    marker.addTo(markersLayer);
  });
}

export function renderConnectionLines(connections, activePanelId = null) {
  linesLayer.clearLayers();
  if (!showLines) return;

  connections.forEach(({ panel, lamps }) => {
    const isActive = activePanelId && panel.id === activePanelId;
    const orderedLamps = orderLampsByRoute(panel, lamps);
    const panelPoint = L.latLng(panel.lat, panel.lng);

    let previousPoint = panelPoint;
    orderedLamps.forEach((lamp, index) => {
      const currentPoint = L.latLng(lamp.lat, lamp.lng);
      // determine pixel distance between points to choose proportional offset and weight
      const fromPt = map.latLngToLayerPoint(previousPoint);
      const toPt = map.latLngToLayerPoint(currentPoint);
      const dx = toPt.x - fromPt.x;
      const dy = toPt.y - fromPt.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      // offset a bit from the marker toward the line; scale with distance but clamp
      const offsetPx = Math.max(10, Math.min(30, Math.round(segLen * 0.06)));
      const offsetStart = offsetLatLng(previousPoint, currentPoint, offsetPx);
      const offsetEnd = offsetLatLng(currentPoint, previousPoint, offsetPx);

      // choose weight proportional to segment length, clamped for readability
      const baseWeight = Math.max(2, Math.min(6, Math.round(2 + segLen / 120)));
      const weight = isActive ? baseWeight + 1 : baseWeight;

      const line = L.polyline(
        [offsetStart, offsetEnd],
        {
          pane: 'connectionPane',
          color: isActive ? '#2563eb' : '#94a3b8',
          weight: weight,
          opacity: isActive ? 0.95 : 0.7,
          dashArray: isActive ? null : '6 4',
          lineCap: 'round',
        }
      );
      line.addTo(linesLayer);
      previousPoint = currentPoint;
    });
  });
}

export function setShowLines(visible) {
  showLines = visible;
  if (!visible) linesLayer.clearLayers();
}

export function setHighlightPanel(panelId) {
  highlightPanelId = panelId;
}

export function clearHighlight() {
  highlightPanelId = null;
}

export function flyToPoint(lat, lng, zoom = 17) {
  map.flyTo([lat, lng], zoom, { duration: 0.8 });
}

export function locateUser(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError('Geolokasi tidak didukung browser ini');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
    () => onError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.'),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

export function fitBounds(points) {
  if (points.length === 0) return;
  const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
}
