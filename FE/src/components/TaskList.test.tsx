import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from './TaskList';
import { Task, User } from '@/lib/api';

const mockUsers: User[] = [
  { id: '1', email: 'user1@test.com', name: 'User 1', role: 'user', createdAt: '', updatedAt: '' },
  { id: '2', email: 'user2@test.com', name: 'User 2', role: 'user', createdAt: '', updatedAt: '' },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'pending',
    createdById: '1',
    createdBy: mockUsers[0],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    title: 'Task 2',
    description: 'Description 2',
    status: 'in_progress',
    assignedToId: '2',
    assignedTo: mockUsers[1],
    createdById: '1',
    createdBy: mockUsers[0],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('TaskList', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tasks correctly', () => {
    render(
      <TaskList
        tasks={mockTasks}
        users={mockUsers}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        currentUserId="1"
        userRole="user"
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('shows empty message when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        users={mockUsers}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        currentUserId="1"
        userRole="user"
      />
    );

    expect(screen.getByText(/No tasks found/)).toBeInTheDocument();
  });

  it('calls onUpdate when status is changed', () => {
    render(
      <TaskList
        tasks={mockTasks}
        users={mockUsers}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        currentUserId="1"
        userRole="admin"
      />
    );

    const statusSelects = screen.getAllByLabelText('Status:');
    fireEvent.change(statusSelects[0], { target: { value: 'completed' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('1', { status: 'completed' });
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TaskList
        tasks={mockTasks}
        users={mockUsers}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        currentUserId="1"
        userRole="admin"
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskList
        tasks={mockTasks}
        users={mockUsers}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        currentUserId="1"
        userRole="admin"
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTasks[0]);
  });
});

