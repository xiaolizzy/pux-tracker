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
  const formUrl = `${baseUrl}/pux`;
  const dashboardUrl = `${baseUrl}/pux-dashboard`;
  const message =
    `📮【PUX 本周进展收集】\n` +
    `请大家在本周五前同步 PUX 转型进展，重点补充：\n` +
    `1. 当前处于哪个转型阶段\n` +
    `2. 本周负责内容 / 关联项目\n` +
    `3. 执行过程、产出、卡点和下一步\n` +
    `4. 当前结论：顺利进行 / 待观察 / 遇到阻碍\n\n` +
    `填写入口：${formUrl}\n` +
    `看板入口：${dashboardUrl}`;

  try {
    const wecom = await sendTextToWeCom(process.env.WECOM_PUX_REMINDER_WEBHOOK_URL, message);
    return res.status(200).json({ success: true, wecom });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send PUX reminder',
    });
  }
};
