const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dbModule = require('./db');

const app = express();
const port = process.env.PORT || 8080;
const uploadsDir = path.join(__dirname, 'data', 'uploads');
const privateAssetDir = path.join(__dirname, 'asset', 'private');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(privateAssetDir)) {
  fs.mkdirSync(privateAssetDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '80mb' }));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/data/uploads', express.static(path.join(__dirname, 'data', 'uploads')));

app.get('/asset/private/:fileName', (req, res) => {
  const allowedFiles = new Set([
    'preloader-logo.png',
    'header-logo.png',
  ]);
  const { fileName } = req.params;

  if (!allowedFiles.has(fileName)) {
    return res.status(403).send('Forbidden');
  }

  const filePath = path.join(privateAssetDir, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType =
    ext === '.svg' ? 'image/svg+xml' :
    ext === '.png' ? 'image/png' :
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.sendFile(filePath);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function normalizePoint(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    location: row.location,
    condition: row.condition,
    notes: row.notes,
    lat: row.lat,
    lng: row.lng,
    lampType: row.lampType,
    lampPower: row.lampPower,
    poleHeight: row.poleHeight,
    panelId: row.panelId,
    meterNumber: row.meterNumber,
    panelCapacity: row.panelCapacity,
    panelPhase: row.panelPhase,
    photoData: row.photoData,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

app.get('/api/points', async (req, res) => {
  const points = await dbModule.getPoints();
  res.json(points.map(normalizePoint));
});

app.post('/api/points/bulk', async (req, res) => {
  const points = Array.isArray(req.body.points) ? req.body.points : [];
  const sanitized = points.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    location: item.location || null,
    condition: item.condition,
    notes: item.notes || null,
    lat: item.lat,
    lng: item.lng,
    lampType: item.lampType || null,
    lampPower: item.lampPower ?? null,
    poleHeight: item.poleHeight ?? null,
    panelId: item.panelId || null,
    meterNumber: item.meterNumber || null,
    panelCapacity: item.panelCapacity ?? null,
    panelPhase: item.panelPhase || null,
    photoData: item.photoData || null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  }));

  const count = await dbModule.replacePoints(sanitized);
  res.json({ ok: true, count });
});

app.get('/api/export', async (req, res) => {
  const points = await dbModule.getPoints();
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.1',
    points: points.map(normalizePoint),
  };
  res.setHeader('Content-Disposition', 'attachment; filename="spot_export.json"');
  res.json(exportData);
});

app.post('/api/import', async (req, res) => {
  const points = Array.isArray(req.body.points) ? req.body.points : [];
  const merge = Boolean(req.body.merge);
  const current = await dbModule.getPoints();
  const merged = merge ? current.concat(points) : points;
  const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
  const count = await dbModule.replacePoints(unique);
  res.json({ ok: true, count, merge });
});

app.post('/api/upload-image', async (req, res) => {
  const { dataUrl, name, location, meterNumber } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Data gambar tidak ditemukan' });
  }

  function sanitizeFileName(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_\-]/g, '')
      .slice(0, 100);
  }

  const matches = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ ok: false, error: 'Format gambar tidak didukung' });
  }

  const mimeType = matches[1];
  const base64Data = matches[3];
  const extensions = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const ext = extensions[mimeType] || '.png';
  const safeName = sanitizeFileName(name) || 'panel';
  const safeLocation = sanitizeFileName(location) || 'lokasi';
  const safeMeterNumber = sanitizeFileName(meterNumber) || 'idpelanggan';
  const fileName = `${safeName}_${safeLocation}_${safeMeterNumber}_${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  try {
    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
    res.json({ ok: true, url: `/data/uploads/${fileName}` });
  } catch (error) {
    console.error('Upload image failed:', error);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan gambar' });
  }
});

app.post('/api/delete-image', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.startsWith('/data/uploads/')) {
    return res.status(400).json({ ok: false, error: 'URL gambar tidak valid' });
  }

  const fileName = path.basename(url);
  const filePath = path.join(uploadsDir, fileName);
  if (path.relative(uploadsDir, filePath).startsWith('..')) {
    return res.status(400).json({ ok: false, error: 'Path gambar tidak valid' });
  }

  try {
    await fs.promises.unlink(filePath);
    res.json({ ok: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json({ ok: true, warning: 'File sudah tidak ada' });
    }
    console.error('Delete image failed:', error);
    res.status(500).json({ ok: false, error: 'Gagal menghapus file gambar' });
  }
});

app.get('/api/backup-db', (req, res) => {
  res.download(dbModule.dbFile, 'spot.json');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, async () => {
  await dbModule.init();
  console.log(`SPOT server running on http://localhost:${port}`);
});
