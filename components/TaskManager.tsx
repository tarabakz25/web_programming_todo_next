import type { Task } from "@/types/task";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function TaskManager() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);

  function addTask(task: Task) {
    setTasks([...tasks, task]);
  }

  function toggleTask(id: number) {
    setTasks(tasks.map(task => 
      task.id === id 
      ? {
        ...task,
        status: task.status === 'done'
        ? 'todo'
        : task.status === 'todo'
          ? 'in-progress'
          : 'done'
      }
      : task
    ))
  }

  function updateTaskStatus(id: number, newStatus: string) {
    setTasks(tasks.map(task => 
      task.id === id 
      ? {
        ...task,
        status: newStatus,
        // ACステータスに変更された場合、completionDateを設定
        completionDate: newStatus === 'AC' ? new Date().toISOString() : task.completionDate
      }
      : task
    ))
  }

  function updateTask(id: number, updatedTask: Partial<Task>) {
    setTasks(tasks.map(task => 
      task.id === id 
      ? { ...task, ...updatedTask }
      : task
    ))
  }

  function duplicateTask(id: number) {
    const taskToDuplicate = tasks.find(task => task.id === id);
    if (taskToDuplicate) {
      const newTask: Task = {
        ...taskToDuplicate,
        id: Date.now(), // 新しいIDを生成
        title: `${taskToDuplicate.title} (コピー)`,
        status: '未着手', // 複製されたタスクは未着手状態
        completionDate: undefined // 完了日時はリセット
      };
      setTasks([...tasks, newTask]);
    }
  }

  function deleteTask(id: number) {
    setTasks(tasks.filter(task => task.id !== id));
  }

  function updateSolutionNotes(id: number, notes: string) {
    setTasks(tasks.map(task => 
      task.id === id 
      ? { ...task, solutionNotes: notes }
      : task
    ))
  }

  return {
    tasks,
    addTask,
    toggleTask,
    updateTaskStatus,
    updateTask,
    duplicateTask,
    deleteTask,
    updateSolutionNotes
  };
}