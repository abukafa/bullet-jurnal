import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import BulletItem from '../components/BulletItem';
import BulletInput from '../components/BulletInput';
import PageHeader from '../components/PageHeader';
import './FutureLog.css';

// Memoize FutureMonth to prevent re-rendering all months when scrolling
const FutureMonth = React.memo(({ year, month }) => {
  const monthIdx = month - 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthDate = new Date(year, monthIdx, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

  // Get or create page for this month (for BulletInput attachment)
  const [pageId, setPageId] = useState(null);
  useEffect(() => {
    const initPage = async () => {
      let page = await db.pages.where('date').equals(monthStr).and(p => p.type === 'future').first();
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
      <h3>{year} - {monthName}</h3>
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
});

export default function FutureLog() {
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [range, setRange] = useState({ start: 0, end: 5 });
  const [shouldAdjustScroll, setShouldAdjustScroll] = useState(false);

  const gridRef = useRef(null);
  const leftSentinelRef = useRef(null);
  const rightSentinelRef = useRef(null);
  const oldScrollWidth = useRef(0);
  const oldScrollLeft = useRef(0);

  const monthsToRender = useMemo(() => {
    return Array.from({ length: range.end - range.start + 1 }, (_, i) => {
      const offset = range.start + i;
      let m = currentMonth + offset;
      let y = currentYear;
      
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      
      return { month: m, year: y, offset };
    });
  }, [range.start, range.end, currentMonth, currentYear]);

  // Adjust scroll position when prepending items
  useLayoutEffect(() => {
    if (shouldAdjustScroll && gridRef.current) {
      const addedWidth = gridRef.current.scrollWidth - oldScrollWidth.current;
      gridRef.current.scrollLeft = oldScrollLeft.current + addedWidth;
      setShouldAdjustScroll(false);
    }
  }, [range.start, shouldAdjustScroll]);

  useEffect(() => {
    const handleLeftVisible = (entries) => {
      if (entries[0].isIntersecting) {
        if (gridRef.current) {
          oldScrollWidth.current = gridRef.current.scrollWidth;
          oldScrollLeft.current = gridRef.current.scrollLeft;
        }
        setRange(r => ({ ...r, start: r.start - 6 }));
        setShouldAdjustScroll(true);
      }
    };

    const handleRightVisible = (entries) => {
      if (entries[0].isIntersecting) {
        setRange(r => ({ ...r, end: r.end + 6 }));
      }
    };

    const observerOptions = {
      root: gridRef.current,
      rootMargin: '200px',
      threshold: 0
    };

    const leftObserver = new IntersectionObserver(handleLeftVisible, observerOptions);
    const rightObserver = new IntersectionObserver(handleRightVisible, observerOptions);

    if (leftSentinelRef.current) leftObserver.observe(leftSentinelRef.current);
    if (rightSentinelRef.current) rightObserver.observe(rightSentinelRef.current);

    return () => {
      leftObserver.disconnect();
      rightObserver.disconnect();
    };
  }, []); // Empty dependency array ensures we only set up observers once

  return (
    <div className="future-log">
      <PageHeader title="Future Log" />
      <div className="future-grid" ref={gridRef}>
        <div ref={leftSentinelRef} style={{ minWidth: '1px', flexShrink: 0 }} />
        {monthsToRender.map(({ month, year }) => (
          <FutureMonth key={`${year}-${month}`} year={year} month={month} />
        ))}
        <div ref={rightSentinelRef} style={{ minWidth: '1px', flexShrink: 0 }} />
      </div>
    </div>
  );
}
