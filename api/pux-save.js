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
    step: Number(body.step || 1),
    status: body.status || 'in_progress',
    project: String(body.project || '').trim(),
    execution_process: String(body.execution_process || '').trim(),
    conclusion: String(body.conclusion || '顺利进行').trim(),
  };
}

function validatePayload(payload) {
  if (!payload.id) return 'Missing id';
  if (![1, 2, 3].includes(payload.step)) return 'Invalid step';
  if (!payload.project) return 'Missing project';
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
      return res.status(404).json({ success: false, message: 'Pilot not found' });
    }

    const oldStep = Number(pilot.current_step || 1);
    const oldStatus = pilot.status;
    const today = new Date().toISOString().slice(0, 10);

    pilot.current_step = payload.step;
    pilot.status = payload.status;
    pilot.project = payload.project;
    pilot.execution_process = payload.execution_process;
    pilot.conclusion = payload.conclusion;
    pilot.last_update = today;
    pilot.history = Array.isArray(pilot.history) ? pilot.history : [];
    pilot.history.push({
      step: payload.step,
      status: payload.status,
      project: payload.project,
      execution_process: payload.execution_process,
      conclusion: payload.conclusion,
      date: today,
    });

    const writeResult = await writeData(data);
    const stepName = data.steps_definition[String(payload.step)] || `Step ${payload.step}`;
    const dashboardUrl = `${getPublicBaseUrl(req)}/pux-dashboard`;
    const isMilestone =
      (payload.status === 'completed' && oldStatus !== 'completed') || payload.step > oldStep;

    const message = isMilestone
      ? `🎉【PUX 进化喜报】\n恭喜试点成员 *${pilot.name}* 取得里程碑式进展！\n\n🎯 当前阶段：Step ${payload.step} - ${stepName}\n🏢 产品线：${pilot.product_line}\n🤵 对应 PO：${pilot.po_name}\n🚀 关联项目：${payload.project}\n💪 状态：已达成阶段性目标\n\n看板：${dashboardUrl}`
      : `📊【PUX 进度同步】\n*${pilot.name}* 同步了本周进化成果：\n\n🏢 产品线：${pilot.product_line}\n🤵 对应 PO：${pilot.po_name}\n🎯 当前阶段：Step ${payload.step} - ${stepName}\n🚀 关联内容：${payload.project}\n📝 执行过程：${payload.execution_process || '暂无'}\n💡 结论：${payload.conclusion}\n\n看板：${dashboardUrl}`;

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
        ? 'Progress saved successfully'
        : 'Progress accepted, but persistent storage is not configured',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save PUX progress',
    });
  }
};
