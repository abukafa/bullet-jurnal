import React, { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useAppStore } from "../store";
import PageHeader from "../components/PageHeader";
import BulletItem from "../components/BulletItem";
import { ArrowLeft } from "lucide-react";
import "./OutstandingTasksView.css";

export default function OutstandingTasksView() {
  const { setActiveTab } = useAppStore();

  const allBullets = useLiveQuery(() => db.bullets.toArray(), []);

  const outstandingTasks = useMemo(() => {
    if (!allBullets) return [];

    return allBullets
      .filter(
        (b) =>
          b.status !== "complete" &&
          (b.type === "task" || b.type === "event") &&
          !(typeof b.pageId === "string" && b.pageId.startsWith("col_")),
      )
      .sort((a, b) => {
        // Sort by date first
        const dateA = a.date || "9999-99-99";
        const dateB = b.date || "9999-99-99";
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        // Then by creation time
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [allBullets]);

  return (
    <div className="outstanding-tasks-page">
      <PageHeader
        title="Outstanding"
        leftNode={
          <button className="back-btn" onClick={() => setActiveTab("index")}>
            <ArrowLeft size={20} />
            <span className="back-label desktop-only">Back</span>
          </button>
        }
      />

      <div className="bullets-container outstanding-list">
        {outstandingTasks?.length === 0 && (
          <p
            className="empty-state"
            style={{
              marginTop: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No outstanding tasks across all pages.
          </p>
        )}
        {outstandingTasks?.map((b) => (
          <BulletItem
            key={b.id}
            bullet={b}
            searchResult={true}
            fullDate={true}
          />
        ))}
      </div>
    </div>
  );
}
