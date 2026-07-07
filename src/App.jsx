import React, { useEffect } from 'react';
import { useAppStore } from './store';
import { db } from './db';
import BottomNavigation from './components/BottomNavigation';
import DailyLog from './pages/DailyLog';
import MonthlyLog from './pages/MonthlyLog';
import FutureLog from './pages/FutureLog';
import IndexPage from './pages/IndexPage';
import CustomCollectionView from './pages/CustomCollectionView';
import TaskDetailView from './pages/TaskDetailView';
import HabitTracker from './pages/HabitTracker';
import OutstandingTasksView from './pages/OutstandingTasksView';
import ConfirmModal from './components/ConfirmModal';
import PromptModal from './components/PromptModal';
import { toProperCase } from './utils';

function App() {
  const { activeTab, theme, layoutMode, activeBulletId } = useAppStore();

  useEffect(() => {
    // Migration V2: convert 'task' to 'event' in 'future' pages, AND title case all bullets
    const runV2Migration = async () => {
      try {
        const allBullets = await db.bullets.toArray();
        const futurePages = await db.pages.where('type').equals('future').toArray();
        const futurePageIds = new Set(futurePages.map(p => 'page_' + p.id));

        for (const b of allBullets) {
          let updates = {};
          
          // Convert to Title Case
          if (b.text) {
            const properText = toProperCase(b.text);
            if (properText !== b.text) {
              updates.text = properText;
            }
          }

          // Convert future tasks to events
          if (b.type === 'task' && futurePageIds.has(b.pageId)) {
            updates.type = 'event';
          }

          if (Object.keys(updates).length > 0) {
            await db.bullets.update(b.id, updates);
          }
        }
      } catch (e) {
        console.error("Migration failed", e);
      }
    };
    runV2Migration();
  }, []);

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
      case 'habits': return <HabitTracker />;
      case 'custom': return <CustomCollectionView />;
      case 'outstanding': return <OutstandingTasksView />;
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
