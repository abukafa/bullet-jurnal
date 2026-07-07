import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { getLocalISODate } from "../utils";
import BulletItem from "../components/BulletItem";
import BulletInput from "../components/BulletInput";
import PageHeader from "../components/PageHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./MonthlyLog.css";

export default function MonthlyLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Selected date defaults to today if in current month, otherwise 1st of the month
  const today = new Date();
  const isCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();
  const todayStr = getLocalISODate(today);

  const [selectedDateStr, setSelectedDateStr] = useState(
    isCurrentMonth ? todayStr : null,
  );

  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();
  const month = String(monthIdx + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Handle month navigation
  const prevMonth = () => {
    const newMonth = new Date(year, monthIdx - 1, 1);
    setCurrentMonth(newMonth);
    setSelectedDateStr(null);
  };

  const nextMonth = () => {
    const newMonth = new Date(year, monthIdx + 1, 1);
    setCurrentMonth(newMonth);
    setSelectedDateStr(null);
  };

  // Generate calendar grid
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0 (Sun) to 6 (Sat)

  // Create array of day objects
  const calendarDays = useMemo(() => {
    const days = [];
    // Empty slots for offset
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${month}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, dateStr: dateString });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  // Efficient Dexie query: ONLY load bullets for this specific month!
  const monthlyBullets = useLiveQuery(
    () => db.bullets.where("date").startsWith(monthStr).toArray(),
    [monthStr],
  );

  // Derive dots map (which date has how many bullets)
  const dotsMap = useMemo(() => {
    const map = {};
    if (!monthlyBullets) return map;
    monthlyBullets.forEach((b) => {
      if (b.type === "note" && !b.pageId?.startsWith("page_")) return;
      if (b.date) {
        map[b.date] = true; // Just boolean is enough for dot indicator
      }
    });
    return map;
  }, [monthlyBullets]);

  // Get bullets for the exactly selected date
  const selectedDateBullets = useMemo(() => {
    if (!monthlyBullets || !selectedDateStr) return [];
    return monthlyBullets
      .filter((b) => b.date === selectedDateStr)
      .filter((b) => !(b.type === "note" && !b.pageId?.startsWith("page_")))
      .sort((a, b) => {
        const timeA = a.time || "99:99";
        const timeB = b.time || "99:99";
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [monthlyBullets, selectedDateStr]);

  // Initialize page for this month (for BulletInput pageId binding)
  const [pageId, setPageId] = useState(null);
  useEffect(() => {
    const initMonthlyPage = async () => {
      let page = await db.pages
        .where("date")
        .equals(monthStr)
        .and((p) => p.type === "monthly")
        .first();
      if (!page) {
        const id = await db.pages.add({
          type: "monthly",
          date: monthStr,
          title: monthName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setPageId("page_" + id);
      } else {
        setPageId("page_" + page.id);
      }
    };
    initMonthlyPage();
  }, [monthStr, monthName]);

  // Initialize Future Log page for this month (Monthly Planning)
  const [futurePageId, setFuturePageId] = useState(null);
  useEffect(() => {
    const initFuturePage = async () => {
      let page = await db.pages
        .where("date")
        .equals(monthStr)
        .and((p) => p.type === "future")
        .first();
      if (!page) {
        const id = await db.pages.add({
          type: "future",
          date: monthStr,
          title: monthName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setFuturePageId("page_" + id);
      } else {
        setFuturePageId("page_" + page.id);
      }
    };
    initFuturePage();
  }, [monthStr, monthName]);

  const futureBullets = useLiveQuery(async () => {
    const allEvents = await db.bullets.where("type").equals("event").toArray();
    return allEvents
      .filter((b) => b.date && b.date.startsWith(monthStr))
      .sort((a, b) => {
        const dateA = a.date || "9999-99-99";
        const dateB = b.date || "9999-99-99";
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        const timeA = a.time || "99:99";
        const timeB = b.time || "99:99";
        if (timeA !== timeB) return timeA.localeCompare(timeB);

        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [monthStr]);

  const scrollRef = useRef(null);
  useEffect(() => {
    // On mobile, scroll the selected date into view roughly
    if (window.innerWidth < 768 && scrollRef.current && selectedDateStr) {
      const activeEl = scrollRef.current.querySelector(
        ".calendar-day-btn.active",
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedDateStr, calendarDays]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="monthly-log">
      <PageHeader title="Monthly" />

      <div className="calendar-navigation">
        <button onClick={prevMonth} className="nav-btn">
          <ChevronLeft size={24} />
        </button>
        <h2 className="month-title">{monthName}</h2>
        <button onClick={nextMonth} className="nav-btn">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="split-view">
        <div className="calendar-view">
          {/* Desktop Weekday Headers */}
          <div className="weekday-headers desktop-only">
            {weekDays.map((d) => (
              <div key={d} className="weekday">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-grid" ref={scrollRef}>
            {calendarDays.map((item, idx) => {
              if (!item)
                return (
                  <div
                    key={`empty-${idx}`}
                    className="calendar-day-empty desktop-only"
                  ></div>
                );

              const isToday = item.dateStr === getLocalISODate(today);
              const isActive = item.dateStr === selectedDateStr;
              const hasDots = dotsMap[item.dateStr];

              return (
                <button
                  key={item.dateStr}
                  className={`calendar-day-btn ${isActive ? "active" : ""} ${isToday ? "today" : ""}`}
                  onClick={() =>
                    setSelectedDateStr(isActive ? null : item.dateStr)
                  }
                >
                  <span className="day-name mobile-only">
                    {weekDays[idx % 7]}
                  </span>
                  <span className="day-number">{item.day}</span>
                  {hasDots && <div className="day-dot"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="task-view">
          {!selectedDateStr ? (
            <>
              <div className="task-view-header">
                <h3>Monthly Planning</h3>
              </div>
              <div className="bullets-container future">
                {futureBullets?.length === 0 && (
                  <p className="empty-state">No planning for this month.</p>
                )}
                {futureBullets?.map((b) => (
                  <BulletItem
                    key={b.id}
                    bullet={b}
                    compact={true}
                    searchResult={true}
                    shortDate={true}
                  />
                ))}
              </div>
              {futurePageId && (
                <BulletInput
                  pageId={futurePageId}
                  defaultDate={`${year}-${month}-01`}
                  defaultType="event"
                  defaultStatus="incomplete"
                />
              )}
            </>
          ) : (
            <>
              <div className="task-view-header">
                <h3>
                  {selectedDateStr === getLocalISODate(today)
                    ? "Tasks for Today"
                    : `${new Date(selectedDateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
                </h3>
              </div>

              <div className="bullets-container">
                {selectedDateBullets.length === 0 && (
                  <p className="empty-state">No tasks scheduled.</p>
                )}
                {selectedDateBullets.map((b) => (
                  <BulletItem key={b.id} bullet={b} />
                ))}
              </div>
              {pageId && (
                <BulletInput pageId={pageId} defaultDate={selectedDateStr} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
