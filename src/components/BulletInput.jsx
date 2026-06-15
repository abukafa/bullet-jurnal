import React, { useState } from 'react';
import { db } from '../db';
import './BulletInput.css';

export default function BulletInput({ pageId, defaultDate, defaultStatus, defaultType, forceUppercase, forceProperCase, onAdd }) {
  const [text, setText] = useState('');

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && text.trim() !== '') {
      e.preventDefault();
      await parseAndAddBullet(text.trim());
      setText('');
    }
  };

  const toProperCase = (str) => {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const parseAndAddBullet = async (input) => {
    let type = defaultType || 'task';
    let cleanText = input;

    // Very basic parsing based on Ryder Carroll's symbols
    if (input.startsWith('- ')) {
      type = 'note';
      cleanText = input.substring(2);
    } else if (input.startsWith('o ') || input.startsWith('O ')) {
      type = 'event';
      cleanText = input.substring(2);
    } else if (input.startsWith('. ')) {
      type = 'task';
      cleanText = input.substring(2);
    }
    
    if (forceUppercase) {
      cleanText = cleanText.toUpperCase();
    } else if (forceProperCase) {
      cleanText = toProperCase(cleanText);
    }

    const now = new Date();
    
    // Create local timezone date string (YYYY-MM-DD)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = defaultDate || `${year}-${month}-${day}`;
    
    // Create local timezone time string (HH:MM)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newBullet = {
      pageId,
      type,
      status: defaultStatus || 'incomplete',
      text: cleanText,
      date: dateStr,
      time: timeStr,
      order: Date.now(),
      createdAt: now,
      updatedAt: now
    };

    const id = await db.bullets.add(newBullet);
    if (onAdd) onAdd({ ...newBullet, id });
  };

  return (
    <div className="bullet-input-wrapper">
      <div className="bullet-input-symbol">•</div>
      <input
        type="text"
        className="bullet-input"
        placeholder="Type '.' for task, '-' for note, 'o' for event..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
    </div>
  );
}
