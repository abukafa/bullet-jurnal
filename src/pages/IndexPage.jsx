import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Plus, Folder } from 'lucide-react';
import { useAppStore } from '../store';
import PageHeader from '../components/PageHeader';
import BulletItem from '../components/BulletItem';
import './IndexPage.css';

export default function IndexPage() {
  const { setActiveTab, setActiveCollectionId, showPrompt } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const collections = useLiveQuery(() => db.collections.toArray());
  const allBullets = useLiveQuery(() => db.bullets.toArray());

  const handleCreateCollection = async () => {
    showPrompt("Enter new collection name (e.g., 'Gratitude', 'Books'):", "", async (name) => {
      if (name && name.trim() !== '') {
        const id = await db.collections.add({
          name: name.trim(),
          type: 'custom',
          createdAt: new Date()
        });
        openCollection(id);
      }
    });
  };

  const openCollection = (id) => {
    setActiveCollectionId(id);
  };

  const filteredCollections = collections?.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = (searchTerm.trim() === '' || !allBullets) ? [] : allBullets.filter(b => 
    b.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="index-page">
      <PageHeader title="Index" />
      
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search collections and tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm.trim() !== '' && (
        <div className="search-results-section">
          <h2 className="section-title">Task Results</h2>
          <div className="bullets-container index-search">
            {filteredTasks.length === 0 && <p className="empty-state">No tasks found for "{searchTerm}".</p>}
            {filteredTasks.map(b => {
              let contextLabel = null;
              if (b.pageId && b.pageId.startsWith('col_')) {
                const colId = Number(b.pageId.replace('col_', ''));
                const col = collections?.find(c => c.id === colId);
                if (col) contextLabel = col.name;
              }
              return <BulletItem key={b.id} bullet={b} contextLabel={contextLabel} />;
            })}
          </div>
        </div>
      )}

      <div className="collections-section">
        <div className="section-header">
          <h2 className="section-title">Custom Collections</h2>
          <button className="add-btn" onClick={handleCreateCollection}>
            <Plus size={20} />
          </button>
        </div>

        <div className="collections-list">
          {filteredCollections?.length === 0 && <p className="empty-state">No collections found.</p>}
          {filteredCollections?.map(col => (
            <button key={col.id} className="collection-card" onClick={() => openCollection(col.id)}>
              <Folder size={24} className="folder-icon" />
              <span>{col.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
