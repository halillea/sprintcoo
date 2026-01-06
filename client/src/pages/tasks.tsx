import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Play, 
  Zap, 
  CheckCircle, 
  Clock, 
  XCircle,
  Bot,
  User,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const triageMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("POST", `/api/tasks/${taskId}/triage`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task triaged successfully" });
    },
    onError: () => {
      toast({ title: "Failed to triage task", variant: "destructive" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("POST", `/api/tasks/${taskId}/execute`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Task executed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to execute task", variant: "destructive" });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "auto_execute": return <Zap className="h-4 w-4 text-green-500" />;
      case "delegate_agent": return <Bot className="h-4 w-4 text-blue-500" />;
      case "human_required": return <User className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in_progress": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "failed": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>;
      case "high": return <Badge>High</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const filteredTasks = tasks?.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "auto") return task.category === "auto_execute";
    if (activeTab === "delegated") return task.category === "delegate_agent";
    if (activeTab === "human") return task.category === "human_required";
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your tasks</p>
        </div>
        <Button data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({tasks?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="auto" data-testid="tab-auto">
            Auto-Execute ({tasks?.filter(t => t.category === "auto_execute").length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="delegated" data-testid="tab-delegated">
            Delegated ({tasks?.filter(t => t.category === "delegate_agent").length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="human" data-testid="tab-human">
            Human Required ({tasks?.filter(t => t.category === "human_required").length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredTasks && filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} data-testid={`task-card-${task.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getCategoryIcon(task.category)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                          {task.errorMessage && (
                            <p className="text-sm text-destructive mt-2">
                              Error: {task.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === "pending" && task.category === "auto_execute" && (
                          <Button
                            size="sm"
                            onClick={() => executeMutation.mutate(task.id)}
                            disabled={executeMutation.isPending}
                            data-testid={`button-execute-${task.id}`}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Execute
                          </Button>
                        )}
                        {task.category === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triageMutation.mutate(task.id)}
                            disabled={triageMutation.isPending}
                            data-testid={`button-triage-${task.id}`}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Triage
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" data-testid={`button-task-menu-${task.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
