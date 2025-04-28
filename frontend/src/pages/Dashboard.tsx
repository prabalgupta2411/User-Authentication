import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { 
  Check, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  CircleDot, 
  Circle, 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  Heart, 
  MoreVertical, 
  Search, 
  Star, 
  Tag, 
  Trash2, 
  User2,
  ArrowDown,
  ArrowUp,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Status and priorities options
const STATUS_OPTIONS = [
  { label: "Backlog", value: "Backlog" },
  { label: "Todo", value: "Todo" },
  { label: "In Progress", value: "In Progress" },
  { label: "Done", value: "Done" },
  { label: "Canceled", value: "Canceled" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

type Task = {
  id: number;
  task_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  favorite?: boolean;
  created_at?: string;
  updated_at?: string;
};

const COLUMNS = ["Title", "Status", "Priority"];

export default function TaskDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMenuTask, setContextMenuTask] = useState<number | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<boolean>(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState<boolean>(false);
  const [viewMenuOpen, setViewMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [form, setForm] = useState<{
    task_id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string;
  }>({
    task_id: "",
    title: "",
    description: "",
    type: "Feature",
    status: "Backlog",
    priority: "Medium",
  });

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("tasks")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (statusFilter.length > 0) {
          query = query.in("status", statusFilter);
        }
        if (priorityFilter.length > 0) {
          query = query.in("priority", priorityFilter);
        }
        if (search) {
          query = query.or(`title.ilike.%${search}%,task_id.ilike.%${search}%`);
        }
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;
        query = query.range(from, to);
        const { data, count, error } = await query;
        if (error) throw error;
        setTasks((data as Task[]) || []);
        setTotalCount(count || 0);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch tasks";
        setError(errorMsg);
        // eslint-disable-next-line no-console
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [page, rowsPerPage, search, statusFilter, priorityFilter]);

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Ensure task_id is prefixed with 'TASK - '
      let taskId = form.task_id.trim();
      if (!taskId.startsWith('TASK - ')) {
        taskId = `TASK - ${taskId}`;
      }
      const formWithPrefix = { ...form, task_id: taskId };
      if (editTaskId) {
        // Update
        const { error } = await supabase.from("tasks").update({ ...formWithPrefix }).eq("id", editTaskId);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("tasks").insert([{ ...formWithPrefix }]);
        if (error) throw error;
      }
      setShowAddModal(false);
      setEditTaskId(null);
      setForm({
        task_id: "",
        title: "",
        description: "",
        type: "Feature",
        status: "Backlog",
        priority: "Medium",
      });
      // Refetch tasks
      const { data: newTasks } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * rowsPerPage, page * rowsPerPage - 1);
      setTasks((newTasks as Task[]) || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save task";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete task";
      setError(errorMsg);
    }
  };

  const closeContextMenu = () => {
    setContextMenuTask(null);
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenuTask(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Toggle row selection
  const toggleRowSelection = (taskId: number) => {
    setSelectedRows(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Toggle all rows
  const toggleAllRows = () => {
    if (selectedRows.length === tasks.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tasks.map(task => task.id));
    }
  };

  // Helper function for status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <Check className="w-4 h-4" />;
      case "In Progress":
        return <CircleDot className="w-4 h-4" />;
      case "Canceled":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  // Helper function for priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <ArrowUp className="w-4 h-4" />;
      case "Low":
        return <ArrowDown className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  // Helper for task type badge
  const getTypeBadge = (type: string) => {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-300 mr-2">
        {type}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Toggle column visibility
  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  // Edit handler: open modal with task data
  const handleEditTask = (task: Task) => {
    setForm({
      task_id: task.task_id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
    });
    setEditTaskId(task.id);
    setShowAddModal(true);
    setContextMenuTask(null);
  };

  // Make a copy
  const handleCopyTask = async (task: Task) => {
    setLoading(true);
    setError(null);
    try {
      // Remove id, created_at, updated_at before inserting
      const { id, created_at, updated_at, ...rest } = task;
      // Always prefix with 'TASK - '
      let newTaskId = rest.task_id.replace(/^TASK - /, "");
      newTaskId = `TASK - ${newTaskId}-COPY`;
      const newTask = { ...rest, task_id: newTaskId };
      const { error } = await supabase.from("tasks").insert([newTask]);
      if (error) throw error;
      // Refetch tasks
      const { data: newTasks } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * rowsPerPage, page * rowsPerPage - 1);
      setTasks((newTasks as Task[]) || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to copy task";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setContextMenuTask(null);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (task: Task) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("tasks").update({ favorite: !task.favorite }).eq("id", task.id);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === task.id ? { ...t, favorite: !t.favorite } : t));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update favorite";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setContextMenuTask(null);
    }
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Toggle dropdown function
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-8 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-zinc-400 text-sm">Here's a list of your tasks for this month!</p>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* File Upload Button */}
            {user && (
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-800 h-10 text-zinc-200"
                onClick={() => navigate("/file-upload")}
              >
                Upload Files
              </Button>
            )}
            {/* Profile Button */}
            <Button
              variant="outline"
              className="bg-zinc-900 border-zinc-800 h-10 w-10 p-0 text-zinc-200 relative"
              onClick={() => setProfileMenuOpen((v) => !v)}
            >
              <User2 className="h-4 w-4" />
            </Button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <div className="font-semibold text-zinc-100">{user?.user_metadata?.name || user?.email || "User"}</div>
                  <div className="text-xs text-zinc-400">{user?.email}</div>
                </div>
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-200">Profile</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-200">Billing</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-200">Settings</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-zinc-200">New Team</button>
                </div>
                <Separator className="bg-zinc-800" />
                <button 
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-zinc-800" 
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate('/auth');
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-zinc-400" />
            <Input
              placeholder="Filter tasks..."
              className="pl-9 bg-zinc-900 border-zinc-800 w-64 text-zinc-100"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Button 
              variant="outline" 
              className="bg-zinc-900 border-zinc-800 flex items-center" 
              onClick={() => toggleDropdown('status')}
            >
              <div className="mr-2">Status</div>
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {openDropdown === 'status' && (
              <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50">
                {STATUS_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(opt.value)}
                      onChange={() =>
                        setStatusFilter((prev) =>
                          prev.includes(opt.value)
                            ? prev.filter((v) => v !== opt.value)
                            : [...prev, opt.value]
                        )
                      }
                      className="mr-2 accent-zinc-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <Button 
              variant="outline" 
              className="bg-zinc-900 border-zinc-800 flex items-center" 
              onClick={() => toggleDropdown('priority')}
            >
              <div className="mr-2">Priority</div>
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {openDropdown === 'priority' && (
              <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50">
                {PRIORITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priorityFilter.includes(opt.value)}
                      onChange={() =>
                        setPriorityFilter((prev) =>
                          prev.includes(opt.value)
                            ? prev.filter((v) => v !== opt.value)
                            : [...prev, opt.value]
                        )
                      }
                      className="mr-2 accent-zinc-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
          <Button 
            variant="outline" 
              className="bg-zinc-900 border-zinc-800 flex items-center text-zinc-200"
              onClick={() => toggleDropdown('view')}
            >
              <div className="mr-2">View</div>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {openDropdown === 'view' && (
              <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50">
                {COLUMNS.map((col) => (
                  <label key={col} className="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer text-zinc-200">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                      className="mr-2 accent-zinc-600"
                    />
                    {col}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowAddModal(true)}
          >
            + Add Task
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col overflow-visible">
          <div className="rounded-md border border-zinc-800 overflow-visible flex-1 min-h-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-zinc-900 border-b border-zinc-800 py-2 px-4">
              <div className="col-span-1 flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-2 accent-zinc-600"
                  checked={selectedRows.length === tasks.length && tasks.length > 0}
                  onChange={toggleAllRows}
                />
                <span className="text-sm font-medium">Task</span>
              </div>
              <div className="col-span-5 flex items-center text-sm font-medium">
                Title
                <ChevronDown className="ml-1 h-4 w-4" />
              </div>
              <div className="col-span-3 flex items-center text-sm font-medium">
                Status
                <ChevronDown className="ml-1 h-4 w-4" />
              </div>
              <div className="col-span-3 flex items-center text-sm font-medium">
                Priority
                <ChevronDown className="ml-1 h-4 w-4" />
              </div>
          </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-800">
              {loading ? (
                <div className="py-8 text-center text-zinc-400">Loading tasks...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-400">{error}</div>
              ) : tasks.length === 0 ? (
                <div className="py-8 text-center text-zinc-400">No tasks found</div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="grid grid-cols-12 items-center px-6 py-4 hover:bg-zinc-900/50 transition-all"
                  >
                    <div className="col-span-1 flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 accent-zinc-600"
                        checked={selectedRows.includes(task.id)}
                        onChange={() => toggleRowSelection(task.id)}
                      />
                      <span className="text-sm text-zinc-400 font-mono">{task.task_id}</span>
                    </div>
                    <div className="col-span-5 flex items-center">
                      {getTypeBadge(task.type)}
                      <span className="text-sm truncate text-white font-medium">{task.title}</span>
                    </div>
                    <div className="col-span-3 flex items-center">
                      {getStatusIcon(task.status)}
                      <span className="ml-2 text-sm text-white">{task.status}</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      {getPriorityIcon(task.priority)}
                      {task.favorite && <Star className="ml-1 h-4 w-4 text-yellow-400" />}
                    </div>
                    <div className="col-span-1 flex justify-end relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={e => {
                          e.stopPropagation();
                          setContextMenuTask(contextMenuTask === task.id ? null : task.id);
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {contextMenuTask === task.id && (
                        <div
                          className="absolute right-0 top-8 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-10 w-48 min-w-max"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex flex-col py-1">
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 text-zinc-200" onClick={() => handleEditTask(task)}>Edit</button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 text-zinc-200" onClick={() => handleCopyTask(task)}>Make a copy</button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 text-zinc-200" onClick={() => handleToggleFavorite(task)}>{task.favorite ? "Unfavorite" : "Favorite"}</button>
                            <div className="relative group">
                              <button className="w-full flex items-center justify-between text-left px-4 py-2 text-sm hover:bg-zinc-800 text-zinc-200">
                                <span>Labels</span>
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </button>
                            </div>
                            <button 
                              className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 text-red-400 flex items-center"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                              <span className="ml-auto text-xs text-zinc-500">⌘ ⌫</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="text-zinc-400">
              {selectedRows.length} of {totalCount} row(s) selected.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 mr-2">Rows per page</span>
              <div className="relative">
                <select 
                  className="bg-transparent pl-2 pr-8 py-1 text-sm border border-zinc-800 rounded appearance-none" 
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setPage(1); // Reset to first page when changing rows per page
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-4 w-4 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Page {page} of {totalPages || 1}</span>
              <div className="flex">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-zinc-900 border-zinc-800"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-zinc-900 border-zinc-800 ml-1"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-zinc-900 border-zinc-800 ml-1"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-zinc-900 border-zinc-800 ml-1"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{editTaskId ? 'Edit Task' : 'Add Task'}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
              >
                <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                </svg>
              </Button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-zinc-200">Task ID</label>
                  <Input 
                    required
                    value={form.task_id}
                    onChange={(e) => setForm({ ...form, task_id: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-zinc-200">Title</label>
                  <Input 
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-zinc-200">Description</label>
                  <Input 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-zinc-200">Type</label>
                    <select
                      className="w-full rounded-md bg-zinc-800 border-zinc-700 py-2 px-3 text-white"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="Feature">Feature</option>
                      <option value="Bug">Bug</option>
                      <option value="Documentation">Documentation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-zinc-200">Status</label>
                    <select
                      className="w-full rounded-md bg-zinc-800 border-zinc-700 py-2 px-3 text-white"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-zinc-200">Priority</label>
                    <select
                      className="w-full rounded-md bg-zinc-800 border-zinc-700 py-2 px-3 text-white"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-700 text-black hover:bg-zinc-800"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 