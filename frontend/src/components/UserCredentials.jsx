import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Eye, EyeOff, Check, X, Loader } from 'lucide-react';
import { notifySuccess, notifyError, getApiErrorMessage } from '../utils/notify';
import '../styles/UserCredentials.css';

export default function UserCredentials() {
  const [credentials, setCredentials] = useState({
    ai_provider: 'gemini',
    gemini_api_key: '',
    sumopod_api_key: '',
    sumopod_model: 'gpt-4o-mini',
    chatgpt_api_key: '',
    claude_api_key: '',
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
    sumopod_api_key: false,
    chatgpt_api_key: false,
    claude_api_key: false,
    wordpress_password: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [sumopodModels, setSumopodModels] = useState([]);
  const [loadingSumopodModels, setLoadingSumopodModels] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch existing credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (credentials.ai_provider === 'sumopod' && credentials.sumopod_api_key) {
      fetchSumopodModels();
    }
  }, [credentials.ai_provider]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user-settings');
      if (response.data.success) {
        const nextSettings = {
          ...response.data.settings,
          sumopod_model: response.data.settings.sumopod_model || 'gpt-4o-mini'
        };

        setCredentials(prev => ({
          ...prev,
          ...nextSettings
        }));

        if (nextSettings.ai_provider === 'sumopod' && nextSettings.sumopod_api_key) {
          fetchSumopodModels();
        }
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      notifyError(getApiErrorMessage(error, 'Failed to fetch credentials'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSumopodModels = async () => {
    try {
      setLoadingSumopodModels(true);
      const response = await api.get('/user-settings/sumopod-models');

      if (response.data.success) {
        const models = Array.isArray(response.data.models) ? response.data.models : [];
        setSumopodModels(models);
        setCredentials(prev => {
          const defaultModel = response.data.defaultModel || 'gpt-4o-mini';
          const hasCurrent = models.some(model => model.id === prev.sumopod_model);

          return {
            ...prev,
            sumopod_model: hasCurrent ? prev.sumopod_model : (models[0]?.id || prev.sumopod_model || defaultModel)
          };
        });
      }
    } catch (error) {
      setSumopodModels([]);
      if (credentials.ai_provider === 'sumopod') {
        notifyError(getApiErrorMessage(error, 'Failed to load Sumopod models'));
      }
    } finally {
      setLoadingSumopodModels(false);
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
      const providerApiKey = 
        credentials.ai_provider === 'gemini' ? credentials.gemini_api_key :
        credentials.ai_provider === 'sumopod' ? credentials.sumopod_api_key :
        credentials.ai_provider === 'chatgpt' ? credentials.chatgpt_api_key :
        credentials.ai_provider === 'claude' ? credentials.claude_api_key : null;

      if (!providerApiKey) {
        setMessage({
          type: 'error',
          text: `Please provide API key for ${credentials.ai_provider}`
        });
        return;
      }

      if (!credentials.wordpress_url) {
        setMessage({
          type: 'error',
          text: 'Please provide WordPress URL'
        });
        return;
      }

      const response = await api.put('/user-settings', credentials);
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '✓ Credentials saved successfully!'
        });
        notifySuccess('Credentials saved successfully.');
        // Refresh to confirm
        setTimeout(() => fetchCredentials(), 1000);
      }
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Failed to save credentials'));
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
        notifySuccess(response.data.message || 'Verification successful.');
        if (credentialType === 'sumopod') {
          fetchSumopodModels();
        }
      }
    } catch (error) {
      notifyError(getApiErrorMessage(error, `Failed to verify ${credentialType} credentials`));
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
        <p>Manage your AI provider API key and WordPress credentials</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-btn">×</button>
        </div>
      )}

      <div className="credentials-content">
        {/* AI Provider Selection Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>🤖 AI Content Generator</h3>
              <p className="section-description">
                Choose your preferred AI provider for generating blog posts.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ai_provider">Select AI Provider</label>
            <select
              id="ai_provider"
              name="ai_provider"
              value={credentials.ai_provider || 'gemini'}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="sumopod">Sumopod AI</option>
              <option value="chatgpt" disabled>OpenAI ChatGPT (Coming Soon)</option>
              <option value="claude" disabled>Anthropic Claude (Coming Soon)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Your API keys are encrypted and stored securely.
            </p>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Sumopod API Key Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Sumopod API Key</h3>
              <p className="section-description">
                Enter your Sumopod API key for AI-powered content generation.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sumopod_api_key">Sumopod API Key</label>
            <div className="input-wrapper">
              <input
                id="sumopod_api_key"
                type={showPasswords.sumopod_api_key ? 'text' : 'password'}
                name="sumopod_api_key"
                value={credentials.sumopod_api_key || ''}
                onChange={handleInputChange}
                placeholder="Paste your Sumopod key"
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  sumopod_api_key: !prev.sumopod_api_key
                }))}
                className="toggle-password-btn"
              >
                {showPasswords.sumopod_api_key ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sumopod_model">Sumopod Model</label>
            <select
              id="sumopod_model"
              name="sumopod_model"
              value={credentials.sumopod_model || 'gpt-4o-mini'}
              onChange={handleInputChange}
              className="input-field"
              disabled={!credentials.sumopod_api_key || loadingSumopodModels}
            >
              {sumopodModels.length === 0 ? (
                <option value={credentials.sumopod_model || 'gpt-4o-mini'}>
                  {loadingSumopodModels ? 'Loading Sumopod models...' : (credentials.sumopod_model || 'gpt-4o-mini')}
                </option>
              ) : (
                sumopodModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {credentials.sumopod_api_key
                ? 'Model list diambil dari akun Sumopod kamu. Save atau verify key jika list belum muncul.'
                : 'Masukkan Sumopod API key terlebih dulu untuk mengambil daftar model.'}
            </p>
          </div>

          <button
            onClick={() => handleVerify('sumopod')}
            disabled={!credentials.sumopod_api_key || verifying === 'sumopod'}
            className="verify-btn"
          >
            {verifying === 'sumopod' ? (
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

        {/* ChatGPT API Key Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>OpenAI ChatGPT API Key</h3>
              <p className="section-description">
                Enter your OpenAI API key for ChatGPT-powered content generation.
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="help-link">
                  Get your API key →
                </a>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="chatgpt_api_key">ChatGPT API Key</label>
            <div className="input-wrapper">
              <input
                id="chatgpt_api_key"
                type={showPasswords.chatgpt_api_key ? 'text' : 'password'}
                name="chatgpt_api_key"
                value={credentials.chatgpt_api_key || ''}
                onChange={handleInputChange}
                placeholder="sk-..."
                className="input-field"
                disabled
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  chatgpt_api_key: !prev.chatgpt_api_key
                }))}
                className="toggle-password-btn"
              >
                {showPasswords.chatgpt_api_key ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🚧 ChatGPT support coming soon!
            </p>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Claude API Key Section */}
        <section className="credential-section">
          <div className="section-header">
            <div>
              <h3>Anthropic Claude API Key</h3>
              <p className="section-description">
                Enter your Anthropic API key for Claude-powered content generation.
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="help-link">
                  Get your API key →
                </a>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="claude_api_key">Claude API Key</label>
            <div className="input-wrapper">
              <input
                id="claude_api_key"
                type={showPasswords.claude_api_key ? 'text' : 'password'}
                name="claude_api_key"
                value={credentials.claude_api_key || ''}
                onChange={handleInputChange}
                placeholder="sk-ant-..."
                className="input-field"
                disabled
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  claude_api_key: !prev.claude_api_key
                }))}
                className="toggle-password-btn"
              >
                {showPasswords.claude_api_key ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🚧 Claude support coming soon!
            </p>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Gemini API Key Section */}
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
            <label htmlFor="trending_niche">
              Niche Keywords — Rolling
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '99px',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>🔄 AUTO ROLLING</span>
            </label>
            <input
              id="trending_niche"
              type="text"
              name="trending_niche"
              value={credentials.trending_niche || ''}
              onChange={handleInputChange}
              placeholder="MPASI, Gentle Parenting, Investasi, Skincare, Bisnis Online"
              className="input-field"
            />

            {/* Rolling preview badges */}
            {credentials.trending_niche && credentials.trending_niche.trim() && (() => {
              const niches = credentials.trending_niche
                .split(',')
                .map(n => n.trim())
                .filter(Boolean);
              if (niches.length === 0) return null;
              return (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
                    {niches.length > 1
                      ? `✅ ${niches.length} niche terdeteksi — akan diposting bergantian:`
                      : '✅ 1 niche terdeteksi:'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {niches.map((niche, i) => (
                      <span key={i} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        padding: '3px 10px',
                        borderRadius: '99px',
                        background: i === 0 ? '#ede9fe' : '#f3f4f6',
                        color: i === 0 ? '#7c3aed' : '#374151',
                        fontWeight: i === 0 ? '600' : '400',
                        border: i === 0 ? '1px solid #c4b5fd' : '1px solid #e5e7eb'
                      }}>
                        {i === 0 ? '▶' : `${i + 1}`} {niche}
                      </span>
                    ))}
                  </div>
                  {niches.length > 1 && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                      💡 Setiap kali post, sistem memilih niche berikutnya secara bergilir (round-robin).
                    </p>
                  )}
                </div>
              );
            })()}

            <p className="text-xs text-gray-500 mt-2">
              Pisahkan dengan koma untuk <strong>rolling niche otomatis</strong>. Contoh: <code>MPASI, Parenting, Investasi, Skincare</code> → setiap post akan berganti niche secara bergilir.
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
