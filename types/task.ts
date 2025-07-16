export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string; // "未着手" | "挑戦中" | "解答確認中" | "AC" | "WA"
  difficulty: string; // "★1" | "★2" | "★3" | "★4" | "★5" | "Easy" | "Medium" | "Hard"
  platform: string; // "AtCoder" | "Codeforces" | "LeetCode" | "yukicoder" | "AOJ"
  dueDate: string;
  estimatedTime: string;
  tags: string[];
  problemUrl: string;
  completionDate?: string; // タスク完了日時を追跡
}

export interface Category {
  id: string;
  title: string;
}