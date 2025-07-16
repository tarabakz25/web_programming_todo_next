import { DataTable } from "@/components/TaskTable";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="font-geist">
      <Header />
      <div className="flex  flex-col gap-4 p-4 w-full">
        <DataTable data={[]} />
      </div>
    </div>
  )
}