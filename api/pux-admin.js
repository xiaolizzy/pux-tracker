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
    po_feedback: Array.isArray(input.po_feedback) ? input.po_feedback : [],
  };
}

function normalizePoFeedback(input = {}, pilot = {}) {
  return {
    reviewer_name: String(input.reviewer_name || '').trim(),
    business_module_goal: String(input.business_module_goal || '').trim(),
    resource_coordination: String(input.resource_coordination || '').trim(),
    collaboration_model: String(input.collaboration_model || '').trim(),
    continue_willingness: String(input.continue_willingness || '').trim(),
    kpi_change: String(input.kpi_change || '').trim(),
    efficiency_change: String(input.efficiency_change || '').trim(),
    milestone_summary: String(input.milestone_summary || '').trim(),
    date: input.date || new Date().toISOString().slice(0, 10),
    po_name: input.po_name || pilot.po_name || '',
    product_line: input.product_line || pilot.product_line || '',
  };
}

function normalizeHighlight(input = {}) {
  return {
    title: String(input.title || '').trim(),
    subtitle: String(input.subtitle || '').trim(),
    body: String(input.body || '').trim(),
    owner: String(input.owner || '').trim(),
    date: input.date || new Date().toISOString().slice(0, 10),
  };
}

function validatePilot(pilot) {
  if (!pilot.name) return '姓名不能为空';
  if (!pilot.product_line) return '产品线不能为空';
  if (!pilot.po_name) return 'PO 不能为空';
  return '';
}

function validateHighlight(highlight) {
  if (!highlight.title) return '高光标题不能为空';
  if (!highlight.body) return '高光正文不能为空';
  return '';
}

function validatePoFeedback(feedback) {
  if (!feedback.business_module_goal) return '业务模块和目标不能为空';
  if (!feedback.collaboration_model) return '协作关系反馈不能为空';
  if (!feedback.continue_willingness) return '请选择是否愿意继续这种合作方式';
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
    data.highlights = Array.isArray(data.highlights) ? data.highlights : [];

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
        po_feedback: data.pilots[index].po_feedback,
        last_update: new Date().toISOString().slice(0, 10),
      });
      const validationError = validatePilot(nextPilot);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      nextPilot.history = Array.isArray(data.pilots[index].history)
        ? data.pilots[index].history
        : [];
      nextPilot.po_feedback = Array.isArray(data.pilots[index].po_feedback)
        ? data.pilots[index].po_feedback
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
    } else if (action === 'save_po_feedback') {
      const id = payload.id;
      const poFeedbackIndex = payload.poFeedbackIndex;
      const pilot = data.pilots.find((item) => item.id === id);
      if (!pilot) {
        return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
      }

      pilot.po_feedback = Array.isArray(pilot.po_feedback) ? pilot.po_feedback : [];
      const feedback = normalizePoFeedback(payload.feedback, pilot);
      const validationError = validatePoFeedback(feedback);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      if (poFeedbackIndex === undefined || poFeedbackIndex === null || poFeedbackIndex === '') {
        pilot.po_feedback.push(feedback);
      } else {
        const index = Number(poFeedbackIndex);
        if (!Number.isInteger(index) || index < 0 || index >= pilot.po_feedback.length) {
          return res.status(400).json({ success: false, message: 'PO 评价记录不存在' });
        }
        pilot.po_feedback[index] = feedback;
      }
      pilot.last_update = feedback.date || new Date().toISOString().slice(0, 10);
    } else if (action === 'delete_po_feedback') {
      const id = payload.id;
      const poFeedbackIndex = Number(payload.poFeedbackIndex);
      const pilot = data.pilots.find((item) => item.id === id);
      if (!pilot) {
        return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
      }

      pilot.po_feedback = Array.isArray(pilot.po_feedback) ? pilot.po_feedback : [];
      if (!Number.isInteger(poFeedbackIndex) || poFeedbackIndex < 0 || poFeedbackIndex >= pilot.po_feedback.length) {
        return res.status(400).json({ success: false, message: 'PO 评价记录不存在' });
      }
      pilot.po_feedback.splice(poFeedbackIndex, 1);
    } else if (action === 'save_highlight') {
      const highlightIndex = payload.highlightIndex;
      const highlight = normalizeHighlight(payload.highlight);
      const validationError = validateHighlight(highlight);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      if (highlightIndex === undefined || highlightIndex === null || highlightIndex === '') {
        data.highlights.push(highlight);
      } else {
        const index = Number(highlightIndex);
        if (!Number.isInteger(index) || index < 0 || index >= data.highlights.length) {
          return res.status(400).json({ success: false, message: '高光案例不存在' });
        }
        data.highlights[index] = highlight;
      }
    } else if (action === 'delete_highlight') {
      const highlightIndex = Number(payload.highlightIndex);
      if (!Number.isInteger(highlightIndex) || highlightIndex < 0 || highlightIndex >= data.highlights.length) {
        return res.status(400).json({ success: false, message: '高光案例不存在' });
      }
      data.highlights.splice(highlightIndex, 1);
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
