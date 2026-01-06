import { z } from "zod";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertAgentSchema,
  insertFileSchema,
  insertNotificationSchema,
  insertTeamMemberSchema,
} from "./schema";

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Dashboard
  dashboard: {
    stats: {
      method: "GET" as const,
      path: "/api/dashboard/stats",
      responses: {
        200: z.object({
          totalTasks: z.number(),
          completedToday: z.number(),
          pendingAttention: z.number(),
          errorCount: z.number(),
          projectCount: z.number(),
          agentCount: z.number(),
        }),
      },
    },
    recentActivity: {
      method: "GET" as const,
      path: "/api/dashboard/activity",
      responses: {
        200: z.array(z.object({
          id: z.number(),
          action: z.string(),
          description: z.string(),
          entityType: z.string().nullable(),
          entityId: z.number().nullable(),
          createdAt: z.string(),
        })),
      },
    },
    urgentTasks: {
      method: "GET" as const,
      path: "/api/dashboard/urgent",
      responses: {
        200: z.array(z.object({
          id: z.number(),
          title: z.string(),
          priority: z.string(),
          status: z.string(),
          category: z.string(),
          projectId: z.number().nullable(),
          createdAt: z.string(),
        })),
      },
    },
  },

  // Projects
  projects: {
    list: {
      method: "GET" as const,
      path: "/api/projects",
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/projects/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects",
      input: insertProjectSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/projects/:id",
      input: insertProjectSchema.partial(),
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/projects/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Tasks
  tasks: {
    list: {
      method: "GET" as const,
      path: "/api/tasks",
      input: z.object({
        projectId: z.number().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/tasks/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/tasks",
      input: insertTaskSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/tasks/:id",
      input: insertTaskSchema.partial(),
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/tasks/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    triage: {
      method: "POST" as const,
      path: "/api/tasks/:id/triage",
      responses: {
        200: z.object({
          category: z.enum(["auto_execute", "delegate_agent", "human_required"]),
          confidence: z.number(),
          reasoning: z.string(),
          suggestedAgent: z.string().optional(),
        }),
      },
    },
    execute: {
      method: "POST" as const,
      path: "/api/tasks/:id/execute",
      responses: {
        200: z.object({
          success: z.boolean(),
          result: z.string().optional(),
          error: z.string().optional(),
        }),
      },
    },
  },

  // Agents
  agents: {
    list: {
      method: "GET" as const,
      path: "/api/agents",
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/agents/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/agents",
      input: insertAgentSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/agents/:id",
      input: insertAgentSchema.partial(),
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/agents/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Files
  files: {
    list: {
      method: "GET" as const,
      path: "/api/files",
      input: z.object({
        projectId: z.number().optional(),
        type: z.string().optional(),
        isMasterDocument: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/files/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    upload: {
      method: "POST" as const,
      path: "/api/files/upload",
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    markAsMaster: {
      method: "PATCH" as const,
      path: "/api/files/:id/master",
      input: z.object({ isMasterDocument: z.boolean() }),
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    generatePosts: {
      method: "POST" as const,
      path: "/api/files/:id/generate-posts",
      responses: {
        200: z.array(z.any()),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/files/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Social Posts
  socialPosts: {
    list: {
      method: "GET" as const,
      path: "/api/social-posts",
      input: z.object({
        masterDocumentId: z.number().optional(),
        platform: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()),
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/social-posts/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Notifications
  notifications: {
    list: {
      method: "GET" as const,
      path: "/api/notifications",
      responses: {
        200: z.array(z.any()),
      },
    },
    markRead: {
      method: "PATCH" as const,
      path: "/api/notifications/:id/read",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    markAllRead: {
      method: "POST" as const,
      path: "/api/notifications/mark-all-read",
      responses: {
        200: z.object({ updated: z.number() }),
      },
    },
  },

  // Team
  team: {
    list: {
      method: "GET" as const,
      path: "/api/team",
      responses: {
        200: z.array(z.any()),
      },
    },
    invite: {
      method: "POST" as const,
      path: "/api/team/invite",
      input: insertTeamMemberSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/team/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // File Processing (parse task files)
  processing: {
    parseTaskFile: {
      method: "POST" as const,
      path: "/api/processing/parse-tasks",
      responses: {
        200: z.object({
          tasks: z.array(z.object({
            title: z.string(),
            description: z.string().optional(),
            projectName: z.string().optional(),
          })),
        }),
      },
    },
    triageAll: {
      method: "POST" as const,
      path: "/api/processing/triage-all",
      responses: {
        200: z.object({
          processed: z.number(),
          results: z.array(z.any()),
        }),
      },
    },
  },
};

// ============================================
// URL BUILDER HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE EXPORTS
// ============================================
export type DashboardStatsResponse = z.infer<typeof api.dashboard.stats.responses[200]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
