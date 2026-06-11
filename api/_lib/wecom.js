async function sendTextToWeCom(webhookUrl, text) {
  if (!webhookUrl) return { skipped: true, reason: 'missing webhook url' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.WECOM_TIMEOUT_MS || 8000));

  let response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: text,
          mentioned_list: process.env.WECOM_MENTION_ALL === 'true' ? ['@all'] : [],
        },
      }),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('WeCom webhook timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`WeCom webhook failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

module.exports = {
  sendTextToWeCom,
};
