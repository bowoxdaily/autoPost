import { getLogs, clearLogs } from '../utils/database.js';

export async function getLogsHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const logs = await getLogs(userId, limit);
    
    res.json({
      total: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function clearLogsHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    await clearLogs(userId);
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
