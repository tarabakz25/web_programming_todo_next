import { DataTable } from "@/components/TaskTable";

export default function Home() {
  return (
    <div className="flex w-full h-screen py-4">
      <DataTable data={[]} />
    </div>
  )
}