const { readData } = require('./lib');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const data = readData();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error reading data:', error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
