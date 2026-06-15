import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import BulletItem from '../components/BulletItem';
import BulletInput from '../components/BulletInput';
import PageHeader from '../components/PageHeader';
import { useAppStore } from '../store';
import { ArrowLeft, Trash2 } from 'lucide-react';
import './CustomCollectionView.css';

export default function CustomCollectionView() {
  const { activeCollectionId: collectionId, setActiveCollectionId, showConfirm } = useAppStore();
  const [collection, setCollection] = useState(null);

  // We treat the collectionId as the pageId for bullets table, prefixed to avoid collision with pages
  const pageId = 'col_' + collectionId;

  useEffect(() => {
    const fetchCollection = async () => {
      const col = await db.collections.get(collectionId);
      setCollection(col);
    };
    fetchCollection();
  }, [collectionId]);

  const bullets = useLiveQuery(
    async () => {
      if (!pageId) return [];
      const items = await db.bullets.where({ pageId }).toArray();
      
      return items.sort((a, b) => {
        const dateA = a.date || '9999-99-99';
        const dateB = b.date || '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
    [pageId]
  );

  const handleDelete = async () => {
    showConfirm(`Are you sure you want to delete "${collection?.name}" and all its contents?`, async () => {
      // Delete collection
      await db.collections.delete(collectionId);
      // Delete associated bullets
      await db.bullets.where({ pageId }).delete();
      setActiveCollectionId(null);
    });
  };

  if (!collection) return <div className="loading">Loading...</div>;

  return (
    <div className="custom-collection-view">
      <div className="collection-header">
        <button className="back-btn" onClick={() => setActiveCollectionId(null)}>
          <ArrowLeft size={20} />
          <span>Index</span>
        </button>
        <button className="delete-btn" onClick={handleDelete} title="Delete Collection">
          <Trash2 size={18} />
        </button>
      </div>

      <PageHeader title={collection.name} />
      
      <div className="collection-content">
        <div className="bullets-container">
          {bullets?.length === 0 && (
            <p className="empty-state">Start adding items to your {collection.name}...</p>
          )}
          {bullets?.map(b => (
            <BulletItem key={b.id} bullet={b} compact={true} />
          ))}
        </div>
        <BulletInput 
          pageId={pageId} 
          defaultType="note"
          forceProperCase={true}
        />
      </div>
    </div>
  );
}
