const { readData, writeData } = require('./lib');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body;
      const data = readData();

      if (action === 'add_pux') {
        const new_pux = {
          id: `pux_${Date.now()}`,
          name: payload.name,
          product_business: payload.product_business,
          po_name: payload.po_name,
          current_step: 1,
          status: 'in_progress',
          steps: {
            step1: {
              status: 'in_progress',
              completed_date: null,
              project: '',
              description: '直接和研发对齐任务'
            },
            step2: {
              status: 'pending',
              completed_date: null,
              project: '',
              description: '自己产生想法并推进'
            },
            step3: {
              status: 'pending',
              completed_date: null,
              project: '',
              description: '从想法到 demo 甚至到推广运营'
            }
          },
          last_update: new Date().toISOString().split('T')[0],
          history: []
        };
        data.pux_members.push(new_pux);
      } else if (action === 'update_pux') {
        const index = data.pux_members.findIndex(p => p.id === payload.id);
        if (index !== -1) {
          data.pux_members[index] = {
            ...data.pux_members[index],
            ...payload
          };
        }
      } else if (action === 'delete_pux') {
        data.pux_members = data.pux_members.filter(p => p.id !== payload.id);
      } else if (action === 'add_backup') {
        const new_backup = {
          id: `backup_${Date.now()}`,
          name: payload.name,
          product_business: payload.product_business,
          po_name: payload.po_name
        };
        data.backup_pux.push(new_backup);
      } else if (action === 'update_backup') {
        const index = data.backup_pux.findIndex(p => p.id === payload.id);
        if (index !== -1) {
          data.backup_pux[index] = {
            ...data.backup_pux[index],
            ...payload
          };
        }
      } else if (action === 'delete_backup') {
        data.backup_pux = data.backup_pux.filter(p => p.id !== payload.id);
      }

      writeData(data);
      res.status(200).json({ success: true, message: 'Operation successful' });
    } catch (error) {
      console.error('Error in admin operation:', error);
      res.status(500).json({ error: 'Operation failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
