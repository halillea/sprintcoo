import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FolderKanban, 
  Bot,
  ArrowRight,
  Activity,
  FolderOpen,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DashboardStats, Task, ActivityLog } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: urgentTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/dashboard/urgent"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/drive/import-tasks", {
        folderName: "4COO",
        fileName: "tasks-urgent-06jan.txt"
      });
    },
    onSuccess: async (response: any) => {
      const data = await response.json();
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Tasks Imported",
        description: `Imported ${data.summary.total} tasks: ${data.summary.autoExecute} auto-execute, ${data.summary.delegated} delegated, ${data.summary.humanRequired} human required`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import tasks from Google Drive",
        variant: "destructive"
      });
    },
  });

  const statCards = [
    { title: "Completed Today", value: stats?.completedToday ?? 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Pending Attention", value: stats?.pendingAttention ?? 0, icon: Clock, color: "text-yellow-500" },
    { title: "Errors", value: stats?.errorCount ?? 0, icon: XCircle, color: "text-red-500" },
    { title: "Projects", value: stats?.projectCount ?? 0, icon: FolderKanban, color: "text-primary" },
    { title: "Agents", value: stats?.agentCount ?? 0, icon: Bot, color: "text-primary" },
    { title: "Total Tasks", value: stats?.totalTasks ?? 0, icon: Activity, color: "text-muted-foreground" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Your command center</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
            data-testid="button-import-from-drive"
          >
            {importMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            Import from 4COO
          </Button>
          <Button asChild data-testid="button-view-all-tasks">
            <Link href="/tasks">
              View All Tasks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {importResult && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Tasks Imported Successfully</p>
                <p className="text-sm text-muted-foreground">
                  Imported {importResult.summary.total} tasks: {importResult.summary.autoExecute} auto-execute, {importResult.summary.delegated} delegated, {importResult.summary.humanRequired} human required
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Requires Your Attention</CardTitle>
              <CardDescription>Tasks needing human decision</CardDescription>
            </div>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : urgentTasks && urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    data-testid={`task-urgent-${task.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.description || "No description"}
                      </p>
                    </div>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No tasks require your attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>What the Digital COO has been doing</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
