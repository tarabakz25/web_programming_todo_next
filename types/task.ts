export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  difficulty?: number;
  platform: "atcoder" | "codeforces" | "leetcode" | "other";
  status: Status;
  tags?: string[];
  due?: string;
  url?: string;
}

export interface Category {
  id: string;
  title: string;
}