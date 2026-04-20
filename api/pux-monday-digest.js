
const fs = require('fs');
const path = require('path');
const { sendTextToWeCom, FEEDBACK_WEBHOOK_URL, isHoliday, getShanghaiDate } = require('./lib');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_pilots.json');

module.exports = async (req, res) =&gt; {
    if (isHoliday()) {
        res.json({ message: 'Today is a holiday, skipping digest' });
        return;
    }

    try {
        let data;
        if (!fs.existsSync(DATA_PATH)) {
            data = {
                pilots: [],
                steps_definition: {
                    "1": "直接和研发对齐任务",
                    "2": "自己产生想法并推进",
                    "3": "从想法到Demo甚至推广运营"
                }
            };
        } else {
            data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        }

        let digest = `📊【PUX 试点全景进度图】\n截止到 ${getShanghaiDate().toLocaleDateString()}\n\n`;
        
        if (data.pilots.length === 0) {
            digest += '暂无试点成员，请在管理后台添加。\n';
        } else {
            data.pilots.forEach(pilot =&gt; {
                const stepDesc = data.steps_definition[pilot.current_step];
                const statusIcon = pilot.status === 'completed' ? '✅' : '⏳';
                digest += `${statusIcon} *${pilot.name}*：Step ${pilot.current_step}\n   (${stepDesc})\n`;
            });
        }

        digest += `\n💡 每一小步都是向产品设计师转型的跨越！`;
        
        await sendTextToWeCom(FEEDBACK_WEBHOOK_URL, digest);
        console.log('PUX Monday digest sent successfully');
        res.json({ success: true, message: 'Digest sent' });
    } catch (error) {
        console.error('Error sending PUX Monday digest:', error);
        res.status(500).json({ error: 'Failed to send digest' });
    }
};

