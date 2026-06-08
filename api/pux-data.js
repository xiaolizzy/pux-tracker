const { readData } = require('./_lib/pux-store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    if (String(req.url || '').includes('health=1')) {
      const result = await readData();
      const isLiveStorage = result.source === 'supabase' && result.writable;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(isLiveStorage ? 200 : 503).json({
        success: isLiveStorage,
        source: result.source,
        writable: result.writable,
        error: result.error || '',
        message: isLiveStorage
          ? 'Live Supabase storage is available'
          : 'Live Supabase storage is unavailable; dashboard is using fallback data',
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
