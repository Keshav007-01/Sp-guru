import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerYoutubeRoutes } from "./youtube-audio";
import path from "path";

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        displayName?: string;
        email: string;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to convert string to slug
  function createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  
  // Register YouTube audio routes
  registerYoutubeRoutes(app);
  
  // API routes
  
  // Get all deities
  app.get("/api/deities", async (_req: Request, res: Response) => {
    try {
      const deities = await storage.getDeities();
      res.json(deities);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching deities",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get a specific deity with mantras
  app.get("/api/deities/:deityId", async (req: Request, res: Response) => {
    try {
      const deityId = req.params.deityId;
      const deity = await storage.getDeityWithMantras(deityId);
      
      if (!deity) {
        return res.status(404).json({ message: "Deity not found" });
      }
      
      res.json(deity);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching deity",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get mantras for a specific deity
  app.get("/api/mantras/:deityId", async (req: Request, res: Response) => {
    try {
      const deityId = req.params.deityId;
      const mantras = await storage.getMantras(deityId);
      res.json(mantras);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching mantras",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get a specific mantra
  app.get("/api/mantras/:deityId/:mantraId", async (req: Request, res: Response) => {
    try {
      const mantraId = req.params.mantraId;
      const mantra = await storage.getMantra(mantraId);
      
      if (!mantra) {
        return res.status(404).json({ message: "Mantra not found" });
      }
      
      res.json(mantra);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching mantra",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get chanting data (mantra with deity info)
  app.get("/api/chant/:deityId/:mantraId", async (req: Request, res: Response) => {
    try {
      const mantraId = req.params.mantraId;
      const chantData = await storage.getMantraWithDeity(mantraId);
      
      if (!chantData) {
        return res.status(404).json({ message: "Chanting data not found" });
      }
      
      res.json(chantData);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching chanting data",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get featured mantra
  app.get("/api/featured-mantra", async (_req: Request, res: Response) => {
    try {
      const featuredMantra = await storage.getFeaturedMantra();
      
      if (!featuredMantra) {
        return res.status(404).json({ message: "Featured mantra not found" });
      }
      
      res.json(featuredMantra);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching featured mantra",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get AdSense publisher ID
  app.get("/api/adsense-config", (_req: Request, res: Response) => {
    try {
      const publisherId = process.env.GOOGLE_ADSENSE_PUBLISHER_ID || '';
      res.json({ publisherId });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching AdSense configuration",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // Create a dummy user for testing purposes
    if (!req.user) {
      req.user = {
        id: 1,
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com"
      };
    }
    next();
  };
  
  // User Favorites API endpoints
  
  // Get user's favorite mantras
  app.get("/api/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching user favorites",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Add a mantra to favorites
  app.post("/api/favorites/:mantraId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const mantraId = req.params.mantraId;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const favorite = await storage.addFavorite(userId, mantraId);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ 
        message: "Error adding favorite",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Remove a mantra from favorites
  app.delete("/api/favorites/:mantraId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const mantraId = req.params.mantraId;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const success = await storage.removeFavorite(userId, mantraId);
      
      if (success) {
        res.status(200).json({ message: "Favorite removed successfully" });
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error removing favorite",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get user profile with favorite mantras
  app.get("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      const favorites = await storage.getUserFavorites(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      res.json({
        profile,
        favorites
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching user profile",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Blog API endpoints
  
  // Get all blog posts (optionally filtered by category)
  app.get("/api/blog-posts", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const category = req.query.category as string | undefined;
      
      const posts = await storage.getBlogPosts(limit, category);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching blog posts",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get a specific blog post by slug
  app.get("/api/blog-posts/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Increment view count
      await storage.incrementBlogPostViewCount(post.id);
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching blog post",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Add a new blog post (admin only in production)
  app.post("/api/blog-posts", async (req: Request, res: Response) => {
    try {
      const postData = req.body;
      
      // Ensure slug is created if not provided
      if (!postData.slug) {
        postData.slug = createSlug(postData.title);
      }
      
      const post = await storage.addBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating blog post",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Update an existing blog post (admin only in production)
  app.put("/api/blog-posts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const postData = req.body;
      
      const post = await storage.updateBlogPost(id, postData);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating blog post",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
