import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

// Register schema with additional validations
const registerSchema = insertUserSchema.extend({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  displayName: z.string().optional(),
});

// Social login schema
const socialLoginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  username: z.string().optional(),
  authProvider: z.string(),
  providerId: z.string(),
  profileImageUrl: z.string().optional(),
});

export async function registerUser(req: Request, res: Response) {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor" });
    }
    
    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }
    
    // In a real app, we would hash the password here
    const user = await storage.createUser(userData);
    
    // Exclude password from response
    const { password, ...userResponse } = user;
    
    // Create free subscription for new user
    const freePlan = (await storage.getAllSubscriptionPlans())[0];
    if (freePlan) {
      await storage.createSubscription({
        userId: user.id,
        planId: freePlan.id,
        startDate: new Date(),
        active: true,
      });
    }
    
    return res.status(201).json(userResponse);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    return res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Hatalı e-posta veya şifre" });
    }
    
    // In a real app, we would verify the password hash here
    // For demo purposes, we're comparing plaintext passwords
    
    // Exclude password from response
    const { password: userPassword, ...userResponse } = user;
    
    req.session.userId = user.id;
    
    return res.status(200).json(userResponse);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
  }
}

export async function socialLogin(req: Request, res: Response) {
  try {
    const userData = socialLoginSchema.parse(req.body);
    const { authProvider, providerId } = userData;
    
    // Check if user exists by provider id
    let user = await storage.getUserByProviderId(authProvider, providerId);
    
    if (!user) {
      // Check if email already exists
      user = await storage.getUserByEmail(userData.email);
      
      if (user) {
        // Update existing user with provider details
        user = await storage.updateUser(user.id, {
          authProvider,
          providerId,
          profileImageUrl: userData.profileImageUrl,
        });
      } else {
        // Create new user
        // Generate a username if not provided
        if (!userData.username) {
          userData.username = `user_${Date.now()}`;
        }
        
        // Create user without password for social logins
        user = await storage.createUser({
          ...userData,
          password: null,
        });
        
        // Create free subscription for new user
        const freePlan = (await storage.getAllSubscriptionPlans())[0];
        if (freePlan) {
          await storage.createSubscription({
            userId: user.id,
            planId: freePlan.id,
            startDate: new Date(),
            active: true,
          });
        }
      }
    }
    
    // Exclude password from response
    const { password, ...userResponse } = user;
    
    req.session.userId = user.id;
    
    return res.status(200).json(userResponse);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    return res.status(500).json({ message: "Sosyal giriş sırasında bir hata oluştu" });
  }
}

export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Çıkış sırasında bir hata oluştu" });
    }
    
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Başarıyla çıkış yapıldı" });
  });
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Giriş yapılmamış" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Get user's subscription
    const subscription = await storage.getUserSubscription(user.id);
    let plan = null;
    
    if (subscription) {
      plan = await storage.getSubscriptionPlan(subscription.planId);
    }
    
    // Exclude password from response
    const { password, ...userResponse } = user;
    
    return res.status(200).json({
      user: userResponse,
      subscription: subscription || null,
      plan: plan || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Kullanıcı bilgileri alınırken bir hata oluştu" });
  }
}
