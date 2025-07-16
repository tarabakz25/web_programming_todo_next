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

  return {
    tasks,
    addTask,
    toggleTask,
    updateTaskStatus
  };
}