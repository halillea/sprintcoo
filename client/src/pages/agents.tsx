import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Bot, 
  Code, 
  FileText,
  Zap,
  MoreVertical,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Agent } from "@shared/schema";

export default function Agents() {
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "prompt": return <FileText className="h-5 w-5" />;
      case "script": return <Code className="h-5 w-5" />;
      case "automation": return <Zap className="h-5 w-5" />;
      default: return <Bot className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "prompt": return <Badge variant="secondary">Prompt</Badge>;
      case "script": return <Badge variant="default">Script</Badge>;
      case "automation": return <Badge>Automation</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCreatorBadge = (createdBy: string) => {
    if (createdBy === "digital_coo") {
      return (
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3" />
          Digital COO
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <User className="h-3 w-3" />
        Manual
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Agents</h1>
          <p className="text-muted-foreground">AI agents that handle your tasks</p>
        </div>
        <Button data-testid="button-add-agent">
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover-elevate" data-testid={`agent-card-${agent.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {getTypeIcon(agent.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {agent.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-agent-menu-${agent.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View README</DropdownMenuItem>
                    <DropdownMenuItem>Test Agent</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(agent.type)}
                    {getCreatorBadge(agent.createdBy)}
                    {!agent.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Used {agent.usageCount} times</span>
                    <span>{new Date(agent.createdAt!).toLocaleDateString()}</span>
                  </div>

                  {agent.readme && (
                    <div className="p-3 rounded-md bg-muted/50 text-sm">
                      <p className="text-muted-foreground line-clamp-3">{agent.readme}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full" data-testid={`button-run-agent-${agent.id}`}>
                    <Bot className="h-4 w-4 mr-2" />
                    Run Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No agents yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agents are created automatically by the Digital COO or manually by you
            </p>
            <Button className="mt-4" data-testid="button-create-first-agent">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
