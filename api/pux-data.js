
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_pilots.json');

module.exports = async (req, res) =&gt; {
    if (req.method === 'GET') {
        try {
            if (!fs.existsSync(DATA_PATH)) {
                const initialData = {
                    pilots: [
                        {
                            id: 'pux_001',
                            name: '试点成员A',
                            current_step: 1,
                            status: 'in_progress',
                            last_update: '2026-04-13',
                            history: []
                        }
                    ],
                    steps_definition: {
                        "1": "直接和研发对齐任务",
                        "2": "自己产生想法并推进",
                        "3": "从想法到Demo甚至推广运营"
                    }
                };
                fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
                fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2));
                res.json(initialData);
            } else {
                const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
                res.json(data);
            }
        } catch (error) {
            console.error('Error reading PUX data:', error);
            res.status(500).json({ error: 'Failed to read data' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

