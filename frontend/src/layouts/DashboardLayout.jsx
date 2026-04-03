import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Settings, FileText, LogOut, ChevronDown, Bell, User, Shield, Lock } from 'lucide-react';
import api from '../utils/api';
import '../styles/ModernLayout.css'; // Import modern layout styles

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch branding on mount
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get('/branding/public');
        if (response.data && response.data.branding) {
          setBranding(response.data.branding);
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranding();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown]')) {
        setDropdownOpen(false);
      }
    };
    
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/credentials', label: 'Credentials', icon: Lock },
    { path: '/logs', label: 'Logs', icon: FileText }
  ];

  // Add admin panel for superuser
  if (user?.role === 'superuser') {
    menuItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
  }

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => currentPath.startsWith(item.path));
    if (currentPath === '/profile') return 'My Profile';
    if (currentPath === '/credentials') return 'Credentials';
    return activeItem ? activeItem.label : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-main-bg modern-layout">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} sidebar flex flex-col`}>
        <div className="sidebar-header flex items-center justify-between p-4">
          {sidebarOpen && (
            <Link to="/dashboard" className="sidebar-logo-link flex items-center gap-3 min-w-0">
              {branding?.logo_url && (
                <img 
                  src={branding.logo_url} 
                  alt="Logo" 
                  className="h-8 w-8 object-contain flex-shrink-0 rounded"
                />
              )}
              <h1 className="text-xl font-bold truncate text-white">{branding?.company_name || 'AutoPost'}</h1>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-sidebar-hover-bg p-2 rounded flex-shrink-0"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white logout-button transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {sidebarOpen && (
            <p className="text-xs text-gray-500 mt-4 text-center">© 2026 {branding?.company_name || 'AutoPost'}</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="main-header px-6 flex items-center justify-between">
          <div className="breadcrumbs text-lg font-semibold text-header-text">
            <span>Dashboard</span> / <span className="text-indigo-600">{getPageTitle()}</span>
          </div>
          
          {/* Header Right Section */}
          <div className="flex items-center gap-6">
            {/* Notifications Bell */}
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" data-dropdown>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 transition profile-button"
              >
                <div className="profile-avatar">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {sidebarOpen && (
                  <div className="text-left pr-2">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.role === 'superuser' ? 'Superuser' : 'User'}</p>
                  </div>
                )}
                 <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 profile-dropdown">
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User size={16} /> Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-main-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
