import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import { getLocalISODate, toProperCase } from '../utils';
import PageHeader from '../components/PageHeader';
import { Plus, Trash2, ChevronLeft, ChevronRight, GripVertical, Flame, LayoutGrid } from 'lucide-react';
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

const calculateStreaks = (dates, todayStr) => {
  if (!dates || dates.length === 0) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
  
  const sortedDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a)); // Descending
  
  const totalDays = sortedDates.length;
  let longestStreak = 1;
  let currentStreak = 0;
  
  const ascDates = [...sortedDates].reverse();
  let tempStreak = 1;
  for (let i = 1; i < ascDates.length; i++) {
    const prev = new Date(ascDates[i-1]);
    const curr = new Date(ascDates[i]);
    const diffDays = Math.round(Math.abs(curr - prev) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }
  
  const today = new Date(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalISODate(yesterday);
  
  if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const curr = new Date(sortedDates[i]);
      const prev = new Date(sortedDates[i-1]);
      const diffDays = Math.round(Math.abs(prev - curr) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  return { currentStreak, longestStreak, totalDays };
};

const HabitRow = ({ habit, calendarDays, todayStr, logMap, toggleLog, handleDeleteHabit, viewMode, streakData }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      as="tr" 
      value={habit} 
      dragListener={false} 
      dragControls={controls}
      className="habit-row"
    >
      <td className="habit-name-cell">
        <div 
          className="drag-handle" 
          onPointerDown={(e) => controls.start(e)} 
        >
          <GripVertical size={14} />
        </div>
        <span className="habit-name">{habit.name}</span>
        {viewMode === 'tracker' ? (
          <button className="del-habit-btn" onClick={() => handleDeleteHabit(habit.id)}>
            <Trash2 size={14} />
          </button>
        ) : (
          <div className="streak-icon-container">
            <Flame 
              size={16} 
              className={`streak-icon-inline ${streakData.currentStreak > 0 ? 'active' : ''}`} 
              fill={streakData.currentStreak > 0 ? "#ef4444" : "none"}
              color={streakData.currentStreak > 0 ? "#ef4444" : "var(--text-muted)"}
            />
          </div>
        )}
      </td>
      {viewMode === 'tracker' ? (
        calendarDays.map(d => {
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
        })
      ) : (
        <>
          <td className="streak-stats-cell">
            <span className={`streak-value ${streakData.currentStreak > 0 ? 'positive' : 'zero'}`}>{streakData.currentStreak}</span>
          </td>
          <td className="streak-stats-cell">
            <span className={`streak-value ${streakData.longestStreak > 0 ? 'positive' : 'zero'}`}>{streakData.longestStreak}</span>
          </td>
          <td className="streak-stats-cell">
            <span className={`streak-value ${streakData.totalDays > 0 ? 'positive' : 'zero'}`}>{streakData.totalDays}</span>
          </td>
        </>
      )}
    </Reorder.Item>
  );
};

export default function HabitTracker() {
  const { showConfirm } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newHabitName, setNewHabitName] = useState('');
  const [viewMode, setViewMode] = useState('streak'); // 'tracker' | 'streak'
  
  const todayStr = getLocalISODate(new Date());
  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const habitsRaw = useLiveQuery(async () => {
    const data = await db.habits.toArray();
    return data.filter(h => h.deleted !== 1);
  }, []);
  const monthlyLogs = useLiveQuery(async () => {
    const data = await db.habitLogs.where('date').startsWith(monthStr).toArray();
    return data.filter(l => l.deleted !== 1);
  }, [monthStr]);
  const allLogs = useLiveQuery(async () => {
    const data = await db.habitLogs.toArray();
    return data.filter(l => l.deleted !== 1);
  }, []); // For streak calculations

  const [localHabits, setLocalHabits] = useState([]);

  useEffect(() => {
    if (habitsRaw) {
      setLocalHabits([...habitsRaw].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [habitsRaw]);

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
    if (monthlyLogs) {
      monthlyLogs.forEach(log => {
        map[`${log.habitId}_${log.date}`] = true;
      });
    }
    return map;
  }, [monthlyLogs]);

  const streakMap = useMemo(() => {
    const map = {};
    if (allLogs) {
      // Group logs by habitId
      const grouped = {};
      allLogs.forEach(log => {
        if (!grouped[log.habitId]) grouped[log.habitId] = [];
        grouped[log.habitId].push(log.date);
      });
      
      // Calculate streaks
      Object.keys(grouped).forEach(habitId => {
        map[habitId] = calculateStreaks(grouped[habitId], todayStr);
      });
    }
    return map;
  }, [allLogs, todayStr]);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const name = toProperCase(newHabitName.trim());
    const maxOrder = localHabits.length > 0 ? Math.max(...localHabits.map(h => h.order || 0)) : 0;
    await db.habits.add({ id: crypto.randomUUID(), name, createdAt: new Date(), updatedAt: new Date(), deleted: 0, order: maxOrder + 1 });
    setNewHabitName('');
  };

  const handleDeleteHabit = (id) => {
    showConfirm("Delete this habit and all its history?", async () => {
      await db.habits.update(id, { deleted: 1, updatedAt: new Date() });
      await db.habitLogs.where('habitId').equals(id).modify({ deleted: 1, updatedAt: new Date() });
    });
  };

  const toggleLog = async (habitId, dateStr) => {
    const key = `${habitId}_${dateStr}`;
    const exists = logMap[key];

    if (exists) {
      const log = await db.habitLogs.where({ habitId, date: dateStr }).first();
      if (log) await db.habitLogs.update(log.id, { deleted: 1, updatedAt: new Date() });
    } else {
      if (navigator.vibrate) navigator.vibrate(40);
      await db.habitLogs.add({ id: crypto.randomUUID(), habitId, date: dateStr, updatedAt: new Date(), deleted: 0 });
    }
  };

  const handleReorder = async (newOrder) => {
    setLocalHabits(newOrder); // Optimistic UI update
    
    // Save to DB
    const updates = newOrder.map((h, idx) => {
      if (h.order !== idx) {
        return db.habits.update(h.id, { order: idx });
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, monthIdx - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, monthIdx + 1, 1));

  // Auto-scroll logic to focus on today
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current && viewMode === 'tracker' && monthStr === todayStr.substring(0, 7)) {
      const todayEl = scrollRef.current.querySelector('.grid-col-today');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [monthStr, todayStr, viewMode]);

  return (
    <div className="habit-tracker-page">
      <PageHeader title="Habits" />
      
      <div className="calendar-navigation">
        <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={24} /></button>
        <h2 className="month-title">{monthName}</h2>
        <button onClick={nextMonth} className="nav-btn"><ChevronRight size={24} /></button>
      </div>

      <div className="habits-container">
        <div className="habit-header-controls">
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
          <button 
            className={`mode-toggle-btn ${viewMode === 'streak' ? 'active' : ''}`}
            onClick={() => setViewMode(v => v === 'tracker' ? 'streak' : 'tracker')}
            title={`Switch to ${viewMode === 'tracker' ? 'Streak Mode' : 'Tracker Mode'}`}
          >
            {viewMode === 'tracker' ? <Flame size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>

        <div className={`habit-grid-wrapper ${viewMode === 'streak' ? 'streak-mode-active' : ''}`} ref={scrollRef}>
          <table className="habit-grid" key={viewMode}>
            <thead>
              <tr>
                <th className="habit-name-col">Habit</th>
                {viewMode === 'tracker' ? (
                  calendarDays.map(d => (
                    <th key={d.dateStr} className={`grid-col ${d.dateStr === todayStr ? 'grid-col-today' : ''}`}>
                      {d.day}
                    </th>
                  ))
                ) : (
                  <>
                    <th className="streak-header-col">Current</th>
                    <th className="streak-header-col">Best</th>
                    <th className="streak-header-col">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              axis="y" 
              values={localHabits} 
              onReorder={handleReorder}
            >
              {localHabits?.length === 0 && (
                <tr>
                  <td colSpan={viewMode === 'tracker' ? calendarDays.length + 1 : 4} className="empty-state">No habits added yet.</td>
                </tr>
              )}
              {localHabits?.map(habit => (
                <HabitRow 
                  key={habit.id}
                  habit={habit}
                  calendarDays={calendarDays}
                  todayStr={todayStr}
                  logMap={logMap}
                  toggleLog={toggleLog}
                  handleDeleteHabit={handleDeleteHabit}
                  viewMode={viewMode}
                  streakData={streakMap[habit.id] || { currentStreak: 0, longestStreak: 0, totalDays: 0 }}
                />
              ))}
            </Reorder.Group>
          </table>
        </div>
      </div>
    </div>
  );
}
