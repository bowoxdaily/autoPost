import { getCronActive, getSettings } from '../utils/database.js';
import { supabaseAdmin } from '../utils/supabase.js';

async function getCronService() {
  return import('../services/cronService.js');
}

export async function startCronHandler(req, res) {
  try {
    const { startCronJob, isCronJobRunning } = await getCronService();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    await startCronJob(userId);
    
    // Return confirmation with updated status
    const isRunning = isCronJobRunning();
    res.json({ 
      message: 'Cron job started for user',
      status: 'running',
      active: true,
      running: isRunning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function stopCronHandler(req, res) {
  try {
    const { stopCronJob } = await getCronService();
    const stopped = await stopCronJob();
    
    // Return confirmation with updated status
    const isActive = await getCronActive();
    res.json({ 
      message: 'Cron job stopped',
      status: 'stopped',
      active: false,
      running: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getCronStatusHandler(req, res) {
  try {
    const { isCronJobRunning } = await getCronService();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const isActive = await getCronActive();
    const isRunning = isCronJobRunning();
    
    // Read settings from Supabase (not local file) to get latest interval
    let hours = 12; // Default
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('settings')
        .select('interval_waktu')
        .eq('user_id', userId)
        .single();
      
      if (settings && settings.interval_waktu) {
        hours = settings.interval_waktu;
      }
    } catch (dbError) {
      console.warn('Could not fetch interval from database, using default:', dbError.message);
    }
    
    let nextRun = null;
    if (isActive && isRunning) {
      const now = new Date();
      const nextRunTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
      nextRun = nextRunTime.toISOString();
    }
    
    res.json({
      active: isActive,
      running: isRunning,
      interval: hours,
      nextRun: nextRun,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function runPostNowHandler(req, res) {
  try {
    const { runPostNow } = await getCronService();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    await runPostNow(userId);
    res.json({ 
      message: 'Post created and published successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
