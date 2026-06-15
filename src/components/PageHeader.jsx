import React from 'react';
import { useAppStore } from '../store';
import { Moon, Sun, Maximize, Minimize, Expand } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({ title }) {
  const { theme, setTheme, layoutMode, cycleLayoutMode } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const renderLayoutIcon = () => {
    if (layoutMode === 'fluid') return <Maximize size={20} />;
    if (layoutMode === 'fixed') return <Minimize size={20} />;
    if (layoutMode === 'zen') return <Expand size={20} />;
  };

  const getLayoutTooltip = () => {
    if (layoutMode === 'fluid') return "Fluid (Full Width)";
    if (layoutMode === 'fixed') return "Fixed (Mobile Width)";
    if (layoutMode === 'zen') return "Zen Mode (Hide Nav)";
  };

  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="icon-btn" onClick={cycleLayoutMode} aria-label="Cycle Layout Mode" title={getLayoutTooltip()}>
          {renderLayoutIcon()}
        </button>
      </div>
    </div>
  );
}
