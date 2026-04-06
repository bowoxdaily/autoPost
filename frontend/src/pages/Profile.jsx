import { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, Save } from 'lucide-react';
import { profileAPI } from '../utils/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data } = await profileAPI.get();
      const user = data?.user || null;
      setProfile(user);
      setFormData({
        name: user?.name || '',
        avatar_url: user?.avatar_url || ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load profile'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: '', text: '' });
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const payload = {
        name: formData.name.trim(),
        avatar_url: formData.avatar_url.trim()
      };

      const { data } = await profileAPI.update(payload);
      const updated = data?.user;

      if (updated) {
        setProfile(updated);

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...currentUser,
            name: updated.name,
            email: updated.email || currentUser.email,
            role: updated.role || currentUser.role
          })
        );
      }

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <User size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
            <p className="text-gray-500 text-sm">Manage your personal account information.</p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Mail size={14} /> Email
            </p>
            <p className="text-sm font-semibold text-gray-800 break-all">{profile?.email || '-'}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Shield size={14} /> Role
            </p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{profile?.role || '-'}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 md:col-span-2">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={14} /> Member Since
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {profile?.created_at ? new Date(profile.created_at).toLocaleString() : '-'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your display name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
            <input
              type="url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-gray-500 mt-2">Optional. Use a public image URL for your avatar.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
