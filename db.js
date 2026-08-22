const { join } = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const fs = require('fs');

const dataDir = join(__dirname, 'data');
const dbFile = join(dataDir, 'spot.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function init() {
  await db.read();
  db.data ||= { points: [] };
  await db.write();
}

async function getPoints() {
  await db.read();
  return db.data.points || [];
}

async function replacePoints(points) {
  db.data = { points };
  await db.write();
  return points.length;
}

module.exports = {
  init,
  getPoints,
  replacePoints,
  dbFile,
};
