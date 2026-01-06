import { db } from "./db";
import {
  projects,
  tasks,
  agents,
  files,
  socialPosts,
  notifications,
  activityLogs,
  teamMembers,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Agent,
  type InsertAgent,
  type File,
  type InsertFile,
  type SocialPost,
  type InsertSocialPost,
  type Notification,
  type InsertNotification,
  type ActivityLog,
  type InsertActivityLog,
  type TeamMember,
  type InsertTeamMember,
  type DashboardStats,
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Tasks
  getTasks(userId: string, filters?: { projectId?: number; category?: string; status?: string }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  getUrgentTasks(userId: string): Promise<Task[]>;
  getCompletedTodayCount(userId: string): Promise<number>;

  // Agents
  getAgents(userId: string): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<void>;

  // Files
  getFiles(userId: string, filters?: { projectId?: number; type?: string; isMasterDocument?: boolean }): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<void>;

  // Social Posts
  getSocialPosts(userId: string, filters?: { masterDocumentId?: number; platform?: string; status?: string }): Promise<SocialPost[]>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<number>;

  // Activity Logs
  getRecentActivity(userId: string, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Team
  getTeamMembers(ownerId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;

  // Dashboard
  getDashboardStats(userId: string): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set({ ...updates, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Tasks
  async getTasks(userId: string, filters?: { projectId?: number; category?: string; status?: string }): Promise<Task[]> {
    let query = db.select().from(tasks).where(eq(tasks.userId, userId));
    
    if (filters?.projectId) {
      query = db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.projectId, filters.projectId)));
    }
    if (filters?.category) {
      query = db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.category, filters.category)));
    }
    if (filters?.status) {
      query = db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, filters.status)));
    }
    
    return query.orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set({ ...updates, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getUrgentTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.category, "human_required"),
        eq(tasks.status, "pending")
      ))
      .orderBy(desc(tasks.createdAt))
      .limit(10);
  }

  async getCompletedTodayCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, "completed"),
        gte(tasks.completedAt, today)
      ));
    
    return Number(result[0]?.count ?? 0);
  }

  // Agents
  async getAgents(userId: string): Promise<Agent[]> {
    return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [created] = await db.insert(agents).values(agent).returning();
    return created;
  }

  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db.update(agents).set({ ...updates, updatedAt: new Date() }).where(eq(agents.id, id)).returning();
    return updated;
  }

  async deleteAgent(id: number): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  // Files
  async getFiles(userId: string, filters?: { projectId?: number; type?: string; isMasterDocument?: boolean }): Promise<File[]> {
    let conditions = [eq(files.userId, userId)];
    
    if (filters?.projectId) conditions.push(eq(files.projectId, filters.projectId));
    if (filters?.type) conditions.push(eq(files.type, filters.type));
    if (filters?.isMasterDocument !== undefined) conditions.push(eq(files.isMasterDocument, filters.isMasterDocument));
    
    return db.select().from(files).where(and(...conditions)).orderBy(desc(files.createdAt));
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<File> {
    const [created] = await db.insert(files).values(file).returning();
    return created;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const [updated] = await db.update(files).set({ ...updates, updatedAt: new Date() }).where(eq(files.id, id)).returning();
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Social Posts
  async getSocialPosts(userId: string, filters?: { masterDocumentId?: number; platform?: string; status?: string }): Promise<SocialPost[]> {
    let conditions = [eq(socialPosts.userId, userId)];
    
    if (filters?.masterDocumentId) conditions.push(eq(socialPosts.masterDocumentId, filters.masterDocumentId));
    if (filters?.platform) conditions.push(eq(socialPosts.platform, filters.platform));
    if (filters?.status) conditions.push(eq(socialPosts.status, filters.status));
    
    return db.select().from(socialPosts).where(and(...conditions)).orderBy(desc(socialPosts.createdAt));
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [created] = await db.insert(socialPosts).values(post).returning();
    return created;
  }

  async updateSocialPost(id: number, updates: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const [updated] = await db.update(socialPosts).set({ ...updates, updatedAt: new Date() }).where(eq(socialPosts.id, id)).returning();
    return updated;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    const result = await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))).returning();
    return result.length;
  }

  // Activity Logs
  async getRecentActivity(userId: string, limit = 20): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLogs).values(log).returning();
    return created;
  }

  // Team
  async getTeamMembers(ownerId: string): Promise<TeamMember[]> {
    return db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId));
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [created] = await db.insert(teamMembers).values(member).returning();
    return created;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Dashboard
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [totalTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.userId, userId));
    const completedToday = await this.getCompletedTodayCount(userId);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.category, "human_required"), eq(tasks.status, "pending")));
    const [errorResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "failed")));
    const [projectResult] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.userId, userId));
    const [agentResult] = await db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.userId, userId));

    return {
      totalTasks: Number(totalTasksResult?.count ?? 0),
      completedToday,
      pendingAttention: Number(pendingResult?.count ?? 0),
      errorCount: Number(errorResult?.count ?? 0),
      projectCount: Number(projectResult?.count ?? 0),
      agentCount: Number(agentResult?.count ?? 0),
    };
  }
}

export const storage = new DatabaseStorage();
