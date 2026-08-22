/**
 * Utilitas pengelompokan panel meter & titik lampu
 */

export function getPanels(points) {
  return points.filter((p) => p.type === 'panel');
}

export function getLamps(points) {
  return points.filter((p) => p.type === 'lampu');
}

export function getLampsForPanel(points, panelId) {
  return points.filter((p) => p.type === 'lampu' && p.panelId === panelId);
}

export function getUnassignedLamps(points) {
  return points.filter((p) => p.type === 'lampu' && !p.panelId);
}

export function getPanelById(points, panelId) {
  return points.find((p) => p.id === panelId && p.type === 'panel');
}

export function getPanelForLamp(points, lamp) {
  if (!lamp?.panelId) return null;
  return getPanelById(points, lamp.panelId);
}

/** Set lampu-lampu yang terhubung ke panel (replace seluruh grup) */
export function setPanelLamps(points, panelId, lampIds) {
  const idSet = new Set(lampIds);
  return points.map((p) => {
    if (p.type !== 'lampu') return p;
    if (p.panelId === panelId && !idSet.has(p.id)) {
      const { panelId: _, ...rest } = p;
      return rest;
    }
    if (idSet.has(p.id)) {
      return { ...p, panelId };
    }
    return p;
  });
}

/** Lepas semua lampu dari panel saat panel dihapus */
export function clearPanelReferences(points, panelId) {
  return points.map((p) => {
    if (p.type === 'lampu' && p.panelId === panelId) {
      const { panelId: _, ...rest } = p;
      return rest;
    }
    return p;
  });
}

export function countLampsForPanel(points, panelId) {
  return getLampsForPanel(points, panelId).length;
}

export function getPanelConnections(points) {
  const panels = getPanels(points);
  return panels.map((panel) => ({
    panel,
    lamps: getLampsForPanel(points, panel.id),
  })).filter((g) => g.lamps.length > 0);
}
