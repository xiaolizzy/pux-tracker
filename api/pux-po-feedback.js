const { readData, writeData } = require('./_lib/pux-store');
const { sendTextToWeCom } = require('./_lib/wecom');

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

function normalizePayload(body = {}) {
  return {
    id: body.id,
    reviewer_name: String(body.reviewer_name || '').trim(),
    business_module_goal: String(body.business_module_goal || '').trim(),
    resource_coordination: String(body.resource_coordination || '').trim(),
    collaboration_model: String(body.collaboration_model || '').trim(),
    continue_willingness: String(body.continue_willingness || '').trim(),
    kpi_change: String(body.kpi_change || '').trim(),
    efficiency_change: String(body.efficiency_change || '').trim(),
    milestone_summary: String(body.milestone_summary || '').trim(),
  };
}

function validatePayload(payload) {
  if (!payload.id) return 'Missing id';
  if (!payload.business_module_goal) return '请填写业务模块和目标';
  if (!payload.collaboration_model) return '请填写协作模式反馈';
  if (!payload.continue_willingness) return '请选择是否愿意继续合作';
  return '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const payload = normalizePayload(req.body);
  const validationError = validatePayload(payload);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const { data } = await readData();
    const pilot = data.pilots.find((item) => item.id === payload.id);
    if (!pilot) {
      return res.status(404).json({ success: false, message: 'PUX 成员不存在' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const feedback = {
      ...payload,
      date: today,
      po_name: pilot.po_name,
      product_line: pilot.product_line,
    };

    pilot.po_feedback = Array.isArray(pilot.po_feedback) ? pilot.po_feedback : [];
    pilot.po_feedback.push(feedback);
    pilot.last_update = today;

    const writeResult = await writeData(data);
    const dashboardUrl = `${getPublicBaseUrl(req)}/pux-dashboard`;
    const message =
      `🧭【PO 反馈同步】\n` +
      `PUX：${pilot.name}\n` +
      `产品线：${pilot.product_line}\n` +
      `PO：${pilot.po_name}\n\n` +
      `业务模块和目标：${payload.business_module_goal}\n` +
      `协作模式：${payload.collaboration_model}\n` +
      `继续合作意愿：${payload.continue_willingness}\n` +
      `里程碑评估：${payload.milestone_summary || '暂无'}\n\n` +
      `看板：${dashboardUrl}`;

    let wecomResult = null;
    try {
      wecomResult = await sendTextToWeCom(process.env.FEEDBACK_WEBHOOK_URL, message);
    } catch (error) {
      wecomResult = { success: false, message: error.message };
    }

    return res.status(200).json({
      success: true,
      writable: writeResult.writable,
      source: writeResult.source,
      wecom: wecomResult,
      message: writeResult.writable
        ? 'PO feedback saved successfully'
        : 'PO feedback accepted, but persistent storage is not configured',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save PO feedback',
    });
  }
};
