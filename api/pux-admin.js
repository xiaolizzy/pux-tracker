const { readData, writeData } = require('./_lib/pux-store');

function normalizeId(name) {
  const suffix = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
  return `pux_${suffix || Date.now()}`;
}

function normalizePilot(input = {}) {
  const name = String(input.name || '').trim();
  const currentStep = Number(input.current_step || input.currentStep || 1);

  return {
    id: input.id || normalizeId(name),
    name,
    product_line: String(input.product_line || '').trim(),
    po_name: String(input.po_name || '').trim(),
    current_step: [1, 2, 3].includes(currentStep) ? currentStep : 1,
    status: input.status || 'in_progress',
    project: String(input.project || '').trim(),
    execution_process: String(input.execution_process || '').trim(),
    conclusion: String(input.conclusion || '顺利进行').trim(),
    last_update: input.last_update || new Date().toISOString().slice(0, 10),
    history: Array.isArray(input.history) ? input.history : [],
  };
}

function validatePilot(pilot) {
  if (!pilot.name) return '姓名不能为空';
  if (!pilot.product_line) return '产品线不能为空';
  if (!pilot.po_name) return 'PO 不能为空';
  return '';
}

function ensureUniqueId(pilots, pilot) {
  if (!pilots.some((item) => item.id === pilot.id)) return pilot.id;
  return `${pilot.id}_${Date.now()}`;
}

function applyLatestHistoryToPilot(pilot) {
  const history = Array.isArray(pilot.history) ? pilot.history : [];
  const latest = history
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.project || item.execution_process || item.conclusion || item.action)
    .sort((a, b) => {
      const timeDiff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      return timeDiff || b.index - a.index;
    })[0];

  if (!latest) {
    pilot.project = '';
    pilot.execution_process = '';
    pilot.conclusion = '顺利进行';
    pilot.last_update = new Date().toISOString().slice(0, 10);
    return;
  }

  pilot.current_step = Number(latest.step || latest.current_step || pilot.current_step || 1);
  pilot.status = latest.status || pilot.status || 'in_progress';
  pilot.project = latest.project || '';
  pilot.execution_process = latest.execution_process || latest.description || '';
  pilot.conclusion = latest.conclusion || pilot.conclusion || '顺利进行';
  pilot.last_update = latest.date || pilot.last_update || new Date().toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) {
    return res.status(400).json({ success: false, message: 'Missing action' });
  }

  try {
    const result = await readData();
    const data = result.data;
    data.pilots = Array.isArray(data.pilots) ? data.pilots : [];

    if (action === 'create') {
      const pilot = normalizePilot(payload);
      const validationError = validatePilot(pilot);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      pilot.id = ensureUniqueId(data.pilots, pilot);
      data.pilots.push(pilot);
    } else if (action === 'update') {
      const id = payload.id;
      const index = data.pilots.findIndex((item) => item.id === id);
      if (index < 0) {
        return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
      }

      const nextPilot = normalizePilot({
        ...data.pilots[index],
        ...payload,
        id,
        history: data.pilots[index].history,
        last_update: new Date().toISOString().slice(0, 10),
      });
      const validationError = validatePilot(nextPilot);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      nextPilot.history = Array.isArray(data.pilots[index].history)
        ? data.pilots[index].history
        : [];
      nextPilot.history.push({
        action: 'admin_update',
        date: nextPilot.last_update,
        name: nextPilot.name,
        product_line: nextPilot.product_line,
        po_name: nextPilot.po_name,
        current_step: nextPilot.current_step,
        status: nextPilot.status,
        project: nextPilot.project,
        execution_process: nextPilot.execution_process,
        conclusion: nextPilot.conclusion,
      });

      data.pilots[index] = nextPilot;
    } else if (action === 'delete') {
      const id = payload.id;
      const beforeCount = data.pilots.length;
      data.pilots = data.pilots.filter((item) => item.id !== id);
      if (data.pilots.length === beforeCount) {
        return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
      }
    } else if (action === 'delete_history') {
      const id = payload.id;
      const historyIndex = Number(payload.historyIndex);
      const pilot = data.pilots.find((item) => item.id === id);
      if (!pilot) {
        return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
      }

      pilot.history = Array.isArray(pilot.history) ? pilot.history : [];
      if (!Number.isInteger(historyIndex) || historyIndex < 0 || historyIndex >= pilot.history.length) {
        return res.status(400).json({ success: false, message: '历史记录不存在' });
      }

      pilot.history.splice(historyIndex, 1);
      applyLatestHistoryToPilot(pilot);
    } else {
      return res.status(400).json({ success: false, message: `Unsupported action: ${action}` });
    }

    const writeResult = await writeData(data);
    return res.status(200).json({
      success: true,
      writable: writeResult.writable,
      source: writeResult.source,
      data: writeResult.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '管理操作失败',
    });
  }
};
