import React from 'react';
import { useAppStore } from '../store';
import { Moon, Sun, Maximize, Minimize, Expand } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({ title }) {
  const { theme, setTheme, layoutMode, cycleLayoutMode } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getLayoutIcon = () => {
    if (layoutMode === 'fluid') return <Maximize size={20} />;
    if (layoutMode === 'zen') return <Minimize size={20} />;
    return <Maximize size={20} />;
  };

  const getLayoutLabel = () => {
    if (layoutMode === 'fluid') return "Default (Show Nav)";
    if (layoutMode === 'zen') return "Zen Mode (Hide Nav)";
    return "Layout";
  };

  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="icon-btn" onClick={cycleLayoutMode} aria-label="Toggle Layout Mode" title={getLayoutLabel()}>
          {getLayoutIcon()}
        </button>
      </div>
    </div>
  );
}
