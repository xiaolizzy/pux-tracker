
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_pilots.json');

function ensureDataFile() {
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
    }
}

module.exports = async (req, res) =&gt; {
    ensureDataFile();
    
    if (req.method === 'GET') {
        try {
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            res.json(data);
        } catch (error) {
            console.error('Error reading PUX admin data:', error);
            res.status(500).json({ error: 'Failed to read data' });
        }
    } else if (req.method === 'POST') {
        try {
            const { action, pilot } = req.body;
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

            if (action === 'add') {
                const newPilot = {
                    id: `pux_${Date.now()}`,
                    name: pilot.name,
                    current_step: 1,
                    status: 'in_progress',
                    last_update: new Date().toISOString().split('T')[0],
                    history: []
                };
                data.pilots.push(newPilot);
            } else if (action === 'update') {
                const index = data.pilots.findIndex(p =&gt; p.id === pilot.id);
                if (index !== -1) {
                    data.pilots[index] = { ...data.pilots[index], ...pilot };
                }
            } else if (action === 'delete') {
                data.pilots = data.pilots.filter(p =&gt; p.id !== pilot.id);
            }

            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error saving PUX admin data:', error);
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

