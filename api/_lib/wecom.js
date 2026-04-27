async function sendTextToWeCom(webhookUrl, text) {
  if (!webhookUrl) return { skipped: true, reason: 'missing webhook url' };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'text',
      text: {
        content: text,
        mentioned_list: process.env.WECOM_MENTION_ALL === 'true' ? ['@all'] : [],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WeCom webhook failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

module.exports = {
  sendTextToWeCom,
};
