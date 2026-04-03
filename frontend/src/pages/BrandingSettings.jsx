import { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/BrandingSettings.css';

export default function BrandingSettings() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    accent_color: '#f093fb',
    terms_url: '',
    privacy_url: '',
    support_email: '',
    website_url: '',
    social_twitter: '',
    social_linkedin: '',
    social_facebook: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchBranding();
  }, []);

  async function fetchBranding() {
    try {
      const response = await api.get('/branding');
      const data = response.data.branding;
      setBranding(data);
      setFormData({
        company_name: data.company_name || '',
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || '',
        primary_color: data.primary_color || '#667eea',
        secondary_color: data.secondary_color || '#764ba2',
        accent_color: data.accent_color || '#f093fb',
        terms_url: data.terms_url || '',
        privacy_url: data.privacy_url || '',
        support_email: data.support_email || '',
        website_url: data.website_url || '',
        social_twitter: data.social_twitter || '',
        social_linkedin: data.social_linkedin || '',
        social_facebook: data.social_facebook || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching branding:', err);
      setError('Failed to load branding settings');
      setLoading(false);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only images are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formDataForUpload = new FormData();
      formDataForUpload.append('logo', file);

      const response = await api.post('/branding/upload-logo', formDataForUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { logo_url, branding: updatedBranding } = response.data;
      
      // Update form data with new logo URL
      setFormData(prev => ({
        ...prev,
        logo_url
      }));

      if (updatedBranding) {
        setBranding(updatedBranding);
      }

      setSuccess('Logo uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/branding', formData);
      setSuccess('Branding updated successfully!');
      setBranding(response.data.branding);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function applyPreviewColors() {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', formData.primary_color);
    root.style.setProperty('--brand-secondary', formData.secondary_color);
    root.style.setProperty('--brand-accent', formData.accent_color);
  }

  if (loading) return <div className="branding-loading">Loading branding settings...</div>;

  return (
    <div className="branding-container">
      <div className="branding-header">
        <h1>🎨 Custom Branding</h1>
        <p>Customize your platform's appearance and identity</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="branding-tabs">
        <button 
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🏢 General
        </button>
        <button 
          className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          🎨 Colors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          🔗 Social & Links
        </button>
        <button 
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => { setActiveTab('preview'); applyPreviewColors(); }}
        >
          👁️ Preview
        </button>
      </div>

      <div className="branding-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Company Name</label>
              <input 
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Your Company Name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Logo Upload 📸</label>
              <div className="file-upload-wrapper">
                <input 
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="file-input"
                />
                <label htmlFor="logo-upload" className="file-upload-label">
                  {uploading ? '⏳ Uploading...' : '📁 Click to upload logo'}
                </label>
              </div>
              <p className="file-info">Max size: 2MB | Supported: PNG, JPG, GIF, WebP, SVG</p>
              {formData.logo_url && (
                <div className="preview-img">
                  <img src={formData.logo_url} alt="Logo Preview" title={formData.logo_url} />
                  <p className="logo-url-display">✓ Logo uploaded</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Favicon URL</label>
              <input 
                type="url"
                name="favicon_url"
                value={formData.favicon_url}
                onChange={handleInputChange}
                placeholder="https://example.com/favicon.ico"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Support Email</label>
              <input 
                type="email"
                name="support_email"
                value={formData.support_email}
                onChange={handleInputChange}
                placeholder="support@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Website URL</label>
              <input 
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="tab-content">
            <div className="colors-grid">
              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-input-wrapper">
                  <input 
                    type="color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <input 
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="color-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Secondary Color</label>
                <div className="color-input-wrapper">
                  <input 
                    type="color"
                    name="secondary_color"
                    value={formData.secondary_color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <input 
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="color-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Accent Color</label>
                <div className="color-input-wrapper">
                  <input 
                    type="color"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <input 
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="color-text"
                  />
                </div>
              </div>
            </div>

            <div className="color-preview">
              <h3>Color Preview</h3>
              <div className="preview-colors">
                <div className="color-swatch" style={{ backgroundColor: formData.primary_color }}>
                  <span>Primary</span>
                </div>
                <div className="color-swatch" style={{ backgroundColor: formData.secondary_color }}>
                  <span>Secondary</span>
                </div>
                <div className="color-swatch" style={{ backgroundColor: formData.accent_color }}>
                  <span>Accent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social & Links Tab */}
        {activeTab === 'social' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Terms URL</label>
              <input 
                type="url"
                name="terms_url"
                value={formData.terms_url}
                onChange={handleInputChange}
                placeholder="https://example.com/terms"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Privacy URL</label>
              <input 
                type="url"
                name="privacy_url"
                value={formData.privacy_url}
                onChange={handleInputChange}
                placeholder="https://example.com/privacy"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Twitter URL</label>
              <input 
                type="url"
                name="social_twitter"
                value={formData.social_twitter}
                onChange={handleInputChange}
                placeholder="https://twitter.com/yourhandle"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input 
                type="url"
                name="social_linkedin"
                value={formData.social_linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/company/yourcompany"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Facebook URL</label>
              <input 
                type="url"
                name="social_facebook"
                value={formData.social_facebook}
                onChange={handleInputChange}
                placeholder="https://facebook.com/yourpage"
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="tab-content">
            <div className="preview-container">
              <div className="preview-card">
                <div className="preview-header" style={{ background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)` }}>
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="preview-logo" />
                  )}
                  <h2>{formData.company_name || 'Your Company'}</h2>
                </div>
                <div className="preview-body">
                  <div className="preview-section">
                    <h3>Sample Button</h3>
                    <button style={{ backgroundColor: formData.primary_color }} className="preview-button">
                      Click Me
                    </button>
                  </div>

                  <div className="preview-section">
                    <h3>Accent Element</h3>
                    <div style={{ backgroundColor: formData.accent_color }} className="preview-box">
                      This uses your accent color
                    </div>
                  </div>

                  <div className="preview-section">
                    <h3>Support</h3>
                    <p>Email: {formData.support_email || 'support@example.com'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="branding-actions">
        <button 
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Branding'}
        </button>
        <button 
          className="btn-cancel"
          onClick={fetchBranding}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
