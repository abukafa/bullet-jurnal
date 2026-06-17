import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import { getLocalISODate, toProperCase } from '../utils';
import PageHeader from '../components/PageHeader';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import './HabitTracker.css';

const XMark = () => (
  <motion.svg
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="10"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="habit-x-mark"
    preserveAspectRatio="none"
  >
    <motion.path
      d="M100 0 L0 100"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    />
    <motion.path
      d="M0 0 L100 100"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
    />
  </motion.svg>
);

export default function HabitTracker() {
  const { showConfirm } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newHabitName, setNewHabitName] = useState('');
  
  const todayStr = getLocalISODate(new Date());
  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const habits = useLiveQuery(() => db.habits.toArray(), []);
  const logs = useLiveQuery(() => db.habitLogs.where('date').startsWith(monthStr).toArray(), [monthStr]);

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        dateStr: `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    return days;
  }, [year, monthIdx, daysInMonth]);

  const logMap = useMemo(() => {
    const map = {};
    if (logs) {
      logs.forEach(log => {
        map[`${log.habitId}_${log.date}`] = true;
      });
    }
    return map;
  }, [logs]);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const name = toProperCase(newHabitName.trim());
    await db.habits.add({ name, createdAt: new Date() });
    setNewHabitName('');
  };

  const handleDeleteHabit = (id) => {
    showConfirm("Delete this habit and all its history?", async () => {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    });
  };

  const toggleLog = async (habitId, dateStr) => {
    const key = `${habitId}_${dateStr}`;
    const exists = logMap[key];

    if (exists) {
      await db.habitLogs.delete([habitId, dateStr]);
    } else {
      if (navigator.vibrate) navigator.vibrate(40);
      await db.habitLogs.add({ habitId, date: dateStr });
    }
  };

  const prevMonth = () => setCurrentMonth(new Date(year, monthIdx - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, monthIdx + 1, 1));

  // Auto-scroll logic to focus on today
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current && monthStr === todayStr.substring(0, 7)) {
      const todayEl = scrollRef.current.querySelector('.grid-col-today');
      if (todayEl) {
        // center today visually
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [monthStr, todayStr]);

  return (
    <div className="habit-tracker-page">
      <PageHeader title="Habits" />
      
      <div className="calendar-navigation">
        <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={24} /></button>
        <h2 className="month-title">{monthName}</h2>
        <button onClick={nextMonth} className="nav-btn"><ChevronRight size={24} /></button>
      </div>

      <div className="habits-container">
        <form className="add-habit-form" onSubmit={handleAddHabit}>
          <input 
            type="text" 
            placeholder="Add new habit..." 
            value={newHabitName}
            onChange={e => setNewHabitName(e.target.value)}
          />
          <button type="submit" disabled={!newHabitName.trim()}>
            <Plus size={20} />
          </button>
        </form>

        <div className="habit-grid-wrapper" ref={scrollRef}>
          <table className="habit-grid">
            <thead>
              <tr>
                <th className="habit-name-col">Habit</th>
                {calendarDays.map(d => (
                  <th key={d.dateStr} className={`grid-col ${d.dateStr === todayStr ? 'grid-col-today' : ''}`}>
                    {d.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits?.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 1} className="empty-state">No habits added yet.</td>
                </tr>
              )}
              {habits?.map(habit => (
                <tr key={habit.id}>
                  <td className="habit-name-cell">
                    <span className="habit-name">{habit.name}</span>
                    <button className="del-habit-btn" onClick={() => handleDeleteHabit(habit.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                  {calendarDays.map(d => {
                    const isChecked = logMap[`${habit.id}_${d.dateStr}`];
                    return (
                      <td key={d.dateStr} className="habit-cell-wrapper">
                        <motion.button 
                          className={`habit-cell ${isChecked ? 'checked' : ''} ${d.dateStr === todayStr ? 'today-cell' : ''}`}
                          onClick={() => toggleLog(habit.id, d.dateStr)}
                          whileTap={{ scale: 0.85 }}
                        >
                          <AnimatePresence>
                            {isChecked && (
                              <motion.div 
                                className="x-mark-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                              >
                                <XMark />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
