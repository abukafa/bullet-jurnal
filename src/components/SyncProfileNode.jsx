import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../store';
import { Cloud, CloudOff, CloudSync, LogOut } from 'lucide-react';
import { syncData } from '../services/syncService';
import { db } from '../db';
import './SyncProfileNode.css';

export default function SyncProfileNode() {
  const { user, setUser, syncStatus, setSyncStatus, isAutoSyncEnabled, setAutoSyncEnabled } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.credential || tokenResponse.access_token })
        });
        const data = await res.json();
        if (data.token) {
          setUser({ ...data.user, token: data.token });
          syncData(data.token);
        }
      } catch (err) {
        console.error('Login failed', err);
      }
    }
  });

  useEffect(() => {
    let interval;
    if (isAutoSyncEnabled && user?.token) {
      interval = setInterval(() => {
        // Prevent overlapping syncs
        if (useAppStore.getState().syncStatus !== 'syncing') {
          syncData(user.token);
        }
      }, 30000); // 30 seconds interval
    }
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, user?.token]);

  const handleLogout = () => {
    setUser(null);
    setDropdownOpen(false);
  };

  const handleManualSync = () => {
    if (user?.token && syncStatus !== 'syncing') {
      syncData(user.token);
    }
  };

  const handleResetAndPull = () => {
    const store = useAppStore.getState();
    store.showConfirm(
      "Apakah Anda yakin ingin MENGHAPUS SEMUA DATA LOKAL dan menarik ulang murni dari Cloud? (Gunakan jika data di perangkat ini tidak ingin digabungkan)",
      async () => { // onConfirm
        setDropdownOpen(false);
        try {
          await db.transaction('rw', db.pages, db.bullets, db.collections, db.habits, db.habitLogs, async () => {
            await db.pages.clear();
            await db.bullets.clear();
            await db.collections.clear();
            await db.habits.clear();
            await db.habitLogs.clear();
          });
          store.setLastSyncTime(null);
          syncData(user.token);
        } catch (e) {
          console.error("Failed to reset local DB", e);
        }
      }
    );
  };

  if (!user) {
    return (
      <button className="icon-btn sync-login-btn" onClick={() => login()}>
        <CloudOff size={20} />
      </button>
    );
  }

  return (
    <div className="sync-profile-container">
      <div 
        className={`sync-indicator ${syncStatus}`} 
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {syncStatus === 'syncing' ? (
          <CloudSync size={20} className="spinning" />
        ) : (
          <Cloud size={20} />
        )}
      </div>

      {dropdownOpen && (
        <div className="sync-dropdown">
          <div className="sync-user-info">
            {user.picture && <img src={user.picture} alt="Profile" className="sync-avatar" />}
            <span className="sync-name">{user.name}</span>
          </div>
          <div className="sync-actions">
            <label className="dropdown-btn" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}>
              <span>Auto Sync</span>
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isAutoSyncEnabled} 
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
            {!isAutoSyncEnabled && (
              <>
                <button className="dropdown-btn" onClick={handleManualSync}>
                  <CloudSync size={16} /> Sync Now
                </button>
                <button className="dropdown-btn" style={{color: '#f59e0b'}} onClick={handleResetAndPull}>
                  <CloudOff size={16} /> Reset Local & Pull
                </button>
              </>
            )}
            <button className="dropdown-btn logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
