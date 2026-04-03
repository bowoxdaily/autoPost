import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { settingsAPI } from '../utils/api';

export default function Settings() {
  const [intervalWaktu, setIntervalWaktu] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setIntervalWaktu(data.intervalWaktu || 12);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage('Failed to load settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await settingsAPI.update({ intervalWaktu });
      setMessage('✓ Scheduling interval updated successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to save settings');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Auto-Posting Settings</h2>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {message}
          </div>
        )}

        {/* Credentials Card */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            🔐 API & WordPress Credentials
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Your Gemini API key and WordPress credentials are managed separately for security.
          </p>
          <a 
            href="/user-credentials" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
          >
            → Go to User Credentials
          </a>
        </div>

        {/* Scheduling Settings */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">📅 Scheduling Configuration</h3>
            
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How often should posts be automatically created?
            </label>
            
            {/* Quick selector buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 4, 6, 12, 24].map(hours => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setIntervalWaktu(hours)}
                  className={`py-3 px-3 rounded-lg font-medium text-sm transition ${
                    intervalWaktu === hours
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {hours === 1 ? '1h' : hours === 24 ? '1d' : `${hours}h`}
                </button>
              ))}
            </div>
            
            {/* Or use dropdown */}
            <div className="mb-4">
              <label className="text-xs text-gray-600">Or select from dropdown:</label>
              <select
                value={intervalWaktu}
                onChange={(e) => setIntervalWaktu(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
              >
                <option value={1}>Every 1 hour (24 posts/day)</option>
                <option value={2}>Every 2 hours (12 posts/day)</option>
                <option value={4}>Every 4 hours (6 posts/day)</option>
                <option value={6}>Every 6 hours (4 posts/day)</option>
                <option value={12}>Every 12 hours (2 posts/day)</option>
                <option value={24}>Every 24 hours (1 post/day)</option>
              </select>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
              <p className="text-sm text-blue-900">
                <strong>📊 Current Setting:</strong> Posts will be created automatically every <strong className="text-blue-700">{intervalWaktu} hour{intervalWaktu > 1 ? 's' : ''}</strong>
              </p>
              <p className="text-xs text-blue-800 mt-2">
                💡 That's approximately <strong>{Math.round(24 / intervalWaktu)} post{Math.round(24 / intervalWaktu) > 1 ? 's' : ''} per day</strong>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Scheduling Settings'}
          </button>
        </form>

        {/* Info Section */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">✓ How It Works</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>1. Configure your interval here (scheduling)</li>
              <li>2. Setup credentials in User Credentials page</li>
              <li>3. Enable auto-posting from Dashboard</li>
              <li>4. Posts will be created automatically on schedule</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2">⚙️ Need to Update Credentials?</h3>
            <p className="text-sm text-yellow-800 mb-3">
              Your Gemini API key and WordPress login are stored securely elsewhere.
            </p>
            <a 
              href="/user-credentials" 
              className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium transition"
            >
              Update Credentials
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
