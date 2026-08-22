export type CategoryColor = "purple" | "teal";
export type TaskKind = "task" | "video" | "blog" | "research" | "problem" | "project";
export type Priority = "high" | "medium" | "low";

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  position: number;
}

export interface Task {
  id: string;
  category_id: string;
  parent_id: string | null;
  title: string;
  kind: TaskKind;
  url: string;
  notes: string;
  priority: Priority;
  due_at: string | null;
  completed: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  position: number;
}

export interface Reminder {
  id: string;
  task_id: string;
  enabled: number;
  mode: string;
  remind_at: string | null;
  interval_minutes: number | null;
  weekdays: string;
  last_sent_at: string | null;
}

export interface AppState {
  categories: Category[];
  tasks: Task[];
  reminders: Reminder[];
}

export interface TaskDraft {
  title: string;
  category_id: string;
  parent_id: string | null;
  kind: TaskKind;
  priority: Priority;
  due_at: string | null;
  url: string;
  notes: string;
}