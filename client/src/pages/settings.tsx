import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon,
  Link as LinkIcon,
  Bell,
  Users,
  Key,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@shared/schema";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: teamMembers, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/team/invite", {
        memberId: email,
        email,
        role: "member",
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setInviteEmail("");
      toast({ title: "Invitation sent" });
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove team member", variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections" data-testid="tab-connections">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="ai" data-testid="tab-ai">
            <Key className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>
                Connect your Google Drive to sync files automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Not connected</span>
                </div>
                <Button data-testid="button-connect-google-drive">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Sheets</CardTitle>
              <CardDescription>
                Sync task progress to Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Not connected</span>
                </div>
                <Button data-testid="button-connect-google-sheets">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inapp-notifications">In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the dashboard
                  </p>
                </div>
                <Switch
                  id="inapp-notifications"
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                  data-testid="switch-inapp-notifications"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Invite team members to collaborate on tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
                <Button
                  onClick={() => inviteMutation.mutate(inviteEmail)}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  data-testid="button-invite-member"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              <Separator />

              {teamLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : teamMembers && teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`team-member-${member.id}`}
                    >
                      <div>
                        <p className="font-medium">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge variant={member.status === "active" ? "default" : "secondary"}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        data-testid={`button-remove-member-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No team members yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI providers for task processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Claude Pro (Anthropic)</p>
                  <p className="text-sm text-muted-foreground">
                    Used for task triage and complex reasoning
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Gemini Pro (Google)</p>
                  <p className="text-sm text-muted-foreground">
                    Used for content generation and processing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                AI providers are configured via environment variables. Contact support to update.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              )}
              <Button variant="destructive" onClick={() => logout()} data-testid="button-logout">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
