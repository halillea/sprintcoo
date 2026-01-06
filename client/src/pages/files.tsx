import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Upload,
  FileText, 
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Star,
  StarOff,
  MoreVertical,
  Search,
  FolderOpen,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

export default function Files() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: files, isLoading } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const markAsMasterMutation = useMutation({
    mutationFn: async ({ id, isMasterDocument }: { id: number; isMasterDocument: boolean }) => {
      return apiRequest("PATCH", `/api/files/${id}/master`, { isMasterDocument });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "File updated" });
    },
    onError: () => {
      toast({ title: "Failed to update file", variant: "destructive" });
    },
  });

  const generatePostsMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/files/${id}/generate-posts`);
    },
    onSuccess: () => {
      toast({ title: "Social posts generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate posts", variant: "destructive" });
    },
  });

  const getFileIcon = (mimeType: string | null, name: string) => {
    if (mimeType?.includes("text") || name.endsWith(".txt") || name.endsWith(".md")) {
      return <FileText className="h-5 w-5" />;
    }
    if (name.endsWith(".csv") || name.endsWith(".xlsx")) {
      return <FileSpreadsheet className="h-5 w-5" />;
    }
    if (name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".html")) {
      return <FileCode className="h-5 w-5" />;
    }
    return <FileIcon className="h-5 w-5" />;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "input": return <Badge variant="outline">Input</Badge>;
      case "output": return <Badge variant="secondary">Output</Badge>;
      case "master_document": return <Badge>Master</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "upload": return <Badge variant="outline">Uploaded</Badge>;
      case "google_drive": return <Badge variant="secondary">Drive</Badge>;
      case "generated": return <Badge>Generated</Badge>;
      default: return null;
    }
  };

  const filteredFiles = files?.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Files</h1>
          <p className="text-muted-foreground">Your documents and generated content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-connect-drive">
            <FolderOpen className="h-4 w-4 mr-2" />
            Connect Drive
          </Button>
          <Button data-testid="button-upload-file">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-files"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredFiles && filteredFiles.length > 0 ? (
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <Card key={file.id} data-testid={`file-card-${file.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-md bg-muted text-muted-foreground">
                      {getFileIcon(file.mimeType, file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{file.name}</h3>
                        {file.isMasterDocument && (
                          <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getTypeBadge(file.type)}
                        {getSourceBadge(file.source)}
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.isMasterDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePostsMutation.mutate(file.id)}
                        disabled={generatePostsMutation.isPending}
                        data-testid={`button-generate-posts-${file.id}`}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate Posts
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markAsMasterMutation.mutate({
                        id: file.id,
                        isMasterDocument: !file.isMasterDocument
                      })}
                      data-testid={`button-toggle-master-${file.id}`}
                    >
                      {file.isMasterDocument ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-file-menu-${file.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Content</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Open in Drive</DropdownMenuItem>
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
            <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? "No files match your search" : "No files yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload files or connect Google Drive to get started
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" data-testid="button-connect-drive-empty">
                <FolderOpen className="h-4 w-4 mr-2" />
                Connect Drive
              </Button>
              <Button data-testid="button-upload-file-empty">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
