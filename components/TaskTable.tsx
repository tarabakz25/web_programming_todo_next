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
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconClock,
  IconCalendar,
  IconCode,
  IconTarget,
  IconBrain,
  IconTrophy,
  IconTrash,
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
            className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-2 sm:py-1 transition-colors touch-manipulation min-h-[44px] sm:min-h-[32px] flex items-center ${className}`}
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
            if (isNaN(date.getTime())) return "無効な日付"
            // YYYY-MM-DD形式で表示
            return date.toISOString().split('T')[0]
          } catch {
            return "無効な日付"
          }
        })()
      : value || "未設定"

    return (
      <div 
        className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-2 sm:py-1 transition-colors touch-manipulation min-h-[44px] sm:min-h-[32px] flex items-center ${className}`}
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
      className="text-muted-foreground h-8 w-8 touch-manipulation hover:bg-transparent active:bg-muted/50"
    >
      <IconGripVertical className="text-muted-foreground h-4 w-4" />
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
  
  // フォームの全フィールドをReact stateで管理
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    status: "未着手",
    difficulty: "",
    platform: "AtCoder",
    dueDate: "",
    problemUrl: "",
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const newTask = {
      id: Date.now(), // 簡易的なID生成
      title: formData.title,
      description: formData.description,
      status: formData.status,
      difficulty: formData.difficulty,
      platform: formData.platform,
      dueDate: formData.dueDate,
      estimatedTime: "",
      tags: [],
      problemUrl: formData.problemUrl,
      completionDate: formData.status === "AC" ? new Date().toISOString() : undefined,
    }

    onAddTask(newTask)
    
    // フォーム状態を完全にリセット
    setFormData({
      title: "",
      description: "",
      status: "未着手",
      difficulty: "",
      platform: "AtCoder",
      dueDate: "",
      problemUrl: "",
    })
    setOpen(false)
    
    toast.success("問題が追加されました")
  }

  // ダイアログの開閉状態変更時の処理
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // ダイアログが閉じられた時にフォームをリセット
      setFormData({
        title: "",
        description: "",
        status: "未着手",
        difficulty: "",
        platform: "AtCoder",
        dueDate: "",
        problemUrl: "",
      })
    }
  }

  // フィールド更新用のヘルパー関数
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const TaskForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="title">問題名 *</Label>
        <Input 
          id="title" 
          name="title" 
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="問題名を入力してください" 
          required 
        />
      </div>
      
      <div className="flex flex-col gap-3">
        <Label htmlFor="problemUrl">問題URL</Label>
        <Input 
          id="problemUrl" 
          name="problemUrl" 
          type="url"
          value={formData.problemUrl}
          onChange={(e) => updateField('problemUrl', e.target.value)}
          placeholder="https://atcoder.jp/contests/abc123/tasks/abc123_a"
        />
      </div>
      
      <div className="flex flex-col gap-3">
        <Label htmlFor="description">解法メモ</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="アルゴリズムや解法のアイデアを記録"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="status">ステータス</Label>
          <Select 
            name="status" 
            value={formData.status}
            onValueChange={(value) => updateField('status', value)}
          >
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
          <Select 
            name="platform" 
            value={formData.platform}
            onValueChange={(value) => updateField('platform', value)}
          >
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="difficulty">難易度</Label>
          <Select 
            name="difficulty"
            value={formData.difficulty}
            onValueChange={(value) => updateField('difficulty', value)}
          >
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
          <DateTimePicker 
            date={formData.dueDate ? new Date(formData.dueDate) : undefined}
            onDateChange={(date) => updateField('dueDate', date ? date.toISOString() : '')}
            placeholder="目標日を選択"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button type="submit" className="flex-1 h-10 sm:h-9">
          問題を追加
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleOpenChange(false)}
          className="flex-1 h-10 sm:h-9"
        >
          キャンセル
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="flex-shrink-0 h-10 px-4 touch-manipulation">
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">問題を追加</span>
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-shrink-0 h-9 px-3 touch-manipulation">
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">問題を追加</span>
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
              onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
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
          return <TaskCellViewer item={row.original} onUpdateTask={handleUpdateTask} allTasks={data} onDeleteTask={handleDeleteTask} />
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
        cell: ({ row }) => {
          const formatDate = (dateString: string) => {
            if (!dateString) return "未設定"
            try {
              const date = new Date(dateString)
              if (isNaN(date.getTime())) return "無効な日付"
              // YYYY-MM-DD形式で表示
              return date.toISOString().split('T')[0]
            } catch {
              return "無効な日付"
            }
          }
          
          return (
            <div className="flex items-center justify-center gap-2">
              <IconCalendar className="size-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(row.original.dueDate)}</span>
            </div>
          )
        },
      },

      {
        id: "actions",
        cell: ({ row }) => (
          <TaskCellViewer item={row.original} onUpdateTask={handleUpdateTask} allTasks={data} onDeleteTask={handleDeleteTask}>
            <Button
              variant="ghost"
              className="text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">詳細を表示</span>
            </Button>
          </TaskCellViewer>
        ),
      },
    ],
    [handleUpdateTask, data, handleDeleteTask]
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
      className="w-full flex-col justify-start gap-3 sm:gap-4 lg:gap-6"
    >
      <div className="flex flex-col gap-3 px-3 sm:px-4 lg:px-6 sm:flex-row sm:items-center sm:justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          表示
        </Label>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden w-full sm:w-auto **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 md:flex">
          <TabsTrigger value="problems" className="text-xs sm:text-sm">問題一覧</TabsTrigger>
          <TabsTrigger value="contests" className="text-xs sm:text-sm">
            コンテスト <Badge variant="secondary" className="ml-1 text-xs">{data.filter(task => task.status === "AC").length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        {/* モバイル用のタブセレクト */}
        <div className="flex md:hidden w-full">
          <Select value="problems">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="表示を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="problems">問題一覧</SelectItem>
              <SelectItem value="contests">コンテスト</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0 hidden lg:flex">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">列をカスタマイズ</span>
                <IconChevronDown className="h-4 w-4 ml-1" />
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
        className="relative flex flex-col gap-4 overflow-auto px-2 sm:px-4 lg:px-6"
      >
        {/* モバイル表示: カード形式 */}
        <div className="block lg:hidden">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <MobileTaskCard key={row.id} row={row} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} allTasks={data} />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-12 text-center text-muted-foreground">
                    問題がありません。
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* デスクトップ表示: テーブル形式 */}
        <div className="hidden lg:block overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table className="min-w-full">
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan} className="whitespace-nowrap">
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
        </div>
        <div className="flex flex-col gap-3 px-3 sm:px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground hidden flex-1 text-xs sm:text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} / {" "}
            {table.getFilteredRowModel().rows.length} 件選択中
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-xs sm:text-sm font-medium whitespace-nowrap">
                表示件数
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-16 sm:w-20" id="rows-per-page">
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
            <div className="flex items-center justify-center text-xs sm:text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {" "}
              {table.getPageCount()} ページ
            </div>
            <div className="flex items-center gap-1 sm:gap-2 justify-center">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">最初のページへ</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">前のページへ</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">次のページへ</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">最後のページへ</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="contests" className="flex flex-col px-3 sm:px-4 lg:px-6">
        <ContestCalendar />
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

// AtCoder Beginner Contest のダミーデータ
const generateABCContests = () => {
  const contests = []
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1) // 先月から
  
  for (let i = 0; i < 8; i++) {
    const contestDate = new Date(startDate)
    contestDate.setDate(startDate.getDate() + (i * 7)) // 週1回
    contestDate.setHours(21, 0, 0, 0) // 21:00開始
    
    const contestNumber = 380 + i
    const endDate = new Date(contestDate)
    endDate.setHours(22, 40, 0, 0) // 100分間
    
    contests.push({
      id: `abc${contestNumber}`,
      title: `AtCoder Beginner Contest ${contestNumber}`,
      startTime: contestDate,
      endTime: endDate,
      platform: 'AtCoder',
      difficulty: 'Beginner',
      url: `https://atcoder.jp/contests/abc${contestNumber}`,
      status: contestDate < today ? 'finished' : 'upcoming',
      participants: Math.floor(Math.random() * 3000) + 8000, // 8000-11000人
    })
  }
  
  return contests
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

function MobileTaskCard({ row, onUpdateTask, onDeleteTask, allTasks }: {
  row: Row<z.infer<typeof schema>>
  onUpdateTask: (id: number, updatedTask: Partial<z.infer<typeof schema>>) => void
  onDeleteTask: (id: number) => void
  allTasks: z.infer<typeof schema>[]
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  const item = row.original

  const statusColors = {
    "未着手": "bg-gray-100 text-gray-600",
    "挑戦中": "bg-blue-100 text-blue-600", 
    "解答確認中": "bg-yellow-100 text-yellow-600",
    "AC": "bg-green-100 text-green-600",
    "WA": "bg-red-100 text-red-600",
  }

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

  const platformColors = {
    "AtCoder": "bg-orange-100 text-orange-600",
    "Codeforces": "bg-blue-100 text-blue-600",
    "LeetCode": "bg-yellow-100 text-yellow-600",
    "yukicoder": "bg-purple-100 text-purple-600",
    "AOJ": "bg-green-100 text-green-600",
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "未設定"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "無効な日付"
      return date.toISOString().split('T')[0]
    } catch {
      return "無効な日付"
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-card rounded-lg border p-4 space-y-3 transition-all duration-200 ${
        isDragging ? 'opacity-70 shadow-lg scale-105' : 'hover:shadow-md'
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {/* ヘッダー部分 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <TaskCellViewer 
            item={item} 
            onUpdateTask={onUpdateTask} 
            allTasks={allTasks} 
            onDeleteTask={onDeleteTask}
          >
            <h3 className="font-medium text-base leading-tight text-foreground hover:text-primary cursor-pointer transition-colors truncate">
              {item.title}
            </h3>
          </TaskCellViewer>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DragHandle id={item.id} />
          <TaskCellViewer 
            item={item} 
            onUpdateTask={onUpdateTask} 
            allTasks={allTasks} 
            onDeleteTask={onDeleteTask}
          >
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </TaskCellViewer>
        </div>
      </div>

      {/* ステータスと難易度 */}
      <div className="flex flex-wrap items-center gap-2">
        <EditableCell
          value={item.status}
          onSave={(newValue) => onUpdateTask(item.id, { status: newValue })}
          type="select"
          options={["未着手", "挑戦中", "解答確認中", "AC", "WA"]}
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[item.status as keyof typeof statusColors] || "bg-gray-100 text-gray-600"
          }`}
        />
        <Badge 
          variant="outline" 
          className={`px-2 py-1 text-xs ${
            difficultyColors[item.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-600"
          }`}
        >
          <IconBrain className="mr-1 h-3 w-3" />
          {item.difficulty}
        </Badge>
        <Badge 
          variant="outline" 
          className={`px-2 py-1 text-xs ${
            platformColors[item.platform as keyof typeof platformColors] || "bg-gray-100 text-gray-600"
          }`}
        >
          <IconCode className="mr-1 h-3 w-3" />
          {item.platform}
        </Badge>
      </div>

      {/* 説明文 */}
      {item.description && (
        <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {item.description}
        </p>
      )}

      {/* 目標日 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconCalendar className="h-4 w-4" />
        <span>{formatDate(item.dueDate)}</span>
      </div>

      {/* 問題URL */}
      {item.problemUrl && (
        <div className="pt-2 border-t">
          <a 
            href={item.problemUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <IconTarget className="h-3 w-3" />
            問題を開く
          </a>
        </div>
      )}
    </div>
  )
}

function ContestCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [contests] = React.useState(generateABCContests())
  const [viewMode, setViewMode] = React.useState<'calendar' | 'list'>('calendar')
  const [selectedContest, setSelectedContest] = React.useState<{
    id: string
    title: string
    startTime: Date
    endTime: Date
    platform: string
    difficulty: string
    url: string
    status: string
    participants: number
  } | null>(null)
  const isMobile = useIsMobile()
  
  // カレンダーの表示月を取得
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // 月の最初と最後の日付を取得
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  
  // カレンダーのグリッドを生成
  const calendarDays = []
  
  // 前月の末尾日付
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(firstDay)
    day.setDate(day.getDate() - i - 1)
    calendarDays.push({ date: day, isCurrentMonth: false })
  }
  
  // 当月の日付
  for (let day = 1; day <= lastDay.getDate(); day++) {
    calendarDays.push({ date: new Date(year, month, day), isCurrentMonth: true })
  }
  
  // 次月の最初の日付（6週間表示のため）
  const remainingDays = 42 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
  }
  
  // 指定日のコンテストを取得
  const getContestsForDate = (date: Date) => {
    return contests.filter(contest => {
      const contestDate = new Date(contest.startTime)
      return contestDate.toDateString() === date.toDateString()
    })
  }
  
  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }
  
  const today = new Date()
  
  // モバイル用リスト表示
  const renderMobileList = () => {
    const sortedContests = contests
      .filter(contest => {
        const contestDate = new Date(contest.startTime)
        return contestDate.getMonth() === month && contestDate.getFullYear() === year
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    
    return (
      <div className="space-y-3">
        {sortedContests.map((contest) => (
          <div key={contest.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium text-base">{contest.title}</h5>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    {contest.startTime.toLocaleDateString('ja-JP', { 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconClock className="h-4 w-4" />
                    {contest.startTime.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {contest.endTime.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    contest.status === 'finished' ? 'bg-gray-50 text-gray-600' : 'bg-orange-50 text-orange-600'
                  }`}
                >
                  {contest.status === 'finished' ? '終了' : '開催予定'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => window.open(contest.url, '_blank')}
                >
                  詳細
                </Button>
              </div>
            </div>
          </div>
        ))}
        {sortedContests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconTrophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>今月はコンテストがありません</p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* カレンダーヘッダー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg sm:text-xl font-semibold">
          {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
        </h3>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* 表示モード切替（モバイルのみ） */}
          {isMobile && (
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="text-xs px-2 rounded-r-none"
              >
                カレンダー
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs px-2 rounded-l-none"
              >
                リスト
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="hidden sm:flex text-xs px-3"
            >
              今月
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth('next')}
              className="h-8 w-8 p-0"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* カレンダー表示またはリスト表示 */}
      {isMobile && viewMode === 'list' ? (
        renderMobileList()
      ) : (
        <>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div 
                key={day} 
                className={`text-center text-xs sm:text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((calendarDay, index) => {
              const dayContests = getContestsForDate(calendarDay.date)
              const isToday = calendarDay.date.toDateString() === today.toDateString()
              const dayOfWeek = calendarDay.date.getDay()
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border rounded-md transition-colors
                    ${calendarDay.isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${dayContests.length > 0 ? 'hover:bg-muted/50 cursor-pointer' : ''}
                  `}
                >
                  <div className={`
                    text-xs sm:text-sm font-medium mb-1
                    ${!calendarDay.isCurrentMonth ? 'text-muted-foreground' : 
                      dayOfWeek === 0 ? 'text-red-500' : 
                      dayOfWeek === 6 ? 'text-blue-500' : 'text-foreground'}
                    ${isToday ? 'font-bold' : ''}
                  `}>
                    {calendarDay.date.getDate()}
                  </div>
                  
                  {/* コンテスト表示 */}
                  <div className="space-y-1">
                    {dayContests.slice(0, 2).map((contest) => (
                      <div
                        key={contest.id}
                        className={`
                          text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity
                          ${contest.status === 'finished' ? 'bg-gray-500' : 'bg-orange-500'}
                        `}
                        title={contest.title}
                        onClick={() => setSelectedContest(contest)}
                      >
                        <div className="font-medium">ABC {contest.id.replace('abc', '')}</div>
                        <div className="text-[10px] opacity-90">
                          {contest.startTime.toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ))}
                    {dayContests.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayContests.length - 2}件
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      
      {/* 今後のコンテスト一覧（リスト表示以外） */}
      {(!isMobile || viewMode === 'calendar') && (
        <div className="mt-6">
          <h4 className="text-base sm:text-lg font-medium mb-3">今後のコンテスト</h4>
          <div className="space-y-2">
            {contests
              .filter(contest => contest.status === 'upcoming')
              .slice(0, 3)
              .map((contest) => (
                <div key={contest.id} className="bg-card border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm sm:text-base">{contest.title}</h5>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3" />
                          {contest.startTime.toLocaleDateString('ja-JP')}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          {contest.startTime.toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - {contest.endTime.toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-600 bg-orange-50">
                        {contest.platform}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(contest.url, '_blank')}
                      >
                        参加
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* コンテスト詳細ダイアログ */}
      <Dialog open={!!selectedContest} onOpenChange={() => setSelectedContest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedContest?.title}</DialogTitle>
            <DialogDescription>
              AtCoder Beginner Contest の詳細情報
            </DialogDescription>
          </DialogHeader>
          {selectedContest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">開催日</span>
                  <p className="font-medium">
                    {selectedContest.startTime.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">時間</span>
                  <p className="font-medium">
                    {selectedContest.startTime.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {selectedContest.endTime.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">難易度</span>
                  <p className="font-medium">{selectedContest.difficulty}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">予想参加者</span>
                  <p className="font-medium">{selectedContest.participants?.toLocaleString()}人</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => window.open(selectedContest.url, '_blank')}
                  className="w-full"
                >
                  <IconTarget className="mr-2 h-4 w-4" />
                  コンテストページを開く
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedContest(null)}
                  className="w-full"
                >
                  閉じる
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskCellViewer({ item, onUpdateTask, allTasks, children, onDeleteTask }: { 
  item: z.infer<typeof schema>
  onUpdateTask: (id: number, updatedTask: Partial<z.infer<typeof schema>>) => void 
  allTasks: z.infer<typeof schema>[]
  children?: React.ReactNode
  onDeleteTask?: (id: number) => void
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

  const handleDelete = () => {
    if (onDeleteTask) {
      onDeleteTask(item.id)
      setIsOpen(false)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children ? children : (
          <Button variant="link" className="text-foreground w-fit px-0 text-left">
            {item.title}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-w-2xl mx-auto">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" className="flex-1 h-10 sm:h-9">
                保存
              </Button>
              {onDeleteTask && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1 h-10 sm:h-9"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  削除
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1 h-10 sm:h-9"
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
