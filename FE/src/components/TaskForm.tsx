'use client';

import { useForm } from 'react-hook-form';
import { Task, User, CreateTaskDto, UpdateTaskDto } from '@/lib/api';

interface TaskFormProps {
  users: User[];
  task?: Task;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => void;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  users,
  task,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskDto>({
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          assignedToId: task.assignedToId,
        }
      : {},
  });

  const submitHandler = (data: CreateTaskDto) => {
    const submitData = {
      ...data,
      assignedToId: data.assignedToId && data.assignedToId.trim() !== '' ? data.assignedToId : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title *</label>
            <input
              id="title"
              type="text"
              className="form-input"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <span className="text-red-500 text-sm">{errors.title.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              {...register('description')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" className="form-select" {...register('status')}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignedToId" className="form-label">Assign To *</label>
            <select
              id="assignedToId"
              className="form-select"
              {...register('assignedToId', {
                required: 'Task must be assigned to a user',
                validate: (value) => {
                  const filteredUsers = users.filter((u) => u.role === 'user');
                  return (
                    filteredUsers.some((u) => u.id === value) ||
                    'Task must be assigned to a user (not admin)'
                  );
                },
              })}
            >
              <option value="">Select a user</option>
              {users
                .filter((u) => u.role === 'user')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            {errors.assignedToId && (
              <span className="text-red-500 text-sm">
                {errors.assignedToId.message}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {task ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

