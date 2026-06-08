const { getStoreHealth, readData } = require('./_lib/pux-store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    if (String(req.url || '').includes('health=1')) {
      const health = await getStoreHealth();
      return res.status(health.supabaseReadable ? 200 : 503).json({
        success: health.supabaseReadable,
        ...health,
        message: health.supabaseReadable
          ? 'Supabase is readable'
          : 'Supabase is not readable; submissions should be paused or backed up',
      });
    }

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
