import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import BulletItem from '../components/BulletItem';
import BulletInput from '../components/BulletInput';
import PageHeader from '../components/PageHeader';
import './FutureLog.css';

function FutureMonth({ year, month }) {
  const monthIdx = month - 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthDate = new Date(year, monthIdx, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

  // Get or create page for this month (for BulletInput attachment)
  const [pageId, setPageId] = useState(null);
  useEffect(() => {
    const initPage = async () => {
      let page = await db.pages.where({ date: monthStr, type: 'future' }).first();
      if (!page) {
        const id = await db.pages.add({ type: 'future', date: monthStr, title: monthName, createdAt: new Date(), updatedAt: new Date() });
        setPageId('page_' + id);
      } else {
        setPageId('page_' + page.id);
      }
    };
    initPage();
  }, [monthStr, monthName]);

  // V2: Fetch ALL events globally, and filter by those that start with this monthStr
  const bullets = useLiveQuery(
    async () => {
      const allEvents = await db.bullets.where('type').equals('event').toArray();
      return allEvents
        .filter(b => b.date && b.date.startsWith(monthStr))
        .sort((a, b) => {
          const dateA = a.date || '9999-99-99';
          const dateB = b.date || '9999-99-99';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          
          const timeA = a.time || '99:99';
          const timeB = b.time || '99:99';
          if (timeA !== timeB) return timeA.localeCompare(timeB);
          
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    },
    [monthStr]
  );

  const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;

  return (
    <div className="future-month-card">
      <h3>{monthName}</h3>
      <div className="bullets-container future">
        {bullets?.map(b => (
          <BulletItem key={b.id} bullet={b} compact={true} searchResult={true} shortDate={true} />
        ))}
      </div>
      {pageId && (
        <BulletInput 
          pageId={pageId} 
          defaultDate={dateStr}
          defaultType="event"
          defaultStatus="incomplete"
        />
      )}
    </div>
  );
}

export default function FutureLog() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const next6Months = Array.from({ length: 6 }, (_, i) => {
    let m = currentMonth + i;
    let y = currentYear;
    if (m > 12) {
      m -= 12;
      y += 1;
    }
    return { month: m, year: y };
  });

  return (
    <div className="future-log">
      <PageHeader title="Future Log" />
      <div className="future-grid">
        {next6Months.map(({ month, year }) => (
          <FutureMonth key={`${year}-${month}`} year={year} month={month} />
        ))}
      </div>
    </div>
  );
}
