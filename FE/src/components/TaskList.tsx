'use client';

import { Task, User, UpdateTaskDto } from '@/lib/api';

interface TaskListProps {
  tasks: Task[];
  users: User[];
  onUpdate: (id: string, data: UpdateTaskDto) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  currentUserId?: string;
  userRole?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  users,
  onUpdate,
  onDelete,
  onEdit,
  currentUserId,
  userRole,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    onUpdate(taskId, { status: newStatus as any });
  };

  const handleAssignChange = (taskId: string, userId: string) => {
    onUpdate(taskId, { assignedToId: userId && userId.trim() !== '' ? userId : undefined });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tasks found. Create your first task!
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => {
        const canEdit = userRole === 'admin';
        const canDelete = userRole === 'admin';

        return (
          <div key={task.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 mb-2">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span>Created by: {task.createdBy?.name}</span>
                  {task.assignedTo && (
                    <span>Assigned to: {task.assignedTo.name}</span>
                  )}
                  <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button
                    onClick={() => onEdit(task)}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor={`status-${task.id}`} className="text-sm font-medium">Status:</label>
                <select
                  id={`status-${task.id}`}
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  disabled={!canEdit}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <label htmlFor={`assign-${task.id}`} className="text-sm font-medium">Assign to:</label>
                  <select
                    id={`assign-${task.id}`}
                    value={task.assignedToId || ''}
                    onChange={(e) => handleAssignChange(task.id, e.target.value)}
                    className="form-select"
                    style={{ width: 'auto', minWidth: '150px' }}
                  >
                    <option value="">Unassigned</option>
                    {users
                      .filter((u) => u.role === 'user')
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

