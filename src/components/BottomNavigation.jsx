import React from 'react';
import { useAppStore } from '../store';
import { BookOpen, CalendarDays, Calendar, Sun, Activity } from 'lucide-react';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const { activeTab, setActiveTab, isZenMode } = useAppStore();

  if (isZenMode) return null; // Hide in Zen Mode

  const tabs = [
    { id: 'daily', icon: Sun, label: 'Daily' },
    { id: 'monthly', icon: Calendar, label: 'Monthly' },
    { id: 'future', icon: CalendarDays, label: 'Future' },
    { id: 'index', icon: BookOpen, label: 'Index' },
    { id: 'habits', icon: Activity, label: 'Habits' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="nav-label">{tab.label}</span>
            {isActive && <div className="nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
