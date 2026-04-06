import { useState, useEffect } from 'react';
import { Play, Pause, RotateCw, BarChart2, CheckCircle, XCircle, Power } from 'lucide-react';
import { cronAPI, logsAPI } from '../utils/api';
import '../styles/ModernDashboard.css';

export default function Home() {
  const [cronStatus, setCronStatus] = useState(null);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastToggleTime, setLastToggleTime] = useState(0);
  const [isPollingPaused, setIsPollingPaused] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchStats();
    const interval = setInterval(() => {
      // Skip polling if just toggled (wait 2 seconds before polling again)
      if (Date.now() - lastToggleTime > 2000) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lastToggleTime]);

  const fetchStatus = async () => {
    if (isPollingPaused) return;
    try {
      const { data } = await cronAPI.status();
      setCronStatus(data);
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await logsAPI.get(1000);
      const logs = data.logs || [];
      setStats({
        total: logs.length,
        success: logs.filter(l => l.status === 'success').length,
        failed: logs.filter(l => l.status === 'failed').length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleToggleCron = async () => {
    setLoading(true);
    const previousState = cronStatus?.active;
    
    // Mark that we just toggled - pause polling for 2 seconds
    setLastToggleTime(Date.now());
    
    console.log('🔄 Toggling cron automation:', { previousState, currentActive: cronStatus?.active });
    
    try {
      // Optimistic update - update UI immediately
      setCronStatus(prev => ({ ...prev, active: !previousState }));
      console.log('✅ UI updated optimistically to:', !previousState);
      
      if (previousState) {
        console.log('📤 Sending STOP request to backend...');
        const stopResponse = await cronAPI.stop();
        console.log('✅ Stop response:', stopResponse.data);
        setMessage('✓ Automation has been paused.');
      } else {
        console.log('📤 Sending START request to backend...');
        const startResponse = await cronAPI.start();
        console.log('✅ Start response:', startResponse.data);
        setMessage('✓ Automation has been started.');
      }
      
      // Verify status from server after a longer delay to avoid race conditions
      setTimeout(async () => {
        try {
          console.log('🔍 Verifying status from server...');
          const { data } = await cronAPI.status();
          console.log('📊 Server status:', data);
          // Only update if state hasn't changed since our action
          setCronStatus(data);
          console.log('✅ Status verified and UI updated');
        } catch (error) {
          console.error('❌ Failed to refresh status:', error);
        }
      }, 1500);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      // Revert UI on error immediately
      console.error('❌ Error during toggle:', error);
      setCronStatus(prev => ({ ...prev, active: previousState }));
      const errorMsg = error.response?.data?.error || error.message;
      setMessage(`✗ Error: ${errorMsg}`);
      console.error('Toggle cron error details:', { 
        status: error.response?.status,
        data: error.response?.data,
        message: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async () => {
    setLoading(true);
    console.log('📤 Attempting to create new post...');
    try {
      console.log('🔗 Calling cronAPI.runNow()...');
      const response = await cronAPI.runNow();
      console.log('✅ Success:', response.data);
      setMessage('✓ New post created and published successfully!');
      setTimeout(() => fetchStats(), 2000);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error creating post:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        isNetworkError: !error.response
      });
      
      const errorMsg = error.response?.data?.error || error.message;
      
      // Better error messages for network issues
      if (!error.response) {
        if (error.message.includes('Network')) {
          setMessage(`✗ Network Error: Backend not reachable. Make sure backend is running at http://localhost:5000`);
        } else {
          setMessage(`✗ Network Error: ${error.message}`);
        }
      } else {
        setMessage(`✗ Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('🧪 Testing backend connection...');
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        setMessage('✓ Backend connection successful!');
      } else {
        setMessage(`✗ Backend error: ${response.statusText}`);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setMessage(`✗ Cannot connect to backend. Error: ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="dashboard-modern space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold dashboard-header">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your AutoPost summary.</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          <span>{message}</span>
          {message.includes('Network') && (
            <button
              onClick={testConnection}
              className="sm:ml-4 px-3 py-1 bg-white rounded text-xs font-bold hover:bg-gray-100"
            >
              Test Connection
            </button>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Posts */}
        <div className="stat-card stat-card-total">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Posts</h3>
            <div className="stat-card-icon">
              <BarChart2 size={22} />
            </div>
          </div>
          <p className="stat-card-value">{stats.total}</p>
          <p className="stat-card-footer">All-time generated posts</p>
        </div>

        {/* Successful Posts */}
        <div className="stat-card stat-card-success">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Successful</h3>
            <div className="stat-card-icon">
              <CheckCircle size={22} />
            </div>
          </div>
          <p className="stat-card-value">{stats.success}</p>
          <p className="stat-card-footer">Successfully published</p>
        </div>

        {/* Failed Posts */}
        <div className="stat-card stat-card-failed">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Failed</h3>
            <div className="stat-card-icon">
              <XCircle size={22} />
            </div>
          </div>
          <p className="stat-card-value">{stats.failed}</p>
          <p className="stat-card-footer">Failed to publish</p>
        </div>
        
        {/* Automation Status */}
        <div className="stat-card stat-card-status">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Automation Status</h3>
            <div className="stat-card-icon">
              <Power size={22} />
            </div>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${cronStatus?.active ? 'status-dot-active' : 'status-dot-inactive'}`}></div>
            <span>{cronStatus?.active ? 'Active' : 'Inactive'}</span>
          </div>
          <p className="stat-card-footer">Next run: {cronStatus?.nextRun ? new Date(cronStatus.nextRun).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-3">Manual Post</h3>
          <p className="text-gray-600 text-sm mb-4">Instantly generate and publish a new post to your WordPress site.</p>
          <button
            onClick={handleRunNow}
            disabled={loading}
            className="action-button action-button-primary"
          >
            <RotateCw size={20} />
            {loading ? 'Processing...' : 'Create & Publish Now'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-3">Automation Control</h3>
          <p className="text-gray-600 text-sm mb-4">Start or stop the automated posting schedule.</p>
          <button
            onClick={handleToggleCron}
            disabled={loading}
            className="action-button action-button-secondary"
          >
            {cronStatus?.active ? <Pause size={20} /> : <Play size={20} />}
            {loading ? 'Processing...' : (cronStatus?.active ? 'Stop Automation' : 'Start Automation')}
          </button>
          
          {/* Status Indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm mb-3">
              <div className={`w-3 h-3 rounded-full ${cronStatus?.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Status: <span className={cronStatus?.active ? 'text-green-600' : 'text-red-600'}>{cronStatus?.active ? 'ACTIVE' : 'INACTIVE'}</span></span>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between items-start sm:items-center gap-3">
                <span>📅 Posting Interval:</span>
                <strong className="text-gray-900">{cronStatus?.interval || 12} hours</strong>
              </div>
              {cronStatus?.active && cronStatus?.nextRun && (
                <div className="flex justify-between items-start sm:items-center gap-3 bg-green-50 p-2 rounded">
                  <span>⏰ Next Post:</span>
                  <strong className="text-green-700 text-right">{new Date(cronStatus.nextRun).toLocaleString()}</strong>
                </div>
              )}
              {cronStatus?.active && (
                <div className="pt-2 text-blue-600">
                  💡 Posts will be created every <strong>{cronStatus?.interval || 12}</strong> hours
                </div>
              )}
            </div>
            
            <div className="mt-3 text-xs">
              <a href="/settings" className="text-blue-600 hover:text-blue-800 underline">
                ⚙️ Change interval in Settings
              </a>
            </div>
            
            <button
              onClick={() => {
                console.log('📋 DEBUG INFO:', { cronStatus });
                setMessage(`Debug: Status=${cronStatus?.active}, Running=${cronStatus?.running}, Interval=${cronStatus?.interval}`);
                setTimeout(() => setMessage(''), 5000);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              Show Debug Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
