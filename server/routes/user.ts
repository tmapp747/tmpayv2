router.get('/preferences/theme', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.json({ success: true, theme: req.user.theme || 'light' });
});

router.post('/preferences/theme', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { theme } = req.body;
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ success: false, message: 'Invalid theme' });
  }
  // Save theme preference
  req.user.theme = theme;
  res.json({ success: true, theme });
});

router.get('/info', (req, res) => {