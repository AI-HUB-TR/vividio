import { 
  users, type User, type InsertUser,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptions, type Subscription, type InsertSubscription,
  videos, type Video, type InsertVideo,
  dailyUsage, type DailyUsage, type InsertDailyUsage
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Subscription plan operations
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  
  // User subscription operations
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getUserVideos(userId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  getAllVideos(): Promise<Video[]>;
  
  // Daily usage operations
  getDailyUsage(userId: number, date: Date): Promise<DailyUsage | undefined>;
  incrementDailyUsage(userId: number): Promise<DailyUsage>;
  
  // Admin operations
  getUserCount(): Promise<number>;
  getVideoCount(): Promise<number>;
  getRevenueTotal(): Promise<number>;
}

// In-memory implementation of storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private subscriptions: Map<number, Subscription>;
  private videos: Map<number, Video>;
  private dailyUsage: Map<string, DailyUsage>;
  
  private userId: number;
  private subscriptionPlanId: number;
  private subscriptionId: number;
  private videoId: number;
  private dailyUsageId: number;
  
  constructor() {
    this.users = new Map();
    this.subscriptionPlans = new Map();
    this.subscriptions = new Map();
    this.videos = new Map();
    this.dailyUsage = new Map();
    
    this.userId = 1;
    this.subscriptionPlanId = 1;
    this.subscriptionId = 1;
    this.videoId = 1;
    this.dailyUsageId = 1;
    
    // Initialize with default subscription plans
    this.initSubscriptionPlans();
  }
  
  // Initialize default subscription plans
  private initSubscriptionPlans() {
    const freePlan: InsertSubscriptionPlan = {
      name: "Ücretsiz",
      priceMonthly: 0,
      dailyVideoLimit: 2,
      durationLimit: 60, // 1 minute in seconds
      resolution: "720p",
      hasWatermark: true,
      customAiModels: false,
    };
    
    const proPlan: InsertSubscriptionPlan = {
      name: "Pro",
      priceMonthly: 99,
      dailyVideoLimit: 10,
      durationLimit: 180, // 3 minutes in seconds
      resolution: "1080p",
      hasWatermark: false,
      customAiModels: true,
    };
    
    const businessPlan: InsertSubscriptionPlan = {
      name: "Business",
      priceMonthly: 299,
      dailyVideoLimit: 50,
      durationLimit: 300, // 5 minutes in seconds
      resolution: "4K",
      hasWatermark: false,
      customAiModels: true,
    };
    
    this.createSubscriptionPlan(freePlan);
    this.createSubscriptionPlan(proPlan);
    this.createSubscriptionPlan(businessPlan);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.authProvider === provider && user.providerId === providerId
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now, role: "user" };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Subscription plan operations
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }
  
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanId++;
    const subscriptionPlan: SubscriptionPlan = { ...plan, id };
    this.subscriptionPlans.set(id, subscriptionPlan);
    return subscriptionPlan;
  }
  
  // Subscription operations
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && sub.active
    );
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionId++;
    const newSubscription: Subscription = { ...subscription, id };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...subscriptionData };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async getUserVideos(userId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter((video) => video.userId === userId)
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
  }
  
  async createVideo(video: InsertVideo): Promise<Video> {
    const id = this.videoId++;
    const now = new Date();
    const newVideo: Video = { 
      ...video, 
      id, 
      createdAt: now, 
      status: "processing",
      videoUrl: null,
      thumbnailUrl: null
    };
    
    this.videos.set(id, newVideo);
    return newVideo;
  }
  
  async updateVideo(id: number, videoData: Partial<Video>): Promise<Video | undefined> {
    const video = await this.getVideo(id);
    if (!video) return undefined;
    
    const updatedVideo = { ...video, ...videoData };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }
  
  async deleteVideo(id: number): Promise<boolean> {
    return this.videos.delete(id);
  }
  
  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values())
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
  }
  
  // Daily usage operations
  async getDailyUsage(userId: number, date: Date): Promise<DailyUsage | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${userId}-${dateStr}`;
    return this.dailyUsage.get(key);
  }
  
  async incrementDailyUsage(userId: number): Promise<DailyUsage> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const key = `${userId}-${dateStr}`;
    
    let usage = this.dailyUsage.get(key);
    
    if (usage) {
      usage.videosCreated += 1;
      this.dailyUsage.set(key, usage);
    } else {
      const id = this.dailyUsageId++;
      usage = {
        id,
        userId,
        date: today,
        videosCreated: 1
      };
      this.dailyUsage.set(key, usage);
    }
    
    return usage;
  }
  
  // Admin statistics
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async getVideoCount(): Promise<number> {
    return this.videos.size;
  }
  
  async getRevenueTotal(): Promise<number> {
    let total = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.active) {
        const plan = await this.getSubscriptionPlan(sub.planId);
        if (plan) {
          total += plan.priceMonthly;
        }
      }
    }
    return total;
  }
}

export const storage = new MemStorage();
