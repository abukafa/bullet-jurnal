import React, { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import PageHeader from '../components/PageHeader';
import { ArrowLeft, Trash2, Save, Calendar, Clock, AlignLeft, Tag, Folder } from 'lucide-react';
import './TaskDetailView.css';

export default function TaskDetailView({ bulletId }) {
  const { setActiveBulletId, showConfirm } = useAppStore();
  const [bullet, setBullet] = useState(null);
  const textareaRef = useRef(null);

  // Form states
  const [text, setText] = useState('');
  const [type, setType] = useState('task');
  const [status, setStatus] = useState('incomplete');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [bulletPageId, setBulletPageId] = useState('');
  const [originalPageId, setOriginalPageId] = useState('');

  const collections = useLiveQuery(async () => {
    const data = await db.collections.toArray();
    return data.filter(c => c.deleted !== 1);
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [description]);

  useEffect(() => {
    const fetchBullet = async () => {
      const b = await db.bullets.get(bulletId);
      if (b) {
        setBullet(b);
        setText(b.text || '');
        setType(b.type || 'task');
        setStatus(b.status || 'incomplete');
        setBulletPageId(b.pageId || '');
        setOriginalPageId(b.pageId || '');
        
        let initialDate = b.date;
        let initialTime = b.time;
        
        if (!initialDate || !initialTime) {
          const created = b.createdAt ? new Date(b.createdAt) : new Date();
          if (!initialDate) {
            initialDate = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
          }
          if (!initialTime) {
            initialTime = `${String(created.getHours()).padStart(2, '0')}:${String(created.getMinutes()).padStart(2, '0')}`;
          }
        }
        
        setDate(initialDate);
        setTime(initialTime);
        setDescription(b.description || '');
      }
    };
    fetchBullet();
  }, [bulletId]);

  const handleSave = async () => {
    if (!text.trim()) return;
    
    let finalDate = date;
    let finalStatus = status;

    const originalBullet = await db.bullets.get(bulletId);

    // Rule 1: Status changed to 'migrated', date unchanged -> bump date + 1 month
    if (finalStatus === 'migrated' && status !== originalBullet.status && finalDate === originalBullet.date) {
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
    }

    // Rule 2: Date changed, status unchanged -> set status to 'scheduled'
    if (finalDate !== originalBullet.date && finalStatus === originalBullet.status) {
      finalStatus = 'scheduled';
    }

    await db.bullets.update(bulletId, {
      text: text.trim(),
      type,
      status: finalStatus,
      date: finalDate,
      time,
      description,
      pageId: type === 'note' ? bulletPageId : originalPageId,
      updatedAt: new Date()
    });
    setActiveBulletId(null);
  };

  const handleDelete = () => {
    showConfirm("Are you sure you want to delete this item?", async () => {
      await db.bullets.update(bulletId, { deleted: 1, updatedAt: new Date() });
      setActiveBulletId(null);
    });
  };

  if (!bullet) return <div className="loading">Loading task details...</div>;

  return (
    <div className="task-detail-view">
      <div className="detail-header">
        <button className="back-btn" onClick={() => setActiveBulletId(null)}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}></div>
        <button className="delete-btn" onClick={handleDelete} title="Delete Task">
          <Trash2 size={20} />
        </button>
        <button className="save-btn" onClick={handleSave} title="Save Changes">
          <Save size={20} />
        </button>
      </div>

      <div className="detail-content">
        <input 
          type="text" 
          className="title-input" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Task title..."
        />

        <div className="form-group">
          <label><Tag size={16} /> Type</label>
          <div className="radio-group">
            <label className={`radio-label ${type === 'task' ? 'active' : ''}`}>
              <input type="radio" name="type" value="task" checked={type === 'task'} onChange={(e) => setType(e.target.value)} />
              Task (•)
            </label>
            <label className={`radio-label ${type === 'event' ? 'active' : ''}`}>
              <input type="radio" name="type" value="event" checked={type === 'event'} onChange={(e) => setType(e.target.value)} />
              Event (○)
            </label>
            <label className={`radio-label ${type === 'note' ? 'active' : ''}`}>
              <input type="radio" name="type" value="note" checked={type === 'note'} onChange={(e) => setType(e.target.value)} />
              Note (—)
            </label>
          </div>
        </div>

        {(type === 'task' || type === 'event') && (
          <div className="form-group">
            <label><Tag size={16} /> Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="detail-select">
              <option value="incomplete">Incomplete (•)</option>
              <option value="complete">Complete (×)</option>
              <option value="migrated">Migrated {'>'}</option>
              <option value="scheduled">Scheduled {'<'}</option>
            </select>
          </div>
        )}

        {type === 'note' && (
          <div className="form-group">
            <label><Folder size={16} /> Collection</label>
            <select 
              value={bulletPageId.startsWith('col_') ? bulletPageId.replace('col_', '') : ''} 
              onChange={(e) => setBulletPageId(e.target.value ? `col_${e.target.value}` : originalPageId)} 
              className="detail-select"
            >
              <option value="">-- Main Log (Daily/Future) --</option>
              {collections?.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group half">
            <label><Calendar size={16} /> Date</label>
            <input type="date" className="detail-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group half">
            <label><Clock size={16} /> Time</label>
            <input type="time" className="detail-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label><AlignLeft size={16} /> Description</label>
          <textarea 
            ref={textareaRef}
            className="detail-textarea auto-scale" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add extra details, sub-tasks, or brain dump here..."
            rows="4"
          />
        </div>
      </div>
    </div>
  );
}
