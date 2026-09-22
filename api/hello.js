module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  res.status(200).json({
    message: 'Hello, world!',
    time: new Date().toISOString(),
  });
};
