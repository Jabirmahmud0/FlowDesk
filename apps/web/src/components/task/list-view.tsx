'use client';

import { useState, useMemo } from 'react';
import type { InferSelectModel } from 'drizzle-orm';
import { tasks, projects } from '@flowdesk/db';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    MoreHorizontal,
    ChevronUp,
    ChevronDown,
    GripVertical,
    User,
    Calendar,
    Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Task = InferSelectModel<typeof tasks>;
type Project = InferSelectModel<typeof projects>;

interface TaskWithRelations extends Task {
    assignee?: { name: string; avatarUrl?: string | null } | null;
    project: Project;
    labels?: { label: { name: string; color: string } }[];
}

interface TaskListViewProps {
    tasks: TaskWithRelations[];
    onSelectionChange?: (selectedTaskIds: string[]) => void;
    onTaskUpdate?: (task: TaskWithRelations) => void;
    orgId: string;
    projectId?: string;
}

const columnHelper = createColumnHelper<TaskWithRelations>();

export function TaskListView({
    tasks,
    onSelectionChange,
    onTaskUpdate,
    orgId,
    projectId,
}: TaskListViewProps) {
    const router = useRouter();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && 'indeterminate')
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            }),
            columnHelper.display({
                id: 'drag',
                header: () => <GripVertical className="h-4 w-4 text-muted-foreground" />,
                cell: () => <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />,
                enableSorting: false,
            }),
            columnHelper.accessor('title', {
                header: 'Task',
                cell: ({ row }) => (
                    <div className="font-medium cursor-pointer hover:text-primary" onClick={() => router.push(`/${orgId}/tasks/${row.original.id}`)}>
                        {row.getValue('title')}
                    </div>
                ),
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ getValue }) => {
                    const status = getValue() as string;
                    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
                        TODO: 'secondary',
                        IN_PROGRESS: 'default',
                        IN_REVIEW: 'outline',
                        DONE: 'default',
                    };
                    const colors: Record<string, string> = {
                        TODO: 'bg-secondary',
                        IN_PROGRESS: 'bg-blue-500',
                        IN_REVIEW: 'bg-yellow-500',
                        DONE: 'bg-green-500',
                    };
                    return (
                        <Badge className={cn('text-white', colors[status] || 'bg-gray-500')}>
                            {status.replace(/_/g, ' ')}
                        </Badge>
                    );
                },
                filterFn: 'equals',
            }),
            columnHelper.accessor('priority', {
                header: 'Priority',
                cell: ({ getValue }) => {
                    const priority = getValue() as string;
                    const colors: Record<string, string> = {
                        URGENT: 'text-red-500',
                        HIGH: 'text-orange-500',
                        MEDIUM: 'text-yellow-500',
                        LOW: 'text-blue-500',
                        NONE: 'text-muted-foreground',
                    };
                    return (
                        <div className="flex items-center gap-1">
                            <Flag className={cn('h-3 w-3', colors[priority] || 'text-muted-foreground')} />
                            <span className="text-sm capitalize">{priority.toLowerCase()}</span>
                        </div>
                    );
                },
            }),
            columnHelper.accessor('assignee', {
                header: 'Assignee',
                cell: ({ getValue }) => {
                    const assignee = getValue();
                    if (!assignee) {
                        return (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="text-sm">Unassigned</span>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {assignee.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{assignee.name}</span>
                        </div>
                    );
                },
            }),
            columnHelper.accessor('dueDate', {
                header: 'Due Date',
                cell: ({ getValue }) => {
                    const dueDate = getValue() as Date | null;
                    if (!dueDate) return <span className="text-muted-foreground">-</span>;
                    
                    const isOverdue = new Date(dueDate) < new Date();
                    return (
                        <div className={cn('flex items-center gap-2 text-sm', isOverdue && 'text-red-500 font-medium')}>
                            <Calendar className="h-4 w-4" />
                            {format(new Date(dueDate), 'MMM d, yyyy')}
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/${orgId}/tasks/${row.original.id}`)}>
                                Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onTaskUpdate?.(row.original)}>
                                Edit
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            }),
        ],
        [orgId, router, onTaskUpdate]
    );

    const table = useReactTable({
        data: tasks,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        enableMultiRowSelection: true,
    });

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search tasks..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-64"
                    />
                    <Select
                        value={(columnFilters.find((f) => f.id === 'status')?.value as string) || ''}
                        onValueChange={(value) =>
                            setColumnFilters((prev) =>
                                value ? [{ id: 'status', value }] : prev.filter((f) => f.id !== 'status')
                            )
                        }
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} task(s) selected
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <table className="w-full">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b bg-muted/50">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={cn(
                                                    'flex items-center gap-2 cursor-pointer select-none',
                                                    !header.column.getCanSort() && 'cursor-default'
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {{
                                                    asc: <ChevronUp className="h-4 w-4" />,
                                                    desc: <ChevronDown className="h-4 w-4" />,
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        'border-b transition-colors hover:bg-muted/50',
                                        row.getIsSelected() && 'bg-muted'
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-4 align-middle">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-24 text-center">
                                    No tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
