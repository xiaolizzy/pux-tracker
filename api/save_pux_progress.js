const { readData, writeData } = require('./_lib/pux-store');

function normalizePayload(body = {}) {
  return {
    id: body.id || body.pux_id,
    step: Number(body.step || 1),
    status: body.status || 'in_progress',
    project: String(body.project || '').trim(),
    execution_process: String(body.execution_process || body.description || '').trim(),
    conclusion: String(body.conclusion || '顺利进行').trim(),
  };
}

function validatePayload(payload) {
  if (!payload.id) return 'Missing id';
  if (![1, 2, 3].includes(payload.step)) return 'Invalid step';
  if (!payload.project) return 'Missing project';
  return '';
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const payload = normalizePayload(req.body);
      const validationError = validatePayload(payload);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError, message: validationError });
      }

      const { data } = await readData();
      const pux_member = data.pilots.find(p => p.id === payload.id);

      if (!pux_member) {
        return res.status(404).json({ success: false, error: 'PUX member not found', message: 'PUX member not found' });
      }

      const today = new Date().toISOString().split('T')[0];

      pux_member.current_step = payload.step;
      pux_member.status = payload.status;
      pux_member.project = payload.project;
      pux_member.execution_process = payload.execution_process;
      pux_member.conclusion = payload.conclusion;
      pux_member.last_update = today;
      pux_member.history = Array.isArray(pux_member.history) ? pux_member.history : [];
      pux_member.history.push({
        step: payload.step,
        status: payload.status,
        project: payload.project,
        execution_process: payload.execution_process,
        conclusion: payload.conclusion,
        date: today
      });

      const writeResult = await writeData(data);
      res.status(200).json({
        success: true,
        writable: writeResult.writable,
        source: writeResult.source,
        message: writeResult.writable
          ? 'Progress saved successfully'
          : 'Progress accepted, but persistent storage is not configured',
      });
    } catch (error) {
      console.error('Error saving PUX progress:', error);
      res.status(500).json({ success: false, error: 'Failed to save progress', message: error.message || 'Failed to save progress' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed', message: 'Method not allowed' });
  }
};
