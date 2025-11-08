'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket, NotificationData } from '@/hooks/useWebSocket';
import { tasksApi, usersApi, Task, CreateTaskDto, UpdateTaskDto } from '@/lib/api';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { NotificationContainer, Notification } from './Notification';

export const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleNotification = useCallback((data: NotificationData) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      message: data.message,
      eventType: data.eventType,
      timestamp: new Date(data.timestamp),
    };
    
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  useWebSocket(handleNotification);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((res) => res.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((res) => res.data),
    enabled: !!user && user.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskDto) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreate = (data: CreateTaskDto | UpdateTaskDto) => {
    createMutation.mutate(data as CreateTaskDto);
  };

  const handleUpdate = (id: string, data: CreateTaskDto | UpdateTaskDto) => {
    updateMutation.mutate({ id, data: data as UpdateTaskDto });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Task Management System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user?.name} ({user?.role})
            </span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tasks</h2>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              Create Task
            </button>
          )}
        </div>

        {tasksLoading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={tasks}
            users={users}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onEdit={setEditingTask}
            currentUserId={user?.id}
            userRole={user?.role}
          />
        )}

        {isCreateModalOpen && (
          <TaskForm
            users={users}
            onSubmit={handleCreate}
            onClose={() => setIsCreateModalOpen(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            users={users}
            task={editingTask}
            onSubmit={(data) => handleUpdate(editingTask.id, data)}
            onClose={() => setEditingTask(null)}
          />
        )}
      </main>
    </div>
  );
};

