const fs = require('fs');
const path = require('path');

const FALLBACK_DATA_PATH = path.join(process.cwd(), 'pux-tracker', 'pux_pilots.json');
const STATE_ID = 'main';
const TABLE_NAME = process.env.SUPABASE_STATE_TABLE || 'pux_dashboard_state';

function readFallbackData() {
  return JSON.parse(fs.readFileSync(FALLBACK_DATA_PATH, 'utf8'));
}

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function getStateUrl() {
  const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
  return `${baseUrl}/rest/v1/${TABLE_NAME}`;
}

async function readSupabaseData() {
  const response = await fetch(`${getStateUrl()}?id=eq.${STATE_ID}&select=data`, {
    method: 'GET',
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  return rows[0]?.data || null;
}

async function writeSupabaseData(data) {
  const response = await fetch(getStateUrl(), {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      id: STATE_ID,
      data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase write failed: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  return rows[0]?.data || data;
}

async function readData() {
  const fallbackData = readFallbackData();

  if (!hasSupabaseConfig()) {
    return {
      data: fallbackData,
      source: 'fallback-json',
      writable: false,
    };
  }

  const data = await readSupabaseData();
  if (data) {
    return {
      data,
      source: 'supabase',
      writable: true,
    };
  }

  const seededData = await writeSupabaseData(fallbackData);
  return {
    data: seededData,
    source: 'supabase-seeded',
    writable: true,
  };
}

async function writeData(data) {
  if (!hasSupabaseConfig()) {
    return {
      data,
      source: 'fallback-json',
      writable: false,
    };
  }

  const savedData = await writeSupabaseData(data);
  return {
    data: savedData,
    source: 'supabase',
    writable: true,
  };
}

module.exports = {
  readData,
  writeData,
};
