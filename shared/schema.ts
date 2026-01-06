import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
export * from "./models/chat";

// ============================================
// PROJECTS
// ============================================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, completed, archived
  googleDriveFolderId: text("google_drive_folder_id"),
  googleSheetId: text("google_sheet_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  files: many(files),
}));

// ============================================
// TASKS
// ============================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("pending"), // pending, auto_execute, delegate_agent, human_required
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  sourceFile: text("source_file"), // Original file this task came from
  assignedAgentId: integer("assigned_agent_id").references(() => agents.id),
  result: text("result"), // Result/output of the task
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional task-specific data
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  agent: one(agents, {
    fields: [tasks.assignedAgentId],
    references: [agents.id],
  }),
}));

// ============================================
// AGENTS
// ============================================
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("prompt"), // prompt, script, automation
  createdBy: text("created_by").notNull().default("user"), // user, digital_coo
  prompt: text("prompt"), // For prompt-type agents
  script: text("script"), // For script-type agents
  readme: text("readme"), // How to use this agent
  configuration: jsonb("configuration"), // Agent-specific config
  usageCount: integer("usage_count").notNull().default(0),
  googleDriveFileId: text("google_drive_file_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ many }) => ({
  tasks: many(tasks),
}));

// ============================================
// FILES (Google Drive sync + uploads)
// ============================================
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  type: text("type").notNull().default("input"), // input, output, master_document
  source: text("source").notNull().default("upload"), // upload, google_drive, generated
  googleDriveId: text("google_drive_id"),
  googleDriveUrl: text("google_drive_url"),
  localPath: text("local_path"),
  content: text("content"), // For text files, store content directly
  isMasterDocument: boolean("is_master_document").notNull().default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const filesRelations = relations(files, ({ one, many }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  generatedPosts: many(socialPosts),
}));

// ============================================
// SOCIAL POSTS (Generated from Master Documents)
// ============================================
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  masterDocumentId: integer("master_document_id").references(() => files.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // x, facebook, linkedin, instagram, tiktok_script, youtube_script
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // draft, ready, published
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  masterDocument: one(files, {
    fields: [socialPosts.masterDocumentId],
    references: [files.id],
  }),
}));

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // task_update, error, info, action_required
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedTaskId: integer("related_task_id").references(() => tasks.id, { onDelete: "set null" }),
  relatedProjectId: integer("related_project_id").references(() => projects.id, { onDelete: "set null" }),
  isRead: boolean("is_read").notNull().default(false),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// ACTIVITY LOG
// ============================================
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // task_created, task_completed, file_processed, agent_created, error
  description: text("description").notNull(),
  entityType: text("entity_type"), // task, project, agent, file
  entityId: integer("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TEAM MEMBERS (For multi-user support)
// ============================================
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull(), // The CEO/owner
  memberId: varchar("member_id").notNull(), // The team member
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // member, admin
  status: text("status").notNull().default("pending"), // pending, active, inactive
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

// ============================================
// INSERT SCHEMAS
// ============================================
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, invitedAt: true });

// ============================================
// TYPES
// ============================================
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// ============================================
// API CONTRACT TYPES
// ============================================
export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type CreateAgentRequest = InsertAgent;
export type UpdateAgentRequest = Partial<InsertAgent>;
export type CreateFileRequest = InsertFile;
export type UpdateFileRequest = Partial<InsertFile>;
export type CreateNotificationRequest = InsertNotification;
export type CreateTeamMemberRequest = InsertTeamMember;

// Dashboard stats type
export type DashboardStats = {
  totalTasks: number;
  completedToday: number;
  pendingAttention: number;
  errorCount: number;
  projectCount: number;
  agentCount: number;
};

// Triage result type
export type TriageResult = {
  category: "auto_execute" | "delegate_agent" | "human_required";
  confidence: number;
  reasoning: string;
  suggestedAgent?: string;
};
