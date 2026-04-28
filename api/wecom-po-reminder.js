const { sendTextToWeCom } = require('./_lib/wecom');

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

module.exports = async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  if (process.env.CRON_SECRET) {
    const authorization = req.headers.authorization || '';
    if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  const baseUrl = getPublicBaseUrl(req);
  const formUrl = `${baseUrl}/po`;
  const dashboardUrl = `${baseUrl}/pux-dashboard`;
  const message =
    `📮【PO 视角协作反馈收集】\n` +
    `请各位 PO 在本周五前补充 PUX 转型协作评价，重点反馈：\n` +
    `1. PUX 对应的业务模块和目标是否明确\n` +
    `2. 双方磨合与资源协调情况\n` +
    `3. 是否形成稳定协作模式\n` +
    `4. 是否愿意继续这种合作方式\n` +
    `5. 核心 KPI 和方案产出效率是否有正向变化\n\n` +
    `填写入口：${formUrl}\n` +
    `看板入口：${dashboardUrl}`;

  try {
    const wecom = await sendTextToWeCom(process.env.WECOM_PO_REMINDER_WEBHOOK_URL, message);
    return res.status(200).json({ success: true, wecom });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send PO reminder',
    });
  }
};
