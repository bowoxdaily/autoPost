import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { logsAPI } from '../utils/api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await logsAPI.get(500);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all logs? This cannot be undone.')) {
      return;
    }

    setClearingLogs(true);
    try {
      await logsAPI.clear();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setClearingLogs(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return '✅ Success';
      case 'failed':
        return '❌ Failed';
      default:
        return '⏱️ Pending';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Post History</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={handleClearLogs}
            disabled={clearingLogs || logs.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition"
          >
            <Trash2 size={18} />
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No logs yet. Start AutoPost to see post history here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SEO Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Keywords</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium truncate">
                      {log.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(log.status)}`}>
                        {getStatusBadge(log.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.seoScore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                log.seoScore >= 80 ? 'bg-green-500' :
                                log.seoScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${log.seoScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{log.seoScore}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.keywords ? (
                        <div className="flex gap-1 flex-wrap">
                          {log.keywords.split(',').slice(0, 2).map((kw, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {kw.trim()}
                            </span>
                          ))}
                          {log.keywords.split(',').length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{log.keywords.split(',').length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {log.status === 'success' && log.link && (
                        <a
                          href={log.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Post
                        </a>
                      )}
                      {log.status === 'failed' && log.error && (
                        <span className="text-red-600 text-xs">{log.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600 border-t">
            Total: {logs.length} posts
          </div>
        </div>
      )}
    </div>
  );
}
