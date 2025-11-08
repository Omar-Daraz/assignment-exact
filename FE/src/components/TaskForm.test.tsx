import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from './TaskForm';
import { Task, User } from '@/lib/api';

const mockUsers: User[] = [
  { id: '1', email: 'user1@test.com', name: 'User 1', role: 'user', createdAt: '', updatedAt: '' },
  { id: '2', email: 'user2@test.com', name: 'User 2', role: 'user', createdAt: '', updatedAt: '' },
];

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'pending',
  createdById: '1',
  createdBy: mockUsers[0],
  createdAt: '',
  updatedAt: '',
};

describe('TaskForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <TaskForm
        users={mockUsers}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Assign To *')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(
      <TaskForm
        users={mockUsers}
        task={mockTask}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('calls onSubmit with form data when submitted', async () => {
    render(
      <TaskForm
        users={mockUsers}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'New Task' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New Description' },
    });
    fireEvent.change(screen.getByLabelText('Assign To *'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <TaskForm
        users={mockUsers}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation error for empty title', async () => {
    render(
      <TaskForm
        users={mockUsers}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});

