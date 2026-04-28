const fs = require('fs');
const path = require('path');

const FALLBACK_DATA_PATHS = [
  path.join(process.cwd(), 'pux-tracker', 'pux_pilots.json'),
  path.join(process.cwd(), 'data', 'pux_data.json'),
];
const STATE_ID = 'main';
const TABLE_NAME = process.env.SUPABASE_STATE_TABLE || 'pux_dashboard_state';

function readFallbackData() {
  const dataPath = FALLBACK_DATA_PATHS.find((item) => fs.existsSync(item));
  if (!dataPath) {
    throw new Error('Fallback PUX data file not found');
  }

  return normalizeDataShape(JSON.parse(fs.readFileSync(dataPath, 'utf8')));
}

function cleanText(value) {
  return String(value || '').replace(/<\|FunctionExecuteResult\|>/g, '');
}

function sanitizePoFeedback(feedback) {
  return {
    ...feedback,
    reviewer_name: cleanText(feedback.reviewer_name),
    business_module_goal: cleanText(feedback.business_module_goal),
    resource_coordination: cleanText(feedback.resource_coordination),
    collaboration_model: cleanText(feedback.collaboration_model),
    continue_willingness: cleanText(feedback.continue_willingness),
    kpi_change: cleanText(feedback.kpi_change),
    efficiency_change: cleanText(feedback.efficiency_change),
    milestone_summary: cleanText(feedback.milestone_summary),
  };
}

function sanitizeHighlight(highlight) {
  return {
    ...highlight,
    title: cleanText(highlight.title),
    subtitle: cleanText(highlight.subtitle),
    body: cleanText(highlight.body),
    owner: cleanText(highlight.owner),
    date: cleanText(highlight.date),
  };
}

function sanitizePilot(pilot) {
  return {
    ...pilot,
    name: cleanText(pilot.name),
    product_line: cleanText(pilot.product_line),
    po_name: cleanText(pilot.po_name),
    project: cleanText(pilot.project),
    execution_process: cleanText(pilot.execution_process),
    conclusion: cleanText(pilot.conclusion) || '顺利进行',
    po_feedback: Array.isArray(pilot.po_feedback) ? pilot.po_feedback.map(sanitizePoFeedback) : [],
  };
}

function sanitizeDashboardData(data) {
  return {
    ...data,
    pilots: Array.isArray(data.pilots) ? data.pilots.map(sanitizePilot) : [],
    highlights: Array.isArray(data.highlights) ? data.highlights.map(sanitizeHighlight) : [],
  };
}

function normalizeDataShape(data) {
  if (Array.isArray(data.pilots)) return sanitizeDashboardData(data);

  if (Array.isArray(data.pux_members)) {
    return sanitizeDashboardData({
      pilots: data.pux_members.map((member) => ({
        id: member.id,
        name: member.name,
        product_line: member.product_line || member.product_business || '',
        po_name: member.po_name || '',
        current_step: Number(member.current_step || 1),
        status: member.status || 'in_progress',
        project:
          member.project ||
          member.steps?.[`step${member.current_step || 1}`]?.project ||
          '',
        execution_process:
          member.execution_process ||
          member.steps?.[`step${member.current_step || 1}`]?.description ||
          '',
        conclusion: member.conclusion || '顺利进行',
        last_update: member.last_update || new Date().toISOString().slice(0, 10),
        history: Array.isArray(member.history) ? member.history : [],
      })),
      steps_definition: {
        1: data.steps_definition?.step1?.description || '直接和研发对齐任务',
        2: data.steps_definition?.step2?.description || '自己产生想法并推进',
        3: data.steps_definition?.step3?.description || '从想法到Demo甚至推广运营',
      },
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
    });
  }

  return {
    pilots: [],
    steps_definition: {
      1: '直接和研发对齐任务',
      2: '自己产生想法并推进',
      3: '从想法到Demo甚至推广运营',
    },
    highlights: [],
  };
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
      data: sanitizeDashboardData(data),
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
  const cleanData = sanitizeDashboardData(data);

  if (!hasSupabaseConfig()) {
    return {
      data: cleanData,
      source: 'fallback-json',
      writable: false,
    };
  }

  const savedData = await writeSupabaseData(cleanData);
  return {
    data: sanitizeDashboardData(savedData),
    source: 'supabase',
    writable: true,
  };
}

module.exports = {
  readData,
  writeData,
};
