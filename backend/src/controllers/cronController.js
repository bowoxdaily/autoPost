import { getCronActive, getSettings } from '../utils/database.js';
import { supabaseAdmin } from '../utils/supabase.js';

async function getCronService() {
  return import('../services/cronService.js');
}

function computeNextRunByInterval(hours, now = new Date()) {
  const safeHours = Number(hours) > 0 ? Number(hours) : 12;
  const base = new Date(now);

  // Cron pattern in service: `0 */N * * *` (minute 0 every N hours)
  // So next run must snap to the next hour boundary that matches N.
  base.setSeconds(0, 0);

  const currentHour = base.getHours();
  const currentMinute = now.getMinutes();
  const remainder = currentHour % safeHours;

  let hoursToAdd = (safeHours - remainder) % safeHours;

  // If already on an aligned hour but minute > 0, next run is after full interval.
  if (hoursToAdd === 0 && currentMinute > 0) {
    hoursToAdd = safeHours;
  }

  base.setMinutes(0, 0, 0);
  base.setHours(currentHour + hoursToAdd);

  // Safety: ensure nextRun is always in the future.
  if (base <= now) {
    base.setHours(base.getHours() + safeHours);
  }

  return base.toISOString();
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
    const { isCronJobRunning, startCronJob } = await getCronService();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const isActive = await getCronActive();
    let isRunning = isCronJobRunning();
    
    // Auto-recovery: If database says active but job not running in memory (e.g., after server restart)
    // automatically restart the cron job
    if (isActive && !isRunning) {
      console.log(`🔄 Auto-recovering cron job for user ${userId}...`);
      try {
        await startCronJob(userId);
        isRunning = isCronJobRunning();
        console.log(`✅ Cron job auto-recovered for user ${userId}`);
      } catch (recoveryError) {
        console.warn(`⚠️  Could not auto-recover cron job: ${recoveryError.message}`);
      }
    }
    
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
      nextRun = computeNextRunByInterval(hours);
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
