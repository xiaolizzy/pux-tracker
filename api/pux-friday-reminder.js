
const fs = require('fs');
const path = require('path');
const { sendTextToWeCom, FEEDBACK_WEBHOOK_URL, isHoliday } = require('./lib');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_pilots.json');

module.exports = async (req, res) =&gt; {
    if (isHoliday()) {
        res.json({ message: 'Today is a holiday, skipping reminder' });
        return;
    }

    try {
        const message = `🔔【PUX 进度主动曝光】\n亲爱的试点成员，一周忙碌辛苦啦！\n\n请点击下方链接，花 30 秒同步你本周的进化成果，让进度被看见：\n\n👉 ${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://your-domain.com'}/pux\n\n进度主动曝光，也是 PUX 的核心能力之一哦！`;
        
        await sendTextToWeCom(FEEDBACK_WEBHOOK_URL, message);
        console.log('PUX Friday reminder sent successfully');
        res.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
        console.error('Error sending PUX Friday reminder:', error);
        res.status(500).json({ error: 'Failed to send reminder' });
    }
};

