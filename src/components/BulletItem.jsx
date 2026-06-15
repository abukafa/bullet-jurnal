import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import './BulletItem.css';

export default function BulletItem({ bullet, compact, contextLabel }) {
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
      await db.bullets.update(bullet.id, { status: 'migrated', updatedAt: new Date() });
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    } else if (offset < -swipeThreshold) {
      setStatus('scheduled');
      await db.bullets.update(bullet.id, { status: 'scheduled', updatedAt: new Date() });
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    }

    controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  };

  const renderSymbol = () => {
    if (type === 'event') return '○';
    if (type === 'note') return '—';
    if (status === 'complete') return '×';
    if (status === 'migrated') return '>';
    if (status === 'scheduled') return '<';
    return '•';
  };

  const openDetail = () => {
    setActiveBulletId(bullet.id);
  };

  const displayTime = bullet.time || (bullet.createdAt ? `${String(new Date(bullet.createdAt).getHours()).padStart(2, '0')}:${String(new Date(bullet.createdAt).getMinutes()).padStart(2, '0')}` : null);

  return (
    <motion.div 
      className="bullet-wrapper"
      drag={type === 'task' ? "x" : false}
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
          className={`bullet-text ${isComplete ? 'strikethrough' : ''} ${compact ? 'compact-view' : ''}`}
          onClick={openDetail}
          title="Click to view/edit details"
        >
          <div className="bullet-title">
            {bullet.text}
            {(!compact && bullet.description) && <span className="bullet-has-notes mobile-only">...</span>}
          </div>
          
          {(!compact) && (
            <>
              <div className="meta-time desktop-only">
                {contextLabel ? (
                  <span className="collection-badge">{contextLabel}</span>
                ) : displayTime ? (
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
