"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconClock,
  IconCalendar,
  IconCode,
  IconTarget,
  IconBrain,
  IconTrophy,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

// インライン編集コンポーネント
function EditableCell({ 
  value, 
  onSave, 
  type = "text",
  options = [],
  className = ""
}: {
  value: string
  onSave: (newValue: string) => void
  type?: "text" | "select" | "date"
  options?: string[]
  className?: string
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue)
      toast.success("保存しました")
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // セレクトタイプの場合は直接ドロップダウンメニューを表示
  if (type === "select") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div 
            className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors ${className}`}
            role="button"
            tabIndex={0}
          >
            {value || "未設定"}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map((option) => (
            <DropdownMenuItem 
              key={option} 
              onClick={() => {
                if (option !== value) {
                  onSave(option)
                  toast.success("保存しました")
                }
              }}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (!isEditing) {
    const displayValue = type === "date" && value 
      ? (() => {
          try {
            const date = new Date(value)
            if (isNaN(date.getTime())) return "無効な日時"
            return format(date, "yyyy年MM月dd日(E) HH:mm", { locale: ja })
          } catch {
            return "無効な日時"
          }
        })()
      : value || "未設定"

    return (
      <div 
        className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        {displayValue}
      </div>
    )
  }

  if (type === "date") {
    return (
      <div className="w-full">
        <DateTimePicker 
          date={editValue ? new Date(editValue) : undefined}
          onDateChange={(date) => {
            const newValue = date ? date.toISOString() : ''
            setEditValue(newValue)
            if (newValue !== value) {
              onSave(newValue)
              toast.success("保存しました")
            }
            setIsEditing(false)
          }}
          placeholder="日時を選択"
          className="h-8"
        />
      </div>
    )
  }

  return (
    <Input
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="h-8 w-full"
      autoFocus
    />
  )
}

export const schema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  difficulty: z.string(),
  platform: z.string(),
  dueDate: z.string(),
  estimatedTime: z.string(),
  tags: z.array(z.string()),
  problemUrl: z.string(),
  completionDate: z.string().optional(),
  solutionNotes: z.string().optional(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}



function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

function AddTaskDialog({ onAddTask }: { onAddTask: (task: z.infer<typeof schema>) => void }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newTask = {
      id: Date.now(), // 簡易的なID生成
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      difficulty: formData.get("difficulty") as string,
      platform: formData.get("platform") as string,
      dueDate: formData.get("dueDate") as string,
      estimatedTime: "",
      tags: [],
      problemUrl: formData.get("problemUrl") as string,
      completionDate: formData.get("status") === "AC" ? new Date().toISOString() : undefined,
    }

    onAddTask(newTask)
    setOpen(false)
    toast.success("問題が追加されました")
  }

  const TaskForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="title">問題名 *</Label>
        <Input id="title" name="title" placeholder="問題名を入力してください" required />
      </div>
      
      <div className="flex flex-col gap-3">
        <Label htmlFor="problemUrl">問題URL</Label>
        <Input 
          id="problemUrl" 
          name="problemUrl" 
          type="url"
          placeholder="https://atcoder.jp/contests/abc123/tasks/abc123_a"
        />
      </div>
      
      <div className="flex flex-col gap-3">
        <Label htmlFor="description">解法メモ</Label>
        <Textarea 
          id="description" 
          name="description" 
          placeholder="アルゴリズムや解法のアイデアを記録"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="status">ステータス</Label>
          <Select name="status" defaultValue="未着手">
            <SelectTrigger id="status">
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="未着手">未着手</SelectItem>
              <SelectItem value="挑戦中">挑戦中</SelectItem>
              <SelectItem value="解答確認中">解答確認中</SelectItem>
              <SelectItem value="AC">AC</SelectItem>
              <SelectItem value="WA">WA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-3">
          <Label htmlFor="platform">プラットフォーム</Label>
          <Select name="platform" defaultValue="AtCoder">
            <SelectTrigger id="platform">
              <SelectValue placeholder="プラットフォームを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AtCoder">AtCoder</SelectItem>
              <SelectItem value="Codeforces">Codeforces</SelectItem>
              <SelectItem value="LeetCode">LeetCode</SelectItem>
              <SelectItem value="yukicoder">yukicoder</SelectItem>
              <SelectItem value="AOJ">AOJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="difficulty">難易度</Label>
          <Select name="difficulty">
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="難易度を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="★1">★1</SelectItem>
              <SelectItem value="★2">★2</SelectItem>
              <SelectItem value="★3">★3</SelectItem>
              <SelectItem value="★4">★4</SelectItem>
              <SelectItem value="★5">★5</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-3">
          <Label htmlFor="dueDate">目標日</Label>
          <Input 
            id="dueDate" 
            name="dueDate" 
            type="date"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          問題を追加
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setOpen(false)}
          className="flex-1"
        >
          キャンセル
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">問題を追加</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>新しい問題を追加</DrawerTitle>
            <DrawerDescription>
              競技プログラミングの問題を練習リストに追加してください
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <TaskForm />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconPlus />
          <span className="hidden lg:inline">問題を追加</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新しい問題を追加</DialogTitle>
          <DialogDescription>
            競技プログラミングの問題を練習リストに追加してください
          </DialogDescription>
        </DialogHeader>
        <TaskForm />
      </DialogContent>
    </Dialog>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [storedData, setStoredData] = useLocalStorage<z.infer<typeof schema>[]>('tasks', initialData)
  const [data, setData] = React.useState(() => storedData)
  
  // storedDataが変更されたときにdataを同期
  React.useEffect(() => {
    setData(storedData)
  }, [storedData])
  
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // ダイアログ管理のためのstate
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [taskToDelete, setTaskToDelete] = React.useState<number | null>(null)
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const handleAddTask = (newTask: z.infer<typeof schema>) => {
    setData((prevData) => {
      const newData = [...prevData, newTask]
      setStoredData(newData)
      return newData
    })
  }

  const handleUpdateTask = React.useCallback((id: number, updatedTask: Partial<z.infer<typeof schema>>) => {
    setData((prevData) => {
      const newData = prevData.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...updatedTask }
          
          // ステータスがACに変更された場合、完了日時を自動設定
          if (updatedTask.status === "AC" && task.status !== "AC") {
            updated.completionDate = new Date().toISOString()
          }
          // ステータスがAC以外に変更された場合、完了日時をクリア
          else if (updatedTask.status && updatedTask.status !== "AC") {
            updated.completionDate = undefined
          }
          
          return updated
        }
        return task
      })
      setStoredData(newData)
      return newData
    })
  }, [setStoredData])

  // タスク操作関数
  const handleEditTask = React.useCallback((task: z.infer<typeof schema>) => {
    // 簡易編集：タイトルのみ編集可能
    const newTitle = prompt('タスクのタイトルを編集してください', task.title)
    if (newTitle && newTitle !== task.title) {
      handleUpdateTask(task.id, { title: newTitle })
      toast.success('タスクを更新しました')
    }
  }, [handleUpdateTask])

  const handleDuplicateTask = React.useCallback((task: z.infer<typeof schema>) => {
    const newTask: z.infer<typeof schema> = {
      ...task,
      id: Date.now(),
      title: `${task.title} (コピー)`,
      status: '未着手',
      completionDate: undefined
    }
    setData((prevData) => {
      const newData = [...prevData, newTask]
      setStoredData(newData)
      return newData
    })
    toast.success('タスクを複製しました')
  }, [setStoredData])

  const handleDeleteTask = React.useCallback((id: number) => {
    setTaskToDelete(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDeleteTask = React.useCallback(() => {
    if (taskToDelete !== null) {
      setData((prevData) => {
        const newData = prevData.filter(task => task.id !== taskToDelete)
        setStoredData(newData)
        return newData
      })
      toast.success('タスクを削除しました')
      setIsDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }, [taskToDelete, setStoredData])

  const handleSolutionNotes = React.useCallback((task: z.infer<typeof schema>) => {
    const currentNotes = task.solutionNotes || ''
    const newNotes = prompt('解法メモを入力してください', currentNotes)
    if (newNotes !== null) {
      handleUpdateTask(task.id, { solutionNotes: newNotes })
      toast.success('解法メモを保存しました')
    }
  }, [handleUpdateTask])

  const columns: ColumnDef<z.infer<typeof schema>>[] = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "問題名",
        cell: ({ row }) => {
          return <TaskCellViewer item={row.original} onUpdateTask={handleUpdateTask} allTasks={data} />
        },
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "ステータス",
        cell: ({ row }) => {
          const statusColors = {
            "未着手": "bg-gray-100 text-gray-600",
            "挑戦中": "bg-blue-100 text-blue-600",
            "解答確認中": "bg-yellow-100 text-yellow-600",
            "AC": "bg-green-100 text-green-600",
            "WA": "bg-red-100 text-red-600",
          }
          

          
          return (
            <EditableCell
              value={row.original.status}
              onSave={(newValue) => handleUpdateTask(row.original.id, { status: newValue })}
              type="select"
              options={["未着手", "挑戦中", "解答確認中", "AC", "WA"]}
              className={`inline-flex items-center px-2 py-1 ${statusColors[row.original.status as keyof typeof statusColors] || "bg-gray-100 text-gray-600"}`}
            />
          )
        },
      },
      {
        accessorKey: "difficulty",
        header: "難易度",
        cell: ({ row }) => {
          const difficultyColors = {
            "Easy": "bg-green-100 text-green-600",
            "Medium": "bg-yellow-100 text-yellow-600",
            "Hard": "bg-red-100 text-red-600",
            "★1": "bg-gray-100 text-gray-600",
            "★2": "bg-blue-100 text-blue-600",
            "★3": "bg-yellow-100 text-yellow-600",
            "★4": "bg-orange-100 text-orange-600",
            "★5": "bg-red-100 text-red-600",
          }
          
          return (
            <Badge 
              variant="outline" 
              className={`px-2 py-1 ${difficultyColors[row.original.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-600"}`}
            >
              <IconBrain className="mr-1 size-3" />
              {row.original.difficulty}
            </Badge>
          )
        },
      },
      {
        accessorKey: "platform",
        header: "プラットフォーム",
        cell: ({ row }) => {
          const platformColors = {
            "AtCoder": "bg-orange-100 text-orange-600",
            "Codeforces": "bg-blue-100 text-blue-600",
            "LeetCode": "bg-yellow-100 text-yellow-600",
            "yukicoder": "bg-purple-100 text-purple-600",
            "AOJ": "bg-green-100 text-green-600",
          }
          
          return (
            <Badge 
              variant="outline" 
              className={`px-2 py-1 ${platformColors[row.original.platform as keyof typeof platformColors] || "bg-gray-100 text-gray-600"}`}
            >
              <IconCode className="mr-1 size-3" />
              {row.original.platform}
            </Badge>
          )
        },
      },
      {
        accessorKey: "dueDate",
        header: () => <div className="w-full text-center">目標日</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <IconCalendar className="size-4 text-muted-foreground" />
            <span className="text-sm">{row.original.dueDate}</span>
          </div>
        ),
      },

      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">メニューを開く</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => handleEditTask(row.original)}>編集</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateTask(row.original)}>複製</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSolutionNotes(row.original)}>解法メモ</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTask(row.original.id)}>削除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleUpdateTask]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        const newData = arrayMove(data, oldIndex, newIndex)
        setStoredData(newData)
        return newData
      })
    }
  }

  return (
    <>
    <Tabs
      defaultValue="problems"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          表示
        </Label>
        <Select defaultValue="problems">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="表示を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="problems">問題一覧</SelectItem>
            <SelectItem value="progress">進捗状況</SelectItem>
            <SelectItem value="contests">コンテスト</SelectItem>
            <SelectItem value="calendar">学習予定</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="problems">問題一覧</TabsTrigger>
          <TabsTrigger value="progress">
            進捗状況 <Badge variant="secondary">{data.filter(task => task.status === "挑戦中").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contests">
            コンテスト <Badge variant="secondary">{data.filter(task => task.status === "AC").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="calendar">学習予定</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">列をカスタマイズ</span>
                <span className="lg:hidden">列</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddTaskDialog onAddTask={handleAddTask} />
        </div>
      </div>
      <TabsContent
        value="problems"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      問題がありません。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} / {" "}
            {table.getFilteredRowModel().rows.length} 件選択中
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                表示件数
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {" "}
              {table.getPageCount()} ページ
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">最初のページへ</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">前のページへ</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">次のページへ</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">最後のページへ</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="progress"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.filter(task => task.status === "AC").length}</div>
              <div className="text-sm text-muted-foreground">AC済み</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.filter(task => task.status === "挑戦中").length}</div>
              <div className="text-sm text-muted-foreground">挑戦中</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.filter(task => task.status === "解答確認中").length}</div>
              <div className="text-sm text-muted-foreground">解答確認中</div>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{data.filter(task => task.status === "未着手").length}</div>
              <div className="text-sm text-muted-foreground">未着手</div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">過去6ヶ月の進捗</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart
                accessibilityLayer
                data={generateChartData(data)}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="inProgress"
                  type="natural"
                  fill="var(--color-inProgress)"
                  fillOpacity={0.6}
                  stroke="var(--color-inProgress)"
                  stackId="a"
                />
                <Area
                  dataKey="completed"
                  type="natural"
                  fill="var(--color-completed)"
                  fillOpacity={0.4}
                  stroke="var(--color-completed)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="contests" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          コンテスト情報がここに表示されます
        </div>
      </TabsContent>
      <TabsContent
        value="calendar"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          学習スケジュールがここに表示されます
        </div>
      </TabsContent>
    </Tabs>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>タスクを削除</DialogTitle>
          <DialogDescription>
            このタスクを削除してもよろしいですか？この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-4">
          <Button variant="destructive" onClick={confirmDeleteTask}>
            削除
          </Button>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

// チャートデータをタスクデータから動的に生成する関数
const generateChartData = (tasks: z.infer<typeof schema>[]) => {
  // 過去6ヶ月のデータを生成
  const months = []
  const today = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthName = targetMonth.toLocaleDateString('ja-JP', { month: 'long' })
    
    // その月に完了したタスク数をカウント
    const completedInMonth = tasks.filter(task => {
      if (task.status === "AC" && task.completionDate) {
        const completionDate = new Date(task.completionDate)
        return completionDate.getFullYear() === targetMonth.getFullYear() &&
               completionDate.getMonth() === targetMonth.getMonth()
      }
      return false
    }).length
    
    // その月に挑戦中のタスク数をカウント（現在月のみ）
    const inProgressInMonth = i === 0 ? tasks.filter(task => task.status === "挑戦中").length : 0
    
    months.push({
      month: monthName,
      completed: completedInMonth,
      inProgress: inProgressInMonth
    })
  }
  
  return months
}

const chartConfig = {
  completed: {
    label: "AC",
    color: "var(--primary)",
  },
  inProgress: {
    label: "挑戦中",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TaskCellViewer({ item, onUpdateTask, allTasks }: { 
  item: z.infer<typeof schema>
  onUpdateTask: (id: number, updatedTask: Partial<z.infer<typeof schema>>) => void 
  allTasks: z.infer<typeof schema>[]
}) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState(item)
  
  // 動的にチャートデータを生成
  const chartData = React.useMemo(() => generateChartData(allTasks), [allTasks])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onUpdateTask(item.id, formData)
    setIsOpen(false)
    toast.success("タスクを更新しました")
  }

  const handleInputChange = (field: keyof z.infer<typeof schema>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.title}</DrawerTitle>
          <DrawerDescription>
            問題の詳細情報と解法メモ
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="inProgress"
                    type="natural"
                    fill="var(--color-inProgress)"
                    fillOpacity={0.6}
                    stroke="var(--color-inProgress)"
                    stackId="a"
                  />
                  <Area
                    dataKey="completed"
                    type="natural"
                    fill="var(--color-completed)"
                    fillOpacity={0.4}
                    stroke="var(--color-completed)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  今月は{chartData[chartData.length - 1]?.completed || 0}問のAC達成{" "}
                  <IconTrophy className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  過去6ヶ月の問題解答状況を表示しています。継続的な学習で実力向上を目指しましょう。
                  解法パターンの習得と反復練習が重要です。
                </div>
              </div>
              <Separator />
            </>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="title">問題名</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <Label htmlFor="problemUrl">問題URL</Label>
              <Input 
                id="problemUrl" 
                value={formData.problemUrl}
                onChange={(e) => handleInputChange('problemUrl', e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">解法メモ</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未着手">未着手</SelectItem>
                    <SelectItem value="挑戦中">挑戦中</SelectItem>
                    <SelectItem value="解答確認中">解答確認中</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="WA">WA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="platform">プラットフォーム</Label>
                <Select 
                  value={formData.platform}
                  onValueChange={(value) => handleInputChange('platform', value)}
                >
                  <SelectTrigger id="platform" className="w-full">
                    <SelectValue placeholder="プラットフォームを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AtCoder">AtCoder</SelectItem>
                    <SelectItem value="Codeforces">Codeforces</SelectItem>
                    <SelectItem value="LeetCode">LeetCode</SelectItem>
                    <SelectItem value="yukicoder">yukicoder</SelectItem>
                    <SelectItem value="AOJ">AOJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="difficulty">難易度</Label>
                <Select 
                  value={formData.difficulty}
                  onValueChange={(value) => handleInputChange('difficulty', value)}
                >
                  <SelectTrigger id="difficulty" className="w-full">
                    <SelectValue placeholder="難易度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="★1">★1</SelectItem>
                    <SelectItem value="★2">★2</SelectItem>
                    <SelectItem value="★3">★3</SelectItem>
                    <SelectItem value="★4">★4</SelectItem>
                    <SelectItem value="★5">★5</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="dueDate">目標日時</Label>
                <DateTimePicker 
                  date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                  onDateChange={(date) => handleInputChange('dueDate', date ? date.toISOString() : '')}
                  placeholder="目標日時を選択"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                保存
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
