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
import InstallPromptModal from './components/InstallPromptModal';
import { toProperCase } from './utils';
import { migrateToSyncDB } from './services/migration';

function App() {
  const { activeTab, theme, layoutMode, activeBulletId } = useAppStore();

  useEffect(() => {
    // Migration V2 and UUID Sync Migration
    const runMigrations = async () => {
      try {
        // Run UUID Migration first
        await migrateToSyncDB();

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

        // RECOVERY: Recover orphaned notes in collections from the UUID migration bug
        const allCols = await db.collections.toArray();
        const validColPageIds = new Set(allCols.map(c => 'col_' + c.id));
        
        const orphanedColBullets = allBullets.filter(b => 
          typeof b.pageId === 'string' && 
          b.pageId.startsWith('col_') && 
          !validColPageIds.has(b.pageId)
        );

        if (orphanedColBullets.length > 0) {
          console.log(`Found ${orphanedColBullets.length} orphaned notes. Recovering...`);
          const grouped = {};
          for (const b of orphanedColBullets) {
             if (!grouped[b.pageId]) grouped[b.pageId] = [];
             grouped[b.pageId].push(b);
          }

          for (const oldPageId of Object.keys(grouped)) {
             const newColId = crypto.randomUUID();
             await db.collections.add({
               id: newColId,
               name: `Recovered Notes (${oldPageId})`,
               type: 'custom',
               icon: 'folder',
               createdAt: new Date(),
               updatedAt: new Date(),
               deleted: 0
             });

             const bulletsToUpdate = grouped[oldPageId];
             for (const b of bulletsToUpdate) {
               await db.bullets.update(b.id, { 
                 pageId: 'col_' + newColId,
                 updatedAt: new Date()
               });
             }
          }
          // Force a sync if auto-sync is on
          if (useAppStore.getState().isAutoSyncEnabled) {
            // It will be caught by the interval, or we can just let the user sync.
          }
        }

      } catch (e) {
        console.error("Migration failed", e);
      }
    };
    runMigrations();
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

  const setDeferredPrompt = useAppStore(state => state.setDeferredPrompt);
  const setInstallModalOpen = useAppStore(state => state.setInstallModalOpen);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setInstallModalOpen(true);
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt so it can be garbage collected
      setDeferredPrompt(null);
      setInstallModalOpen(false);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setInstallModalOpen]);

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
      <InstallPromptModal />
    </div>
  );
}

export default App;
