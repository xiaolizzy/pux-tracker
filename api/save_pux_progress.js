const { readData, writeData } = require('./lib');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { pux_id, step, status, project, description } = req.body;
      const data = readData();
      const pux_member = data.pux_members.find(p => p.id === pux_id);

      if (!pux_member) {
        return res.status(404).json({ error: 'PUX member not found' });
      }

      const step_key = `step${step}`;
      const today = new Date().toISOString().split('T')[0];

      pux_member.steps[step_key].status = status;
      pux_member.steps[step_key].project = project;
      pux_member.steps[step_key].description = description || pux_member.steps[step_key].description;
      
      if (status === 'completed') {
        pux_member.steps[step_key].completed_date = today;
      }

      pux_member.current_step = step;
      pux_member.status = status === 'completed' ? 'completed' : 'in_progress';
      pux_member.last_update = today;
      pux_member.history.push({
        step,
        status,
        project,
        date: today
      });

      writeData(data);
      res.status(200).json({ success: true, message: 'Progress saved successfully' });
    } catch (error) {
      console.error('Error saving PUX progress:', error);
      res.status(500).json({ error: 'Failed to save progress' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
