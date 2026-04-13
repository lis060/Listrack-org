import { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar as CalendarIcon,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTask = async (id: string, currentStatus: string) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        status: currentStatus === 'completed' ? 'pending' : 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;
    try {
      const taskData = {
        title: newTask,
        priority: 'medium',
        status: 'pending',
        dueDate: 'Today',
        createdAt: serverTimestamp(),
        userId: user.uid
      };
      await addDoc(collection(db, 'tasks'), taskData);
      setNewTask('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    }
  };

  const startEdit = (task: any) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim() || !user) return;
    try {
      await updateDoc(doc(db, 'tasks', id), {
        title: editValue,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Keep track of your daily to-dos and deadlines.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            {pendingTasks.length} Pending
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <form onSubmit={addTask} className="flex gap-2">
          <Input 
            placeholder="Add a new task..." 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="h-12 text-lg"
          />
          <Button type="submit" size="lg" className="px-8">
            <Plus className="w-5 h-5 mr-2" />
            Add
          </Button>
        </form>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
            ) : (
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask}
                    isEditing={editingId === task.id}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onStartEdit={() => startEdit(task)}
                    onSaveEdit={() => saveEdit(task.id)}
                    onCancelEdit={cancelEdit}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {pendingTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask}
                  isEditing={editingId === task.id}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(task)}
                  onSaveEdit={() => saveEdit(task.id)}
                  onCancelEdit={cancelEdit}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {completedTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask}
                  isEditing={editingId === task.id}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(task)}
                  onSaveEdit={() => saveEdit(task.id)}
                  onCancelEdit={cancelEdit}
                />
              ))}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: any;
  onToggle: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (val: string) => void;
  onStartEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  key?: React.Key;
}

function TaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  isEditing, 
  editValue, 
  onEditChange, 
  onStartEdit, 
  onSaveEdit, 
  onCancelEdit 
}: TaskItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all",
        task.status === 'completed' && !isEditing && "opacity-60"
      )}
    >
      {!isEditing && (
        <button 
          onClick={() => onToggle(task.id, task.status)}
          className="text-primary hover:scale-110 transition-transform"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6 text-muted-foreground" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input 
              value={editValue} 
              onChange={(e) => onEditChange?.(e.target.value)}
              className="h-9"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit?.();
                if (e.key === 'Escape') onCancelEdit?.();
              }}
            />
            <Button size="sm" onClick={onSaveEdit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
          </div>
        ) : (
          <>
            <h3 className={cn(
              "font-medium text-lg truncate",
              task.status === 'completed' && "line-through"
            )}>
              {task.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="w-3 h-3" />
                {task.dueDate}
              </div>
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase tracking-wider px-1.5 py-0",
                task.priority === 'high' ? "text-rose-600 border-rose-200 bg-rose-50" :
                task.priority === 'medium' ? "text-amber-600 border-amber-200 bg-amber-50" :
                "text-emerald-600 border-emerald-200 bg-emerald-50"
              )}>
                {task.priority}
              </Badge>
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onStartEdit}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
