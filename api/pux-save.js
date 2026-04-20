
const fs = require('fs');
const path = require('path');
const { sendTextToWeCom, FEEDBACK_WEBHOOK_URL } = require('./lib');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_pilots.json');

module.exports = async (req, res) =&gt; {
    if (req.method === 'POST') {
        try {
            const { id, step, status, project } = req.body;
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            const pilot = data.pilots.find(p =&gt; p.id === id);

            if (pilot) {
                const oldStep = pilot.current_step;
                const oldStatus = pilot.status;

                pilot.current_step = step;
                pilot.status = status;
                pilot.last_update = new Date().toISOString().split('T')[0];
                if (!pilot.history) pilot.history = [];
                pilot.history.push({ step, status, project, date: pilot.last_update });

                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

                if ((status === 'completed' &amp;&amp; oldStatus !== 'completed') || step &gt; oldStep) {
                    const stepName = data.steps_definition[step];
                    const message = `🎉【PUX 进化喜报】\n恭喜试点成员 *${pilot.name}* 取得新进展！\n\n🎯 当前阶段：Step ${step} - ${stepName}\n🚀 关联项目：${project}\n💪 状态：已达成\n\n让我们一起见证从 UED 向 PUX 的华丽转型！`;
                    await sendTextToWeCom(FEEDBACK_WEBHOOK_URL, message);
                }

                res.json({ success: true });
            } else {
                res.status(404).json({ success: false, message: 'Pilot not found' });
            }
        } catch (error) {
            console.error('Error saving PUX data:', error);
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

