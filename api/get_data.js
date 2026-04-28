const { readData } = require('./_lib/pux-store');

function toLegacyMember(pilot) {
  const step = Number(pilot.current_step || 1);
  return {
    id: pilot.id,
    name: pilot.name,
    product_business: pilot.product_line,
    product_line: pilot.product_line,
    po_name: pilot.po_name,
    current_step: step,
    status: pilot.status || 'in_progress',
    project: pilot.project || '',
    execution_process: pilot.execution_process || '',
    conclusion: pilot.conclusion || '顺利进行',
    last_update: pilot.last_update,
    history: Array.isArray(pilot.history) ? pilot.history : [],
    steps: {
      step1: {
        status: step === 1 ? pilot.status || 'in_progress' : 'pending',
        completed_date: null,
        project: step === 1 ? pilot.project || '' : '',
        description: step === 1 ? pilot.execution_process || '直接和研发对齐任务' : '直接和研发对齐任务',
      },
      step2: {
        status: step === 2 ? pilot.status || 'in_progress' : 'pending',
        completed_date: null,
        project: step === 2 ? pilot.project || '' : '',
        description: step === 2 ? pilot.execution_process || '自己产生想法并推进' : '自己产生想法并推进',
      },
      step3: {
        status: step === 3 ? pilot.status || 'in_progress' : 'pending',
        completed_date: null,
        project: step === 3 ? pilot.project || '' : '',
        description: step === 3 ? pilot.execution_process || '从想法到 demo 甚至到推广运营' : '从想法到 demo 甚至到推广运营',
      },
    },
  };
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { data } = await readData();
      res.status(200).json({
        ...data,
        pux_members: (data.pilots || []).map(toLegacyMember),
        steps_definition: {
          step1: { name: '第一步', description: data.steps_definition?.['1'] || '直接和研发对齐任务' },
          step2: { name: '第二步', description: data.steps_definition?.['2'] || '自己产生想法并推进' },
          step3: { name: '第三步', description: data.steps_definition?.['3'] || '从想法到 demo 甚至到推广运营' },
        },
      });
    } catch (error) {
      console.error('Error reading data:', error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
