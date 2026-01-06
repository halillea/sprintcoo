import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { findFolder, findFileInFolder, getFileContent, listFilesInFolder } from "./google-drive";

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Helper to get user ID from request
function getUserId(req: any): string {
  return req.user?.claims?.sub || "anonymous";
}

// Seed database with example data
async function seedDatabase() {
  try {
    const demoUserId = "demo-user";
    
    // Check if we already have projects
    const existingProjects = await storage.getProjects(demoUserId);
    if (existingProjects.length > 0) return;

    // Create demo projects
    const saasbizzProject = await storage.createProject({
      userId: demoUserId,
      name: "SaasBizz.com",
      description: "Generate descriptions for each startup listed in the directory",
      status: "active",
    });

    const saasitronProject = await storage.createProject({
      userId: demoUserId,
      name: "Saasitron.com",
      description: "Generate full webpages for each boilerplate listed",
      status: "active",
    });

    const hostipediaProject = await storage.createProject({
      userId: demoUserId,
      name: "Hostipedia.com",
      description: "Generate top 10 hosting reviews pages",
      status: "active",
    });

    // Create demo tasks
    await storage.createTask({
      userId: demoUserId,
      projectId: saasbizzProject.id,
      title: "Generate startup descriptions from website scraping",
      description: "Website scraping from the main domain startup is the source of truth. Description should not be longer than 500 words.",
      category: "auto_execute",
      status: "pending",
      priority: "high",
    });

    await storage.createTask({
      userId: demoUserId,
      projectId: saasitronProject.id,
      title: "Generate HTML pages for boilerplates",
      description: "Generate .html file for each entry, SEO optimized. Put all files into a folder named boilerplates.",
      category: "delegate_agent",
      status: "in_progress",
      priority: "medium",
    });

    await storage.createTask({
      userId: demoUserId,
      projectId: hostipediaProject.id,
      title: "Generate top 10 hosting reviews",
      description: "Extract content for each hosting from 3 different sources, generate unique article.",
      category: "human_required",
      status: "pending",
      priority: "urgent",
    });

    await storage.createTask({
      userId: demoUserId,
      projectId: null,
      title: "Review content strategy document",
      description: "CEO needs to approve the Q1 content calendar",
      category: "human_required",
      status: "pending",
      priority: "high",
    });

    // Create demo agents
    await storage.createAgent({
      userId: demoUserId,
      name: "Content Writer",
      description: "Generates high-quality content based on source materials",
      type: "prompt",
      createdBy: "digital_coo",
      prompt: "You are an expert content writer. Given source material, create engaging, SEO-optimized content.",
      readme: "# Content Writer Agent\n\nThis agent generates content from source materials.\n\n## Usage\nProvide source URLs or text, and specify the desired output format.",
    });

    await storage.createAgent({
      userId: demoUserId,
      name: "Web Scraper",
      description: "Extracts information from websites",
      type: "script",
      createdBy: "digital_coo",
      script: "// Node.js scraping script\nconst scrape = async (url) => { /* scraping logic */ };",
      readme: "# Web Scraper Agent\n\nThis agent scrapes websites for information.\n\n## Requirements\n- Node.js 18+\n- cheerio package",
    });

    // Create demo activity logs
    await storage.createActivityLog({
      userId: demoUserId,
      action: "task_created",
      description: "Digital COO triaged new tasks from tasks-urgent-06jan.txt",
      entityType: "task",
    });

    await storage.createActivityLog({
      userId: demoUserId,
      action: "agent_created",
      description: "Created Content Writer agent for content generation tasks",
      entityType: "agent",
    });

    await storage.createActivityLog({
      userId: demoUserId,
      action: "task_completed",
      description: "Completed: Generate startup descriptions for SaasBizz.com",
      entityType: "task",
    });

    // Create demo notifications
    await storage.createNotification({
      userId: demoUserId,
      type: "action_required",
      title: "Human Decision Needed",
      message: "3 tasks require your attention before proceeding",
    });

    await storage.createNotification({
      userId: demoUserId,
      type: "info",
      title: "Tasks Imported",
      message: "Successfully imported 6 tasks from tasks-urgent-06jan.txt",
    });

    console.log("Database seeded with demo data");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed database on startup
  seedDatabase();

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  app.get(api.dashboard.stats.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get(api.dashboard.recentActivity.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const activity = await storage.getRecentActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get(api.dashboard.urgentTasks.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const tasks = await storage.getUrgentTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching urgent tasks:", error);
      res.status(500).json({ message: "Failed to fetch urgent tasks" });
    }
  });

  // ============================================
  // PROJECTS ENDPOINTS
  // ============================================
  app.get(api.projects.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get(api.projects.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post(api.projects.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.projects.create.input.parse({ ...req.body, userId });
      const project = await storage.createProject(input);
      
      await storage.createActivityLog({
        userId,
        action: "project_created",
        description: `Created project: ${project.name}`,
        entityType: "project",
        entityId: project.id,
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join(".") });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put(api.projects.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(id, input);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete(api.projects.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // ============================================
  // TASKS ENDPOINTS
  // ============================================
  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const filters = {
        projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
      };
      const tasks = await storage.getTasks(userId, filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get(api.tasks.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tasks.create.input.parse({ ...req.body, userId });
      const task = await storage.createTask(input);
      
      await storage.createActivityLog({
        userId,
        action: "task_created",
        description: `Created task: ${task.title}`,
        entityType: "task",
        entityId: task.id,
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join(".") });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put(api.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(id, input);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete(api.tasks.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task Triage - Uses AI to categorize task
  app.post(api.tasks.triage.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Use Claude to triage the task
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a Digital COO assistant. Analyze this task and determine the best category:

Task Title: ${task.title}
Task Description: ${task.description || "No description"}

Categories:
1. auto_execute - Tasks that can be automated (content generation, web scraping, file processing)
2. delegate_agent - Tasks that need a specialized agent (complex content, multi-step processes)
3. human_required - Tasks that need human judgment or decision-making

Respond with JSON only:
{
  "category": "auto_execute" | "delegate_agent" | "human_required",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggestedAgent": "optional agent name if delegate_agent"
}`
        }]
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const result = JSON.parse(responseText);

      // Update task with triage result
      await storage.updateTask(id, { category: result.category });

      res.json(result);
    } catch (error) {
      console.error("Error triaging task:", error);
      res.status(500).json({ message: "Failed to triage task" });
    }
  });

  // Task Execute - Attempts to execute an auto_execute task
  app.post(api.tasks.execute.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const userId = getUserId(req);
      await storage.updateTask(id, { status: "in_progress" });

      // Use Gemini to execute the task
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Execute this task and provide the result:

Task: ${task.title}
Description: ${task.description || "No description"}

Provide a detailed execution result.`
      });

      const result = response.text || "Task executed successfully";

      await storage.updateTask(id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      await storage.createActivityLog({
        userId,
        action: "task_completed",
        description: `Completed task: ${task.title}`,
        entityType: "task",
        entityId: task.id,
      });

      res.json({ success: true, result });
    } catch (error) {
      console.error("Error executing task:", error);
      const id = parseInt(req.params.id);
      await storage.updateTask(id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      res.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // ============================================
  // AGENTS ENDPOINTS
  // ============================================
  app.get(api.agents.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const agents = await storage.getAgents(userId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get(api.agents.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post(api.agents.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.agents.create.input.parse({ ...req.body, userId });
      const agent = await storage.createAgent(input);
      
      await storage.createActivityLog({
        userId,
        action: "agent_created",
        description: `Created agent: ${agent.name}`,
        entityType: "agent",
        entityId: agent.id,
      });
      
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join(".") });
      }
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put(api.agents.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.agents.update.input.parse(req.body);
      const agent = await storage.updateAgent(id, input);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete(api.agents.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // ============================================
  // FILES ENDPOINTS
  // ============================================
  app.get(api.files.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const filters = {
        projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
        type: req.query.type as string | undefined,
        isMasterDocument: req.query.isMasterDocument === "true",
      };
      const files = await storage.getFiles(userId, filters);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get(api.files.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.patch(api.files.markAsMaster.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isMasterDocument } = req.body;
      const file = await storage.updateFile(id, { isMasterDocument });
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.post(api.files.generatePosts.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const platforms = ["x", "facebook", "linkedin", "instagram", "tiktok_script", "youtube_script"];
      const posts = [];

      for (const platform of platforms) {
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Generate a ${platform} post based on this content:

${file.content || file.name}

Requirements:
- ${platform === "x" ? "Max 280 characters, engaging, use relevant hashtags" : ""}
- ${platform === "facebook" ? "Engaging, shareable, medium length" : ""}
- ${platform === "linkedin" ? "Professional tone, industry insights" : ""}
- ${platform === "instagram" ? "Visual-focused, use emojis sparingly, include hashtags" : ""}
- ${platform === "tiktok_script" ? "Short video script, hook in first 3 seconds" : ""}
- ${platform === "youtube_script" ? "Full video script with intro, body, CTA" : ""}

Return only the post content, no explanations.`
        });

        const post = await storage.createSocialPost({
          userId,
          masterDocumentId: id,
          platform,
          content: response.text || "",
          status: "draft",
        });
        posts.push(post);
      }

      res.json(posts);
    } catch (error) {
      console.error("Error generating posts:", error);
      res.status(500).json({ message: "Failed to generate posts" });
    }
  });

  app.delete(api.files.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFile(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // ============================================
  // NOTIFICATIONS ENDPOINTS
  // ============================================
  app.get(api.notifications.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch(api.notifications.markRead.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.post(api.notifications.markAllRead.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const updated = await storage.markAllNotificationsRead(userId);
      res.json({ updated });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all notifications read" });
    }
  });

  // ============================================
  // TEAM ENDPOINTS
  // ============================================
  app.get(api.team.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const team = await storage.getTeamMembers(userId);
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post(api.team.invite.path, isAuthenticated, async (req, res) => {
    try {
      const ownerId = getUserId(req);
      const input = api.team.invite.input.parse({ ...req.body, ownerId });
      const member = await storage.createTeamMember(input);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join(".") });
      }
      console.error("Error inviting team member:", error);
      res.status(500).json({ message: "Failed to invite team member" });
    }
  });

  app.delete(api.team.remove.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeamMember(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // ============================================
  // DEMO MODE - For testing without full OAuth
  // ============================================
  const DEMO_USER_ID = "demo-user-testing";
  
  // Demo login - creates a fake session for testing
  app.get("/api/demo/login", async (req, res) => {
    // Create a demo user object that mimics the real auth structure
    const demoUser = {
      claims: { sub: DEMO_USER_ID },
      expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    };
    
    // Log in the demo user
    req.login(demoUser, (err) => {
      if (err) {
        console.error("Demo login error:", err);
        return res.status(500).json({ message: "Demo login failed" });
      }
      res.redirect("/");
    });
  });
  
  // Seed demo user data
  app.post("/api/demo/seed", async (req, res) => {
    try {
      // Create a demo user in the database if it doesn't exist
      const existingProjects = await storage.getProjects(DEMO_USER_ID);
      if (existingProjects.length === 0) {
        // The seed function uses demo-user, let's update it
        await storage.createProject({
          userId: DEMO_USER_ID,
          name: "Demo Project",
          description: "A demo project for testing",
          status: "active",
        });
      }
      res.json({ message: "Demo data seeded" });
    } catch (error) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({ message: "Failed to seed demo data" });
    }
  });

  // ============================================
  // GOOGLE DRIVE ENDPOINTS
  // ============================================
  app.get("/api/drive/folders/:name", isAuthenticated, async (req, res) => {
    try {
      const folderName = req.params.name;
      const folderId = await findFolder(folderName);
      if (!folderId) {
        return res.status(404).json({ message: `Folder '${folderName}' not found` });
      }
      const files = await listFilesInFolder(folderId);
      res.json({ folderId, files });
    } catch (error) {
      console.error("Error listing folder:", error);
      res.status(500).json({ message: "Failed to access Google Drive" });
    }
  });

  app.post("/api/drive/import-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { folderName, fileName } = req.body;

      // Find folder
      const folderId = await findFolder(folderName);
      if (!folderId) {
        return res.status(404).json({ message: `Folder '${folderName}' not found` });
      }

      // Find file
      const file = await findFileInFolder(folderId, fileName);
      if (!file) {
        return res.status(404).json({ message: `File '${fileName}' not found in folder` });
      }

      // Get file content
      const content = await getFileContent(file.id);
      console.log("File content:", content);

      // Save file to database
      const savedFile = await storage.createFile({
        userId,
        name: fileName,
        source: "google_drive",
        googleDriveId: file.id,
        content,
        type: "input",
      });

      // Use Claude to parse tasks from the content
      const parseResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `Parse the following task file and extract individual tasks. For each task, identify:
1. The task title/name
2. A description if available
3. Priority (urgent/high/medium/low) based on context
4. Related project name if mentioned

Task file content:
${content}

Respond with JSON only:
{
  "tasks": [
    {
      "title": "task title",
      "description": "task description",
      "priority": "high|medium|low|urgent",
      "projectName": "project name if mentioned or null"
    }
  ]
}`
        }]
      });

      const responseText = parseResponse.content[0].type === "text" ? parseResponse.content[0].text : "";
      const parsed = JSON.parse(responseText);

      // Create tasks from parsed content
      const createdTasks = [];
      for (const taskData of parsed.tasks) {
        // Try to find matching project
        let projectId: number | null = null;
        if (taskData.projectName) {
          const projects = await storage.getProjects(userId);
          const matchingProject = projects.find(p => 
            p.name.toLowerCase().includes(taskData.projectName.toLowerCase())
          );
          if (matchingProject) projectId = matchingProject.id;
        }

        const task = await storage.createTask({
          userId,
          projectId,
          title: taskData.title,
          description: taskData.description || null,
          priority: taskData.priority || "medium",
          category: "pending",
          status: "pending",
          sourceFile: fileName,
        });

        // Triage task with Claude
        try {
          const triageResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{
              role: "user",
              content: `You are a Digital COO. Analyze this task and categorize it:

Task: ${task.title}
Description: ${task.description || "No description"}

Categories:
1. auto_execute - Simple tasks that can be automated (content generation, file processing)
2. delegate_agent - Complex tasks needing specialized agents
3. human_required - Tasks needing human judgment/decision

Respond with JSON only:
{"category": "auto_execute" | "delegate_agent" | "human_required", "reasoning": "brief explanation"}`
            }]
          });

          const triageText = triageResponse.content[0].type === "text" ? triageResponse.content[0].text : "";
          const triageResult = JSON.parse(triageText);
          await storage.updateTask(task.id, { category: triageResult.category });
          task.category = triageResult.category;
        } catch (triageError) {
          console.error("Error triaging task:", triageError);
        }

        createdTasks.push(task);
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "file_processed",
        description: `Imported ${createdTasks.length} tasks from ${fileName}`,
        entityType: "file",
        entityId: savedFile.id,
      });

      // Create notification
      await storage.createNotification({
        userId,
        type: "info",
        title: "Tasks Imported",
        message: `Successfully imported ${createdTasks.length} tasks from ${fileName}`,
      });

      res.json({
        file: savedFile,
        tasks: createdTasks,
        summary: {
          total: createdTasks.length,
          autoExecute: createdTasks.filter(t => t.category === "auto_execute").length,
          delegated: createdTasks.filter(t => t.category === "delegate_agent").length,
          humanRequired: createdTasks.filter(t => t.category === "human_required").length,
        }
      });
    } catch (error) {
      console.error("Error importing tasks from Drive:", error);
      res.status(500).json({ message: "Failed to import tasks from Google Drive" });
    }
  });

  return httpServer;
}
