import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BrandingSettings from './BrandingSettings';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    checkSuperuser();
    fetchStats();
  }, []);

  async function checkSuperuser() {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.role !== 'superuser') {
        navigate('/dashboard');
        return;
      }
      setUser(storedUser);
    } catch (error) {
      console.error('Error checking superuser:', error);
      navigate('/login');
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  }

  if (loading) return <div className="admin-loading">Loading admin panel...</div>;
  if (!user || user.role !== 'superuser') return null;

  return (
    <div className="admin-panel-content">
      <div className="admin-header-content">
        <h1>🎛️ Admin Dashboard</h1>
        <p>Welcome back, superuser! Manage your SaaS platform</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          💳 Billing
        </button>
        <button 
          className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          🎨 Branding
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'stats' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{stats.total_posts}</div>
              <div className="stat-label">Total Posts Generated</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{stats.total_api_calls.toLocaleString()}</div>
              <div className="stat-label">Total API Calls</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{stats.users_by_plan.free}</div>
              <div className="stat-label">Free Plan Users</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{stats.users_by_plan.pro}</div>
              <div className="stat-label">Pro Plan Users</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-value">{stats.users_by_plan.enterprise}</div>
              <div className="stat-label">Enterprise Users</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            <UsersList />
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="billing-section">
            <h2>Billing & Subscriptions</h2>
            <BillingStats stats={stats} />
          </div>
        )}

        {activeTab === 'branding' && (
          <BrandingSettings />
        )}
      </div>
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  }

  async function updateUserRole(userId, newRole) {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      alert('Error updating role: ' + error.response?.data?.error);
    }
  }

  async function updateSubscription(userId, plan) {
    try {
      await api.put(`/users/${userId}/subscription`, { subscription_plan: plan });
      fetchUsers();
    } catch (error) {
      alert('Error updating subscription: ' + error.response?.data?.error);
    }
  }

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="users-list">
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Usage</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name}</td>
                <td>
                  <select 
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={user.subscription_plan}
                    onChange={(e) => updateSubscription(user.id, e.target.value)}
                    className="plan-select"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td>{user.api_usage} / {user.api_limit}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="action-btn">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BillingStats({ stats }) {
  return (
    <div className="billing-stats">
      <div className="billing-card">
        <h3>Revenue Breakdown</h3>
        <div className="revenue-item">
          <span>Free Plan ({stats?.users_by_plan.free})</span>
          <span>$0</span>
        </div>
        <div className="revenue-item">
          <span>Pro Plan ({stats?.users_by_plan.pro})</span>
          <span>${stats?.users_by_plan.pro * 29}/month</span>
        </div>
        <div className="revenue-item">
          <span>Enterprise ({stats?.users_by_plan.enterprise})</span>
          <span>Custom</span>
        </div>
      </div>

      <div className="billing-card">
        <h3>Quick Actions</h3>
        <button className="action-button">Set Pricing</button>
        <button className="action-button">View Invoices</button>
        <button className="action-button">Payout Settings</button>
      </div>
    </div>
  );
}
