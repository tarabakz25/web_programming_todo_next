import type { Task } from "@/types/task";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function TaskManager() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);

  function addTask(task: Task) {
    setTasks([...tasks, task]);
  }

  function toggleTask(id: string) {
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
}