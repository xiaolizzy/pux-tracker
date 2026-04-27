module.exports = async (req, res) => {
  return res.status(200).json({
    ok: true,
    message: 'PUX dashboard API is running.',
    routes: {
      dashboard: '/pux-dashboard',
      checkin: '/pux',
      data: '/api/pux/data',
      save: '/api/pux/save',
    },
  });
};
