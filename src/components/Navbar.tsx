import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Calendar, 
  BarChart3, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  ChevronDown,
  Globe,
  Award
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification } from '../types';

export const Navbar: React.FC = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    if (!profile) return;

    const notificationsRef = collection(db, 'notifications');
    // We fetch global notifications or user-specific ones
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as AppNotification;
        // Filter in memory for simplicity or keep global
        if (!data.userId || data.userId === profile.uid) {
          notifs.push({ ...data, id: d.id });
        }
      });
      setNotifications(notifs);
      
      // Calculate unread count (using localstorage as fallback or just counting)
      const readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${profile.uid}`) || '[]');
      const unread = notifs.filter(n => !readNotifs.includes(n.id)).length;
      setUnreadCount(unread);
    });

    return unsubscribe;
  }, [profile]);

  const markAllAsRead = () => {
    if (!profile || notifications.length === 0) return;
    const readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${profile.uid}`) || '[]');
    notifications.forEach(n => {
      if (!readNotifs.includes(n.id)) {
        readNotifs.push(n.id);
      }
    });
    localStorage.setItem(`read_notifs_${profile.uid}`, JSON.stringify(readNotifs));
    setUnreadCount(0);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      markAllAsRead();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Calendar },
    { name: 'Pronósticos', path: '/pronosticos', icon: Trophy },
    { name: 'Clasificación', path: '/ranking', icon: Award },
    { name: 'Estadísticas', path: '/estadisticas', icon: BarChart3 },
    { name: 'Mi Perfil', path: '/perfil', icon: User },
  ];

  if (profile?.isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: Settings });
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-amber-500 hover:text-amber-400 transition-colors">
              <Trophy className="h-6 w-6 text-amber-500 fill-amber-500/20" />
              <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent font-extrabold tracking-wide text-lg sm:text-xl">
                QUINIELA 2026
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive(link.path)
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-1.5 ${isActive(link.path) ? 'text-amber-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Status / Notification / Action */}
          <div className="hidden md:flex items-center space-x-4">
            {profile && (
              <>
                <div className="flex items-center space-x-3 bg-slate-850 border border-slate-800 rounded-full px-4 py-1.5 shadow-inner">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-200">{profile.displayName}</span>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center justify-end font-semibold">
                      <Award className="h-3 w-3 mr-0.5" /> {profile.points} pts
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-bold text-slate-900 border border-amber-500/30">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none transition-all duration-150 relative"
                    id="notifications-button"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-slate-950 bg-amber-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-slate-850 border border-slate-800 ring-1 ring-black ring-opacity-5 z-50 divide-y divide-slate-800 overflow-hidden">
                      <div className="p-3 bg-slate-900 flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-100 flex items-center">
                          <Bell className="h-4 w-4 mr-1.5 text-amber-500" /> Notificaciones
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-xs text-amber-500 font-medium">{unreadCount} nuevas</span>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-xs text-center text-slate-500">No hay notificaciones</p>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="p-3 hover:bg-slate-800/30 transition-colors">
                              <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                                {notif.title}
                                <span className="text-[9px] text-slate-500 font-normal">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </h4>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger menu & notifications */}
          <div className="flex md:hidden items-center space-x-2">
            {profile && (
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-slate-950 bg-amber-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-slate-850 border border-slate-800 z-50 divide-y divide-slate-800">
                    <div className="p-3 bg-slate-900 flex justify-between items-center">
                      <span className="font-semibold text-xs text-slate-200 flex items-center">
                        <Bell className="h-3.5 w-3.5 mr-1 text-amber-500" /> Notificaciones
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <p className="p-3 text-[11px] text-center text-slate-500">No hay notificaciones</p>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-2.5 hover:bg-slate-800/30">
                            <h4 className="text-xs font-bold text-slate-200 flex justify-between">
                              {notif.title}
                              <span className="text-[9px] text-slate-500">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 text-slate-400" />
                {link.name}
              </Link>
            );
          })}
          {profile && (
            <div className="pt-4 border-t border-slate-800 mt-4 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-bold text-slate-900">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{profile.displayName}</p>
                  <p className="text-xs font-mono text-amber-400">{profile.points} puntos</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center px-3 py-2 text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-1" /> Salir
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
