import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Eye, EyeOff, Check, X, Loader } from 'lucide-react';
import '../styles/UserCredentials.css';

export default function UserCredentials() {
  const [credentials, setCredentials] = useState({
    gemini_api_key: '',
    wordpress_url: '',
    wordpress_username: '',
    wordpress_password: '',
    content_language: 'id',
    trending_enabled: true,
    trending_niche: '',
    include_images: true
  });

  const [showPasswords, setShowPasswords] = useState({
    gemini_api_key: false,
    wordpress_password: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch existing credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user-settings');
      if (response.data.success) {
        setCredentials(response.data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Validation
      if (!credentials.gemini_api_key && !credentials.wordpress_url) {
        setMessage({
          type: 'error',
          text: 'Please provide at least one credential (Gemini API Key or WordPress details)'
        });
        return;
      }

      const response = await api.put('/user-settings', credentials);
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '✓ Credentials saved successfully!'
        });
        // Refresh to confirm
        setTimeout(() => fetchCredentials(), 1000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to save credentials'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (credentialType) => {
    try {
      setVerifying(credentialType);
      const response = await api.post('/user-settings/verify', { credentialType });
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || `Failed to verify ${credentialType} credentials`
      });
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="user-credentials-container">
        <div className="loading-spinner">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div className="user-credentials-container">
      <div className="credentials-header">
        <h2>Account Credentials</h2>
        <p>Manage your Gemini API Key and WordPress credentials</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-btn">×</button>
        </div>
      )}

      <div className="credentials-content">
        {/* Gemini API Key Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Gemini API Key</h3>
              <p className="section-description">
                Enter your Google Gemini API key for AI-powered content generation.
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="help-link">
                  Get your API key →
                </a>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gemini_api_key">Gemini API Key</label>
            <div className="input-wrapper">
              <input
                id="gemini_api_key"
                type={showPasswords.gemini_api_key ? 'text' : 'password'}
                name="gemini_api_key"
                value={credentials.gemini_api_key}
                onChange={handleInputChange}
                placeholder="AIza..."
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  gemini_api_key: !prev.gemini_api_key
                }))}
                className="toggle-password-btn"
              >
                {showPasswords.gemini_api_key ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleVerify('gemini')}
            disabled={!credentials.gemini_api_key || verifying === 'gemini'}
            className="verify-btn"
          >
            {verifying === 'gemini' ? (
              <>
                <Loader size={16} className="spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check size={16} />
                Verify API Key
              </>
            )}
          </button>
        </section>

        <hr className="section-divider" />

        {/* Content Language Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Post Language</h3>
              <p className="section-description">
                Choose the language used when generating posts with Gemini.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content_language">Content Language</label>
            <select
              id="content_language"
              name="content_language"
              value={credentials.content_language || 'id'}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Trending Topic Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Trending Topic</h3>
              <p className="section-description">
                Aktifkan Google Trends untuk memilih topik berdasarkan yang sedang ramai.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="trending_enabled"
                checked={!!credentials.trending_enabled}
                onChange={handleInputChange}
              />
              <span className="text-sm font-medium">Use Google Trends</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="trending_niche">Niche keyword (opsional)</label>
            <input
              id="trending_niche"
              type="text"
              name="trending_niche"
              value={credentials.trending_niche || ''}
              onChange={handleInputChange}
              placeholder="Contoh: marketing, crypto, kesehatan"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-2">
              Jika diisi, sistem akan mencoba memilih tren yang paling mendekati niche ini.
            </p>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Image Option Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Featured Image</h3>
              <p className="section-description">
                Pilih apakah post otomatis menggunakan gambar featured atau tanpa gambar.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="include_images"
                checked={!!credentials.include_images}
                onChange={handleInputChange}
              />
              <span className="text-sm font-medium">Use featured image for posts</span>
            </label>
          </div>
        </section>

        <hr className="section-divider" />

        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>WordPress Credentials</h3>
              <p className="section-description">
                Enter your WordPress site details for automatic posting.
                <span className="info-note">
                  Use an <strong>Application Password</strong> instead of your main password for security.
                  <a href="https://wordpress.com/support/application-passwords/" target="_blank" rel="noopener noreferrer" className="help-link">
                    Learn more →
                  </a>
                </span>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wordpress_url">WordPress Site URL</label>
            <input
              id="wordpress_url"
              type="url"
              name="wordpress_url"
              value={credentials.wordpress_url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wordpress_username">WordPress Username</label>
            <input
              id="wordpress_username"
              type="text"
              name="wordpress_username"
              value={credentials.wordpress_username}
              onChange={handleInputChange}
              placeholder="your-username"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wordpress_password">WordPress Application Password</label>
            <div className="input-wrapper">
              <input
                id="wordpress_password"
                type={showPasswords.wordpress_password ? 'text' : 'password'}
                name="wordpress_password"
                value={credentials.wordpress_password}
                onChange={handleInputChange}
                placeholder="xxxxxxxx xxxx xxxx xxxx xxxxxxxx xxxx"
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  wordpress_password: !prev.wordpress_password
                }))}
                className="toggle-password-btn"
              >
                {showPasswords.wordpress_password ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleVerify('wordpress')}
            disabled={!credentials.wordpress_url || !credentials.wordpress_username || !credentials.wordpress_password || verifying === 'wordpress'}
            className="verify-btn"
          >
            {verifying === 'wordpress' ? (
              <>
                <Loader size={16} className="spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check size={16} />
                Verify Connection
              </>
            )}
          </button>
        </section>
      </div>

      {/* Save Button */}
      <div className="credentials-footer">
        <button
          onClick={handleSave}
          disabled={saving}
          className="save-btn"
        >
          {saving ? (
            <>
              <Loader size={18} className="spin" />
              Saving...
            </>
          ) : (
            'Save Credentials'
          )}
        </button>
      </div>

      {/* Security Note */}
      <div className="security-note">
        <strong>🔒 Security Note:</strong> Your credentials are encrypted and stored securely on our servers. We never store plain text passwords or API keys.
      </div>
    </div>
  );
}
