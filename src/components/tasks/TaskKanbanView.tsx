import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format, isPast, isToday } from 'date-fns';
import { Task, TaskStatus } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, User, CheckCircle2 } from 'lucide-react';
import { useUserDisplayNames } from '@/hooks/useUserDisplayNames';

interface TaskKanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'open', title: 'Open', color: 'border-t-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-purple-500' },
  { id: 'completed', title: 'Completed', color: 'border-t-green-500' },
  { id: 'deferred', title: 'Deferred', color: 'border-t-gray-500' },
];

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export const TaskKanbanView = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskKanbanViewProps) => {
  const assignedToIds = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))] as string[];
  const { displayNames } = useUserDisplayNames(assignedToIds);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    
    onStatusChange(taskId, newStatus);
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-500';
    if (isToday(date)) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <Card className={`border-t-4 ${column.color}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary">
                    {getTasksByStatus(column.id).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] space-y-2 p-1 rounded-md transition-colors ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : ''
                      }`}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-card border rounded-lg p-3 shadow-sm transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                                  <span className="font-medium text-sm line-clamp-2">
                                    {task.title}
                                  </span>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Subtasks progress */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {task.due_date && (
                                    <div className={`flex items-center gap-1 ${getDueDateColor(task.due_date)}`}>
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(task.due_date), 'dd/MM')}
                                    </div>
                                  )}
                                  {task.assigned_to && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span className="truncate max-w-[60px]">
                                        {displayNames[task.assigned_to]?.split(' ')[0] || '...'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(task);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(task.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Tags */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {task.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      +{task.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
