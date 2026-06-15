import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import BulletItem from '../components/BulletItem';
import BulletInput from '../components/BulletInput';
import PageHeader from '../components/PageHeader';
import { useAppStore } from '../store';
import './DailyLog.css';

export default function DailyLog() {
  const [pageId, setPageId] = useState(null);

  // Get today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Find or create today's page
  useEffect(() => {
    const initDailyPage = async () => {
      let page = await db.pages.where({ date: todayStr, type: 'daily' }).first();
      if (!page) {
        const id = await db.pages.add({
          type: 'daily',
          date: todayStr,
          title: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setPageId('page_' + id);
      } else {
        setPageId('page_' + page.id);
      }
    };
    initDailyPage();
  }, [todayStr]);

  // 2. Query bullets for this page
  const bullets = useLiveQuery(
    async () => {
      if (!pageId) return [];
      
      // Get bullets assigned to today's page
      const pageBullets = await db.bullets.where({ pageId }).toArray();
      
      // Get bullets explicitly scheduled for today from anywhere
      const dateBullets = await db.bullets.where('date').equals(todayStr).toArray();
      
      // Merge and deduplicate by id
      const mergedMap = new Map();
      
      pageBullets.forEach(b => {
        // If it belongs to this page, but its date is EXPLICITLY NOT today, exclude it
        if (b.date && b.date !== todayStr) return;
        mergedMap.set(b.id, b);
      });
      
      dateBullets.forEach(b => {
        mergedMap.set(b.id, b);
      });
      
      const merged = Array.from(mergedMap.values());
      
      // Auto-sort by time (earlier goes up), then by createdAt
      return merged.sort((a, b) => {
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
    [pageId, todayStr]
  );

  if (!pageId) return <div className="loading">Loading...</div>;

  const dateTitle = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="daily-log">
      <PageHeader title={dateTitle} />

      <div className="bullets-container">
        {bullets?.map(b => (
          <BulletItem key={b.id} bullet={b} />
        ))}
      </div>

      <BulletInput pageId={pageId} />
    </div>
  );
}
