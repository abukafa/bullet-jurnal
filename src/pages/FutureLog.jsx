import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import BulletItem from '../components/BulletItem';
import BulletInput from '../components/BulletInput';
import PageHeader from '../components/PageHeader';
import './FutureLog.css';

function FutureMonth({ year, month }) {
  const [pageId, setPageId] = useState(null);
  
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const dateObj = new Date(year, month - 1);
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const initPage = async () => {
      let page = await db.pages.where({ date: monthStr, type: 'future' }).first();
      if (!page) {
        const id = await db.pages.add({
          type: 'future',
          date: monthStr,
          title: monthName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setPageId('page_' + id);
      } else {
        setPageId('page_' + page.id);
      }
    };
    initPage();
  }, [monthStr, monthName]);

  const bullets = useLiveQuery(
    () => (pageId ? db.bullets.where({ pageId }).sortBy('order') : []),
    [pageId]
  );

  const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;

  return (
    <div className="future-month-card">
      <h3>{monthName}</h3>
      <div className="bullets-container future">
        {bullets?.map(b => (
          <BulletItem key={b.id} bullet={b} compact={true} />
        ))}
      </div>
      {pageId && (
        <BulletInput 
          pageId={pageId} 
          defaultDate={dateStr}
          defaultStatus="scheduled"
          forceUppercase={true}
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
