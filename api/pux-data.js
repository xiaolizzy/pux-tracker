const { readData } = require('./_lib/pux-store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const result = await readData();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load PUX data',
    });
  }
};
