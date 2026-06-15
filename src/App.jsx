import React, { useEffect } from 'react';
import { useAppStore } from './store';
import BottomNavigation from './components/BottomNavigation';
import DailyLog from './pages/DailyLog';
import MonthlyLog from './pages/MonthlyLog';
import FutureLog from './pages/FutureLog';
import IndexPage from './pages/IndexPage';
import CustomCollectionView from './pages/CustomCollectionView';
import TaskDetailView from './pages/TaskDetailView';
import ConfirmModal from './components/ConfirmModal';
import PromptModal from './components/PromptModal';

function App() {
  const { activeTab, theme, layoutMode, activeBulletId } = useAppStore();

  useEffect(() => {
    // Apply theme to body
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Apply layout mode to root
    const root = document.getElementById('root');
    root.classList.remove('layout-fluid', 'layout-fixed', 'layout-zen');
    root.classList.add(`layout-${layoutMode}`);
  }, [theme, layoutMode]);

  const renderContent = () => {
    if (activeBulletId) {
      return <TaskDetailView bulletId={activeBulletId} />;
    }

    switch (activeTab) {
      case 'daily': return <DailyLog />;
      case 'monthly': return <MonthlyLog />;
      case 'future': return <FutureLog />;
      case 'index': return <IndexPage />;
      case 'custom': return <CustomCollectionView />;
      default: return <DailyLog />;
    }
  };

  return (
    <div className="app-container">
      <div className="content-area">
        {renderContent()}
      </div>
      {layoutMode !== 'zen' && !activeBulletId && <BottomNavigation />}
      <ConfirmModal />
      <PromptModal />
    </div>
  );
}

export default App;
