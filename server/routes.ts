import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendVerificationEmail } from './emailService';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';
import { ObjectPermission } from './objectAcl.js';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Custom email verification endpoint
  app.post("/api/send-verification-email", async (req, res) => {
    try {
      const { email, userName, userId } = req.body;
      
      if (!email || !userName || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate custom verification link that directs to SoarTV
      const verificationLink = `${req.protocol}://${req.get('host')}/login?verify=true&welcome=true`;
      
      // Send beautiful SoarTV email
      const emailSent = await sendVerificationEmail({
        to: email,
        userName,
        verificationLink
      });
      
      if (emailSent) {
        res.json({ success: true, message: 'Custom SoarTV verification email sent!' });
      } else {
        res.status(500).json({ error: 'Failed to send email - will use Firebase fallback' });
      }
    } catch (error) {
      console.error('Email API error:', error);
      res.status(500).json({ error: 'Email service error' });
    }
  });
  // Get all videos
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get videos by category
  app.get("/api/videos/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const videos = await storage.getVideosByCategory(category);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos by category" });
    }
  });

  // Get single video
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Object Storage Routes for Replit App Storage
  
  // Get upload URL for video files
  app.post("/api/objects/upload", async (req, res) => {
    try {
      console.log('🔗 Getting upload URL for video file...');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('✅ Upload URL generated:', uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error('❌ Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Serve uploaded video files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Store uploaded projects (persistent file-based storage when Firebase fails)
  const PROJECTS_FILE = '/tmp/replit_projects.json';
  
  // Load existing projects from file
  const loadProjects = (): Map<string, any[]> => {
    try {
      if (fs.existsSync(PROJECTS_FILE)) {
        const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
        const projectsObj = JSON.parse(data);
        const loadedMap = new Map(Object.entries(projectsObj));
        console.log(`📂 Loaded ${loadedMap.size} users with projects from persistent storage`);
        return loadedMap;
      }
    } catch (error) {
      console.warn('⚠️ Could not load projects file, starting fresh:', error);
    }
    return new Map<string, any[]>();
  };
  
  // Save projects to file
  const saveProjects = (projects: Map<string, any[]>) => {
    try {
      const projectsObj = Object.fromEntries(projects);
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsObj, null, 2));
      console.log('💾 Projects saved to persistent storage');
    } catch (error) {
      console.warn('⚠️ Could not save projects file:', error);
    }
  };
  
  const uploadedProjects = loadProjects();

  // Update project with uploaded file URL (simplified for video uploads)
  app.put("/api/projects/upload", async (req, res) => {
    try {
      const { videoURL, title, description, userId } = req.body;
      
      if (!videoURL || !title || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log('📝 Saving uploaded project:', { title, videoURL, userId });
      
      // Create project object for storage
      const project = {
        id: `replit_${Date.now()}`, // Unique ID for Replit projects
        title,
        description: description || '',
        uploadedBy: userId,
        videoURL,
        createdAt: new Date().toISOString(),
        visibility: 'public',
        tags: [],
        cast: [],
        crew: [],
        source: 'replit_storage' // Mark as Replit App Storage project
      };

      // Store in memory as Firebase fallback
      if (!uploadedProjects.has(userId)) {
        uploadedProjects.set(userId, []);
      }
      uploadedProjects.get(userId)!.push(project);

      // Save to persistent file
      saveProjects(uploadedProjects);

      console.log('✅ Project saved to Replit backend storage (persistent)');
      res.json({ success: true, project });
    } catch (error) {
      console.error('❌ Error saving uploaded project:', error);
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  // Get user projects from Replit storage (fallback for Firebase)
  app.get("/api/projects/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userProjects = uploadedProjects.get(userId) || [];
      
      console.log(`📂 Retrieved ${userProjects.length} projects for user ${userId}`);
      res.json(userProjects);
    } catch (error) {
      console.error('❌ Error retrieving user projects:', error);
      res.status(500).json({ error: 'Failed to retrieve projects' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
