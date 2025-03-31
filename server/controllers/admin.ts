import type { Request, Response } from "express";
import { storage } from "../storage";

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: Function) {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
  }
  
  storage.getUser(userId).then(user => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bu işlem için yönetici yetkisine sahip olmalısınız" });
    }
    next();
  }).catch(() => {
    return res.status(500).json({ message: "Kullanıcı bilgileri kontrol edilirken bir hata oluştu" });
  });
}

// Get admin dashboard overview statistics
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userCount = await storage.getUserCount();
    const videoCount = await storage.getVideoCount();
    const revenueTotal = await storage.getRevenueTotal();
    
    return res.status(200).json({
      userCount,
      videoCount,
      revenueTotal,
    });
  } catch (error) {
    return res.status(500).json({ message: "İstatistikler alınırken bir hata oluştu" });
  }
}

// Get all users (admin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllUsers();
    
    // Exclude passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    return res.status(500).json({ message: "Kullanıcılar alınırken bir hata oluştu" });
  }
}

// Get all videos (admin only)
export async function getAllVideos(req: Request, res: Response) {
  try {
    const videos = await storage.getAllVideos();
    return res.status(200).json(videos);
  } catch (error) {
    return res.status(500).json({ message: "Videolar alınırken bir hata oluştu" });
  }
}

// Update user role (admin only)
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
    }
    
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "Geçersiz rol. Rol 'admin' veya 'user' olmalıdır" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    const updatedUser = await storage.updateUser(userId, { role });
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Kullanıcı rolü güncellenirken bir hata oluştu" });
    }
    
    // Exclude password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      user: userWithoutPassword,
      message: `Kullanıcı rolü ${role} olarak güncellendi`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Kullanıcı rolü güncellenirken bir hata oluştu" });
  }
}

// Ban user (admin only)
export async function banUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
    }
    
    // In a real app, we might set a "banned" flag on the user
    // For this demo, we'll delete the user's subscription
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Don't allow banning other admins
    if (user.role === "admin") {
      return res.status(403).json({ message: "Yönetici kullanıcılar yasaklanamaz" });
    }
    
    const subscription = await storage.getUserSubscription(userId);
    
    if (subscription) {
      await storage.updateSubscription(subscription.id, { active: false });
    }
    
    return res.status(200).json({
      message: `Kullanıcı ${userId} yasaklandı ve aboneliği iptal edildi`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Kullanıcı yasaklanırken bir hata oluştu" });
  }
}
