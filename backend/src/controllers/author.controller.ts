import { Request, Response } from "express";
import { getMySQLDatabase } from "../config/database";
import { logger } from "../utils/logger";
import jwt from "jsonwebtoken";

const extractUserIdFromRequest = (req: Request): string | null => {
  try {
    const maybeUser = (req as any).user;
    if (maybeUser) {
      if (typeof maybeUser === "string") return maybeUser;
      const id =
        maybeUser.id ||
        maybeUser._id ||
        maybeUser.userId ||
        maybeUser.user_id ||
        maybeUser.uid;
      if (id) return String(id);
    }
    const headerUserId = (req.headers["x-user-id"] || req.headers["x_user_id"]) as string | undefined;
    if (headerUserId) return headerUserId;
    if ((req as any).body?.userId) return String((req as any).body.userId);
    if ((req as any).body?.id) return String((req as any).body.id);
    if ((req as any).query?.userId) return String((req as any).query.userId);
    if ((req as any).query?.id) return String((req as any).query.id);
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === "string") {
      const m = authHeader.match(/Bearer\s+(.+)/i);
      const token = m ? m[1] : authHeader;
      if (token) {
        try {
          const decoded: any = jwt.decode(token, { json: true });
          if (decoded) {
            const extracted =
              decoded.sub ||
              decoded.user_id ||
              decoded.uid ||
              decoded.id ||
              decoded.email;
            if (extracted) return String(extracted);
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
};

const buildGuestProfile = () => {
  const now = new Date().toISOString();
  return {
    id: "guest",
    email: "guest@local.dev",
    role: "guest",
    name: "Guest Author",
    photo: "https://via.placeholder.com/150/6d28d9/ffffff?text=Guest",
    location: "",
    bio: "",
    legalName: "",
    qualifications: "",
    specialty: "",
    tags: [],
    socialLinks: {},
    payoutDetails: {},
    isVerified: false,
    joinedDate: now,
    stats: {
      articles: 0,
      views: 0,
      certificates: 0,
      earnings: 0,
      monthlyEarnings: 0,
      rank: 0,
    },
    membership: {
      planName: "Free Plan",
      priceMonthly: 0,
      status: "free",
      endDate: null,
      features: [],
    },
  };
};

export const getAuthorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    const userId = extractUserIdFromRequest(req);
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        const profile = buildGuestProfile();
        res.json({ success: true, profile });
        return;
      }
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User ID not found in request. Ensure authentication middleware runs or provide a valid token.",
      });
      return;
    }
    const [userRows]: any = await db.execute("SELECT id, email, name, role FROM users WHERE id = ?", [userId]);
    if (!Array.isArray(userRows) || userRows.length === 0) {
      res.status(404).json({ success: false, error: "User not found", message: "User does not exist in database" });
      return;
    }
    const user = userRows[0];
    const [authorRows]: any = await db.execute(
      `SELECT a.*, 
              COALESCE(a.display_name, u.name) as display_name,
              COALESCE(a.profile_photo_url, 'https://via.placeholder.com/150/6d28d9/ffffff?text=Author') as profile_photo
       FROM authors a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.user_id = ?`,
      [userId]
    );
    let authorProfile: any = null;
    if (!Array.isArray(authorRows) || authorRows.length === 0) {
      try {
        await db.execute(
          "INSERT INTO authors (user_id, display_name, tags, social_links, payout_details) VALUES (?, ?, ?, ?, ?)",
          [userId, user.name || "", JSON.stringify([]), JSON.stringify({}), JSON.stringify({})]
        );
        authorProfile = {
          display_name: user.name || "",
          profile_photo_url: "https://via.placeholder.com/150/6d28d9/ffffff?text=Author",
          location: "",
          bio: "",
          legal_name: user.name || "",
          qualifications: "",
          specialty: "",
          tags: "[]",
          social_links: "{}",
          payout_details: "{}",
          is_verified: false,
          joined_date: new Date().toISOString(),
        };
      } catch {
        authorProfile = {
          display_name: user.name || "",
          profile_photo_url: "https://via.placeholder.com/150/6d28d9/ffffff?text=Author",
          location: "",
          bio: "",
          legal_name: user.name || "",
          qualifications: "",
          specialty: "",
          tags: "[]",
          social_links: "{}",
          payout_details: "{}",
          is_verified: false,
          joined_date: new Date().toISOString(),
        };
      }
    } else {
      authorProfile = authorRows[0];
    }
    let statsRows: any[] = [];
    try {
      [statsRows] = await db.execute(
        `SELECT as.* 
         FROM author_stats as
         INNER JOIN authors a ON as.author_id = a.id
         WHERE a.user_id = ?`,
        [userId]
      );
    } catch {
      statsRows = [];
    }
    let membership = null;
    try {
      membership = await getCurrentSubscriptionInternal(userId);
    } catch {
      membership = {
        planName: "Free Plan",
        priceMonthly: 0,
        status: "free",
        endDate: null,
        features: [],
      };
    }
    const parseJSONSafe = (jsonString: string | null) => {
      if (!jsonString || jsonString === "null" || jsonString === "NULL") return null;
      try {
        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    };
    const joinedDate = authorProfile.joined_date || new Date().toISOString();
    const profile = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: authorProfile.display_name || user.name || "",
      photo: authorProfile.profile_photo_url || "https://via.placeholder.com/150/6d28d9/ffffff?text=Author",
      location: authorProfile.location || "",
      bio: authorProfile.bio || "",
      legalName: authorProfile.legal_name || user.name || "",
      qualifications: authorProfile.qualifications || "",
      specialty: authorProfile.specialty || "",
      tags: parseJSONSafe(authorProfile.tags) || [],
      socialLinks: parseJSONSafe(authorProfile.social_links) || {},
      payoutDetails: parseJSONSafe(authorProfile.payout_details) || {},
      isVerified: authorProfile.is_verified || false,
      joinedDate,
      stats:
        statsRows.length > 0
          ? {
              articles: statsRows[0].articles_published || 0,
              views: statsRows[0].total_views || 0,
              certificates: statsRows[0].certificates_earned || 0,
              earnings: statsRows[0].total_earnings || 0,
              monthlyEarnings: statsRows[0].monthly_earnings || 0,
              rank: statsRows[0].author_rank || 0,
            }
          : {
              articles: 0,
              views: 0,
              certificates: 0,
              earnings: 0,
              monthlyEarnings: 0,
              rank: 0,
            },
      membership: membership || {
        planName: "Free Plan",
        priceMonthly: 0,
        status: "free",
        endDate: null,
        features: [],
      },
    };
    res.json({ success: true, profile });
  } catch (error) {
    if (error instanceof Error) logger.error("Error fetching author profile:", error.message);
    else logger.error("Error fetching author profile:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateAuthorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    let userId = extractUserIdFromRequest(req);
    const updates = req.body || {};
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({ success: true, message: "Guest profile update ignored in dev." });
        return;
      }
      res.status(401).json({ error: "Unauthorized", details: "User ID not found in request", debug: { user: (req as any).user, body: req.body } });
      return;
    }
    const [existingAuthor]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    let authorId: string;
    if (!Array.isArray(existingAuthor) || existingAuthor.length === 0) {
      const [result]: any = await db.execute(
        "INSERT INTO authors (user_id, display_name, tags, social_links, payout_details) VALUES (?, ?, ?, ?, ?)",
        [userId, updates.name || "", JSON.stringify([]), JSON.stringify({}), JSON.stringify({})]
      );
      authorId = result.insertId;
    } else {
      authorId = existingAuthor[0].id;
    }
    const updateFields: any = {};
    const fieldsMapping: { [key: string]: string } = {
      name: "display_name",
      location: "location",
      bio: "bio",
      legalName: "legal_name",
      qualifications: "qualifications",
      specialty: "specialty",
    };
    Object.keys(fieldsMapping).forEach((field) => {
      if (updates[field] !== undefined) updateFields[fieldsMapping[field]] = updates[field];
    });
    if (updates.tags !== undefined) updateFields.tags = JSON.stringify(updates.tags || []);
    if (updates.socialLinks !== undefined) updateFields.social_links = JSON.stringify(updates.socialLinks || {});
    if (updates.payoutDetails !== undefined) updateFields.payout_details = JSON.stringify(updates.payoutDetails || {});
    if (updates.photoUrl !== undefined) updateFields.profile_photo_url = updates.photoUrl;
    if (Object.keys(updateFields).length > 0) {
      const setClause = Object.keys(updateFields).map((key) => `${key} = ?`).join(", ");
      const values = Object.values(updateFields);
      values.push(userId);
      await db.execute(`UPDATE authors SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, values);
      logger.info(`Author profile updated for user ${userId}`);
    }
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    logger.error("Error updating author profile:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    let userId = extractUserIdFromRequest(req);
    const { photoUrl } = req.body || {};
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({ success: true, message: "Guest photo update ignored in dev.", photoUrl });
        return;
      }
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!photoUrl) {
      res.status(400).json({ error: "Photo URL is required" });
      return;
    }
    const [existingAuthor]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    if (!Array.isArray(existingAuthor) || existingAuthor.length === 0) {
      await db.execute("INSERT INTO authors (user_id, display_name, profile_photo_url) VALUES (?, ?, ?)", [userId, "", photoUrl]);
    } else {
      await db.execute("UPDATE authors SET profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", [photoUrl, userId]);
    }
    res.json({ success: true, message: "Profile photo updated", photoUrl });
  } catch (error) {
    logger.error("Error updating profile photo:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAuthorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    let userId = extractUserIdFromRequest(req);
    const { articles, views, certificates, earnings, monthlyEarnings, rank } = req.body || {};
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({ success: true, message: "Guest stats update ignored in dev." });
        return;
      }
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [authorRows]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    if (!Array.isArray(authorRows) || authorRows.length === 0) {
      res.status(404).json({ error: "Author profile not found" });
      return;
    }
    const authorId = authorRows[0].id;
    const [existingStats]: any = await db.execute("SELECT id FROM author_stats WHERE author_id = ?", [authorId]);
    if (Array.isArray(existingStats) && existingStats.length > 0) {
      await db.execute(
        `UPDATE author_stats SET 
          articles_published = COALESCE(?, articles_published),
          total_views = COALESCE(?, total_views),
          certificates_earned = COALESCE(?, certificates_earned),
          total_earnings = COALESCE(?, total_earnings),
          monthly_earnings = COALESCE(?, monthly_earnings),
          rank = COALESCE(?, rank),
          last_updated = CURRENT_TIMESTAMP
         WHERE author_id = ?`,
        [articles, views, certificates, earnings, monthlyEarnings, rank, authorId]
      );
    } else {
      await db.execute(
        `INSERT INTO author_stats 
          (author_id, articles_published, total_views, certificates_earned, total_earnings, monthly_earnings, rank)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [authorId, articles || 0, views || 0, certificates || 0, earnings || 0, monthlyEarnings || 0, rank || 0]
      );
    }
    res.json({ success: true, message: "Stats updated successfully" });
  } catch (error) {
    logger.error("Error updating author stats:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAuthorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    let userId = extractUserIdFromRequest(req);
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({
          success: true,
          stats: {
            articles: 0,
            views: 0,
            certificates: 0,
            earnings: 0,
            monthlyEarnings: 0,
            rank: 0,
          },
        });
        return;
      }
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [statsRows]: any = await db.execute(
      `SELECT as.* 
       FROM author_stats as
       INNER JOIN authors a ON as.author_id = a.id
       WHERE a.user_id = ?`,
      [userId]
    );
    if (!Array.isArray(statsRows) || statsRows.length === 0) {
      res.json({
        success: true,
        stats: {
          articles: 0,
          views: 0,
          certificates: 0,
          earnings: 0,
          monthlyEarnings: 0,
          rank: 0,
        },
      });
      return;
    }
    const stats = statsRows[0];
    res.json({
      success: true,
      stats: {
        articles: stats.articles_published,
        views: stats.total_views,
        certificates: stats.certificates_earned,
        earnings: stats.total_earnings,
        monthlyEarnings: stats.monthly_earnings,
        rank: stats.author_rank || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching author stats:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    const [plans]: any = await db.execute("SELECT * FROM subscription_plans ORDER BY price_monthly ASC");
    const formattedPlans = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
      features: plan.features ? JSON.parse(plan.features) : [],
      duration: plan.duration,
    }));
    res.json({ success: true, plans: formattedPlans });
  } catch (error) {
    logger.error("Error fetching subscription plans:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    let userId = extractUserIdFromRequest(req);
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({
          success: true,
          subscription: {
            planId: null,
            planName: "Free Plan",
            priceMonthly: 0,
            priceYearly: 0,
            status: "free",
            features: [],
          },
          hasActiveSubscription: false,
        });
        return;
      }
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const subscription = await getCurrentSubscriptionInternal(userId);
    res.json({
      success: true,
      subscription,
      hasActiveSubscription: subscription && subscription.status !== "free",
    });
  } catch (error) {
    logger.error("Error fetching current subscription:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCurrentSubscriptionInternal = async (userId: string): Promise<any> => {
  try {
    const db = getMySQLDatabase();
    const [subscriptionRows]: any = await db.execute(
      `SELECT us.*, sp.name as plan_name, sp.price_monthly, sp.price_yearly, sp.features
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
       ORDER BY us.end_date DESC
       LIMIT 1`,
      [userId]
    );
    if (Array.isArray(subscriptionRows) && subscriptionRows.length > 0) {
      const subscription = subscriptionRows[0];
      return {
        id: subscription.id,
        planId: subscription.plan_id,
        planName: subscription.plan_name,
        priceMonthly: subscription.amount || subscription.price_monthly,
        priceYearly: subscription.price_yearly,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        status: subscription.status,
        features: subscription.features ? JSON.parse(subscription.features) : [],
      };
    } else {
      const [freePlanRows]: any = await db.execute("SELECT * FROM subscription_plans WHERE name = 'Free Plan' LIMIT 1");
      if (Array.isArray(freePlanRows) && freePlanRows.length > 0) {
        const freePlan = freePlanRows[0];
        return {
          planId: freePlan.id,
          planName: freePlan.name,
          priceMonthly: 0,
          priceYearly: 0,
          status: "free",
          features: freePlan.features ? JSON.parse(freePlan.features) : [],
        };
      } else {
        return null;
      }
    }
  } catch (error) {
    logger.error("Error in getCurrentSubscriptionInternal:", error instanceof Error ? error.message : error);
    return null;
  }
};

export const incrementArticleCount = async (userId: string): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    const [authorRows]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    if (authorRows.length === 0) return;
    const authorId = authorRows[0].id;
    await db.execute(
      `INSERT INTO author_stats (author_id, articles_published, total_earnings)
       VALUES (?, 1, 0)
       ON DUPLICATE KEY UPDATE 
       articles_published = articles_published + 1,
       last_updated = CURRENT_TIMESTAMP`,
      [authorId]
    );
  } catch (error) {
    logger.error("Error incrementing article count:", error instanceof Error ? error.message : error);
  }
};

export const incrementViews = async (userId: string, views: number = 1): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    const [authorRows]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    if (authorRows.length === 0) return;
    const authorId = authorRows[0].id;
    await db.execute(
      `INSERT INTO author_stats (author_id, total_views, articles_published)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE 
       total_views = total_views + ?,
       last_updated = CURRENT_TIMESTAMP`,
      [authorId, views, views]
    );
  } catch (error) {
    logger.error("Error incrementing views:", error instanceof Error ? error.message : error);
  }
};

export const addEarnings = async (userId: string, amount: number): Promise<void> => {
  try {
    const db = getMySQLDatabase();
    const [authorRows]: any = await db.execute("SELECT id FROM authors WHERE user_id = ?", [userId]);
    if (authorRows.length === 0) return;
    const authorId = authorRows[0].id;
    await db.execute(
      `INSERT INTO author_stats (author_id, total_earnings, monthly_earnings, articles_published)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE 
       total_earnings = total_earnings + ?,
       monthly_earnings = monthly_earnings + ?,
       last_updated = CURRENT_TIMESTAMP`,
      [authorId, amount, amount, amount, amount]
    );
  } catch (error) {
    logger.error("Error adding earnings:", error instanceof Error ? error.message : error);
  }
};

export const getTopAuthors = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const authors = await getTopAuthorsInternal(limit);
    res.json({ success: true, authors });
  } catch (error) {
    logger.error("Error getting top authors:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTopAuthorsInternal = async (limit: number = 10): Promise<any[]> => {
  try {
    const db = getMySQLDatabase();
    const [authors]: any = await db.execute(
      `SELECT 
         a.display_name,
         a.profile_photo_url,
         a.specialty,
         as.total_earnings,
         as.articles_published,
         as.total_views,
         as.rank
       FROM authors a
       LEFT JOIN author_stats as ON a.id = as.author_id
       WHERE a.is_verified = TRUE
       ORDER BY as.total_earnings DESC, as.articles_published DESC
       LIMIT ?`,
      [limit]
    );
    return authors;
  } catch (error) {
    logger.error("Error getting top authors:", error instanceof Error ? error.message : error);
    return [];
  }
};
