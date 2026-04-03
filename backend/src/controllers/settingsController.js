import { supabaseAdmin } from '../utils/supabase.js';
import { verifyWordPressConnection } from '../services/wordpressService.js';

export async function getSettingsHandler(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Don't expose hashed passwords
    const safeSettings = { ...settings };
    delete safeSettings.wp_pass_hash;
    delete safeSettings.gemini_key_hash;

    res.json(safeSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateSettingsHandler(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { geminiKey, wpUrl, wpUser, wpPass, intervalWaktu } = req.body;

    // Validate WordPress connection if credentials provided
    if (wpUrl && wpUser && wpPass) {
      await verifyWordPressConnection(wpUrl, wpUser, wpPass);
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };

    if (wpUrl) updateData.wp_url = wpUrl;
    if (wpUser) updateData.wp_user = wpUser;
    if (wpPass) updateData.wp_pass_hash = wpPass; // In production, encrypt this
    if (intervalWaktu) updateData.interval_waktu = intervalWaktu;
    if (geminiKey) updateData.gemini_key_hash = geminiKey; // In production, encrypt this

    const { data: updated, error } = await supabaseAdmin
      .from('settings')
      .update(updateData)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Don't expose hashed passwords
    const safeSettings = { ...updated };
    delete safeSettings.wp_pass_hash;
    delete safeSettings.gemini_key_hash;

    res.json({
      success: true,
      message: 'Settings updated',
      settings: safeSettings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
