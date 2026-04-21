const { readData, writeData } = require('./lib');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const {
        po_name,
        pux_id,
        business_metric,
        business_metric_comment,
        collaboration_efficiency,
        collaboration_efficiency_comment,
        project_progress,
        next_plan,
        overall_comment
      } = req.body;

      const data = readData();
      const today = new Date().toISOString().split('T')[0];

      const feedback = {
        id: `feedback_${Date.now()}`,
        po_name,
        pux_id,
        business_metric,
        business_metric_comment,
        collaboration_efficiency,
        collaboration_efficiency_comment,
        project_progress,
        next_plan,
        overall_comment,
        date: today
      };

      data.po_feedback.push(feedback);
      writeData(data);

      res.status(200).json({ success: true, message: 'Feedback saved successfully' });
    } catch (error) {
      console.error('Error saving PO feedback:', error);
      res.status(500).json({ error: 'Failed to save feedback' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
