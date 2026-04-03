import { supabaseAdmin } from '../utils/supabase.js';

// GET: Get current branding config (for public use)
export async function getPublicBranding(req, res) {
  try {
    const { data: branding, error } = await supabaseAdmin
      .from('branding')
      .select('company_name, logo_url, favicon_url, primary_color, secondary_color, accent_color, website_url, support_email, social_twitter, social_linkedin, social_facebook')
      .eq('is_active', true)
      .single();

    if (error || !branding) {
      // Return default branding if not found
      return res.status(200).json({
        success: true,
        branding: {
          company_name: 'AutoPost SaaS',
          logo_url: null,
          favicon_url: null,
          primary_color: '#667eea',
          secondary_color: '#764ba2',
          accent_color: '#f093fb',
          website_url: null,
          support_email: null,
          social_twitter: null,
          social_linkedin: null,
          social_facebook: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      branding
    });
  } catch (error) {
    console.error('Get public branding error:', error);
    return res.status(500).json({ error: 'Failed to fetch branding' });
  }
}

// GET: Get superuser branding config (authenticated)
export async function getSuperuserBranding(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can access this' });
    }

    const { data: branding, error } = await supabaseAdmin
      .from('branding')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (error || !branding) {
      // Create default branding if not exists
      const { data: newBranding } = await supabaseAdmin
        .from('branding')
        .insert([{ user_id: req.user.userId }])
        .select()
        .single();

      return res.status(200).json({
        success: true,
        branding: newBranding
      });
    }

    return res.status(200).json({
      success: true,
      branding
    });
  } catch (error) {
    console.error('Get superuser branding error:', error);
    return res.status(500).json({ error: 'Failed to fetch branding' });
  }
}

// PUT: Update branding config (Superuser only)
export async function updateBranding(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const {
      company_name,
      logo_url,
      favicon_url,
      primary_color,
      secondary_color,
      accent_color,
      terms_url,
      privacy_url,
      support_email,
      website_url,
      social_twitter,
      social_linkedin,
      social_facebook,
      custom_css
    } = req.body;

    // Validate colors
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primary_color && !colorRegex.test(primary_color)) {
      return res.status(400).json({ error: 'Invalid primary color format' });
    }
    if (secondary_color && !colorRegex.test(secondary_color)) {
      return res.status(400).json({ error: 'Invalid secondary color format' });
    }
    if (accent_color && !colorRegex.test(accent_color)) {
      return res.status(400).json({ error: 'Invalid accent color format' });
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (support_email && !emailRegex.test(support_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Build update object
    const updateData = {};
    if (company_name !== undefined) updateData.company_name = company_name;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (favicon_url !== undefined) updateData.favicon_url = favicon_url;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
    if (accent_color !== undefined) updateData.accent_color = accent_color;
    if (terms_url !== undefined) updateData.terms_url = terms_url;
    if (privacy_url !== undefined) updateData.privacy_url = privacy_url;
    if (support_email !== undefined) updateData.support_email = support_email;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (social_twitter !== undefined) updateData.social_twitter = social_twitter;
    if (social_linkedin !== undefined) updateData.social_linkedin = social_linkedin;
    if (social_facebook !== undefined) updateData.social_facebook = social_facebook;
    if (custom_css !== undefined) updateData.custom_css = custom_css;
    updateData.updated_at = new Date().toISOString();

    // Check if branding exists
    const { data: existing } = await supabaseAdmin
      .from('branding')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (!existing) {
      // Create new branding
      const { data, error } = await supabaseAdmin
        .from('branding')
        .insert([{ user_id: req.user.userId, ...updateData }])
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Branding created successfully',
        branding: data
      });
    }

    // Update existing branding
    const { data, error } = await supabaseAdmin
      .from('branding')
      .update(updateData)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Branding updated successfully',
      branding: data
    });
  } catch (error) {
    console.error('Update branding error:', error);
    return res.status(500).json({ error: 'Failed to update branding' });
  }
}

// PUT: Activate/Deactivate branding (Superuser only)
export async function toggleBranding(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be boolean' });
    }

    const { data, error } = await supabaseAdmin
      .from('branding')
      .update({ is_active })
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Branding ${is_active ? 'activated' : 'deactivated'} successfully`,
      branding: data
    });
  } catch (error) {
    console.error('Toggle branding error:', error);
    return res.status(500).json({ error: 'Failed to toggle branding' });
  }
}

// POST: Preview branding (Superuser only)
export async function previewBranding(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can do this' });
    }

    const {
      company_name,
      primary_color,
      secondary_color,
      accent_color,
      logo_url
    } = req.body;

    // Generate preview CSS
    const previewCSS = `
      :root {
        --primary-color: ${primary_color || '#667eea'};
        --secondary-color: ${secondary_color || '#764ba2'};
        --accent-color: ${accent_color || '#f093fb'};
      }
      body::before {
        content: "${company_name || 'AutoPost SaaS'}";
      }
    `;

    return res.status(200).json({
      success: true,
      preview: {
        company_name,
        logo_url,
        css: previewCSS
      }
    });
  } catch (error) {
    console.error('Preview branding error:', error);
    return res.status(500).json({ error: 'Failed to preview branding' });
  }
}

// POST: Upload logo to Supabase Storage (Superuser only)
export async function uploadLogo(req, res) {
  try {
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can upload logos' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return res.status(400).json({ error: 'File size must be less than 2MB' });
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${req.user.userId}-${Date.now()}.${fileExtension}`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('logos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({ error: `Upload failed: ${error.message}` });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update branding with new logo URL
    const { data: brandingData, error: brandingError } = await supabaseAdmin
      .from('branding')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (brandingError) {
      console.error('Branding update error:', brandingError);
      // Logo uploaded but branding not updated, still return success with URL
      return res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        logo_url: publicUrl
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: publicUrl,
      branding: brandingData
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return res.status(500).json({ error: 'Failed to upload logo' });
  }
}
