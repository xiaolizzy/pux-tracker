
const WECOM_WEBHOOK_URL = process.env.WECOM_WEBHOOK_URL || 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ff12e8b8-473c-4e47-9b5d-973e56de4b0d';
const FEEDBACK_WEBHOOK_URL = process.env.FEEDBACK_WEBHOOK_URL || 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=e5cf7ba8-6652-4a00-803c-162008b044ba';

const HOLIDAYS = [
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
    '2026-06-01',
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'
];

function isHoliday() {
    const now = new Date();
    const shanghaiOffset = 8 * 60;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const shanghaiTime = new Date(utc + shanghaiOffset * 60000);
    const dateStr = shanghaiTime.toISOString().split('T')[0];
    return HOLIDAYS.includes(dateStr);
}

function getShanghaiDate() {
    const now = new Date();
    const shanghaiOffset = 8 * 60;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + shanghaiOffset * 60000);
}

async function sendTextToWeCom(webhookUrl, text) {
    const fetch = require('node-fetch');
    const payload = {
        msgtype: 'text',
        text: {
            content: text,
            mentioned_list: ['@all']
        }
    };
    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.errcode !== 0) {
        throw new Error(`WeCom API error: ${data.errcode} ${data.errmsg}`);
    }
    return data;
}

module.exports = { WECOM_WEBHOOK_URL, FEEDBACK_WEBHOOK_URL, isHoliday, getShanghaiDate, sendTextToWeCom, HOLIDAYS };

