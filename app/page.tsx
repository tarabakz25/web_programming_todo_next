"use client"

import { DataTable } from "@/components/TaskTable";
import { Header } from "@/components/Header";
import ChartArea from "@/components/ChartArea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Task } from "@/types/task";

export default function Home() {
  const [tasks] = useLocalStorage<Task[]>("tasks", []);

  return (
    <div>
      <Header />
      <div className="flex flex-col gap-4 p-4 w-full">
        <DataTable data={tasks} />
        <ChartArea tasks={tasks} />
      </div>
    </div>
  )
}