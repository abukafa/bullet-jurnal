import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import './BulletItem.css';

export default function BulletItem({ bullet, compact, contextLabel, searchResult, shortDate }) {
  const controls = useAnimation();
  const { setActiveBulletId } = useAppStore();
  const [status, setStatus] = useState(bullet.status);
  const type = bullet.type;
  
  const isComplete = status === 'complete';

  const handleStatusToggle = async () => {
    if (type !== 'task') return;

    const newStatus = status === 'complete' ? 'incomplete' : 'complete';
    
    if (navigator.vibrate && newStatus === 'complete') {
      navigator.vibrate(50);
    }

    setStatus(newStatus);
    await db.bullets.update(bullet.id, { status: newStatus, updatedAt: new Date() });
  };

  const handleDragEnd = async (event, info) => {
    const offset = info.offset.x;
    const swipeThreshold = 80;

    if (offset > swipeThreshold) {
      setStatus('migrated');
      let finalDate = bullet.date;
      if (finalDate) {
        const [y, m, d] = finalDate.split('-');
        let newM = parseInt(m) + 1;
        let newY = parseInt(y);
        if (newM > 12) {
          newM = 1;
          newY++;
        }
        const daysInNextMonth = new Date(newY, newM, 0).getDate();
        let newD = Math.min(parseInt(d), daysInNextMonth);
        finalDate = `${newY}-${String(newM).padStart(2, '0')}-${String(newD).padStart(2, '0')}`;
      }
      await db.bullets.update(bullet.id, { status: 'migrated', date: finalDate, updatedAt: new Date() });
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    } else if (offset < -swipeThreshold) {
      setStatus('scheduled');
      await db.bullets.update(bullet.id, { status: 'scheduled', updatedAt: new Date() });
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    }

    controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  };

  const renderSymbol = () => {
    if (status === 'migrated') return '>';
    if (status === 'scheduled') return '<';
    if (status === 'complete') return '×';
    
    if (type === 'event') return '○';
    if (type === 'note') return '—';
    return '•';
  };

  const openDetail = () => {
    setActiveBulletId(bullet.id);
  };

  const displayTime = bullet.time || (bullet.createdAt ? `${String(new Date(bullet.createdAt).getHours()).padStart(2, '0')}:${String(new Date(bullet.createdAt).getMinutes()).padStart(2, '0')}` : null);
  
  let dateText = bullet.date;
  if (shortDate && bullet.date) {
    const [y, m, d] = bullet.date.split('-');
    if (y && m && d) {
      const dateObj = new Date(y, parseInt(m) - 1, parseInt(d));
      const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      dateText = `${dayStr}, ${parseInt(d)}`;
    }
  }

  return (
    <motion.div 
      className="bullet-wrapper"
      drag={type !== 'note' ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
    >
      <div className="bullet-row">
        <button 
          className={`bullet-symbol ${type} ${status}`} 
          onClick={handleStatusToggle}
          disabled={type !== 'task'}
          title={type === 'task' ? 'Toggle status' : ''}
        >
          {renderSymbol()}
        </button>
        
        <div 
          className={`bullet-text ${isComplete ? 'strikethrough' : ''} ${compact ? 'compact-view' : ''} ${searchResult ? 'search-result-view' : ''} ${type === 'note' ? (bullet.pageId?.startsWith('col_') ? 'note-collection' : 'note-daily') : ''}`}
          onClick={openDetail}
          title="Click to view/edit details"
        >
          <div className="bullet-title-container">
            <div className="bullet-title">
              {bullet.text}
              {(!compact && !searchResult && bullet.description) && <span className="bullet-has-notes mobile-only">...</span>}
            </div>
            {(searchResult || compact) && (
              <div className="mobile-only mobile-date-under">
                {dateText}
              </div>
            )}
          </div>
          
          {(searchResult || compact) ? (
            <div className="desktop-only search-meta-desktop">
              {searchResult && contextLabel && <span className="collection-badge">{contextLabel}</span>}
              <span className="search-date">{dateText}</span>
            </div>
          ) : (
            <>
              <div className="meta-time desktop-only">
                {displayTime ? (
                  <span className="time-badge">{displayTime}</span>
                ) : null}
              </div>
              
              <div className="meta-desc desktop-only">
                {bullet.description || ''}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
