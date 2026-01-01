import { Request, Response } from "express";
import { getDoc, createDoc, updateDoc, executeQuery, deleteDoc } from "../utils/firestore-helpers";
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

    const user: any = await getDoc('users', userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found", message: "User does not exist in database" });
      return;
    }

    // Try to get author profile using userId as doc ID (Migration strategy: we assume new paradigm)
    // If old data exists with auto-ID, this might miss it. 
    // BUT since we are migrating, we can enforce creating new docs with userId as Key or migrating data.
    // For now, let's try getDoc('authors', userId).
    let authorProfile: any = await getDoc('authors', userId);

    // Backward compatibility check (optional logic, but let's stick to simplicity for migration)
    // If we were strictly migrating SQL data 1:1, we would query by user_id field.
    // simpler: Let's assume we migrated data to have ID = userId, OR we query.
    // Let's QUERY first to be safe, if we haven't strictly enforced ID=userId yet.
    if (!authorProfile) {
      const authors = await executeQuery('authors', [{ field: 'user_id', op: '==', value: userId }]);
      if (authors.length > 0) authorProfile = authors[0];
    }

    if (!authorProfile) {
      // Create new
      const newAuthor = {
        user_id: userId,
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
        created_at: new Date()
      };
      // Use userId as doc ID for future easier access
      authorProfile = await createDoc('authors', newAuthor, userId);
    }

    // Get Stats
    // Assuming author_stats linked by author_id (which is userId if we use that, or random ID)
    // We check both keys
    let stats: any = null;
    if (authorProfile.id) {
      // Try finding stats by author_id field
      const s = await executeQuery('author_stats', [{ field: 'author_id', op: '==', value: authorProfile.id }]);
      if (s.length > 0) stats = s[0];
    }
    if (!stats) {
      // Try getting by doc ID = userId (if we unify)
      const s = await getDoc('author_stats', userId);
      if (s) stats = s;
    }

    let membership = null;
    try {
      membership = await getCurrentSubscriptionInternal(userId);
    } catch {
      membership = null;
    }

    if (!membership) {
      membership = {
        planName: "Free Plan",
        priceMonthly: 0,
        status: "free",
        endDate: null,
        features: [],
      };
    }

    const parseJSONSafe = (val: any) => {
      if (!val) return null;
      if (typeof val === 'object') return val; // Already object in Firestore
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    };

    const joinedDate = authorProfile.created_at ? (authorProfile.created_at.toDate ? authorProfile.created_at.toDate().toISOString() : new Date(authorProfile.created_at).toISOString()) : new Date().toISOString();

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
      stats: stats
        ? {
          articles: stats.articles_published || 0,
          views: stats.total_views || 0,
          certificates: stats.certificates_earned || 0,
          earnings: stats.total_earnings || 0,
          monthlyEarnings: stats.monthly_earnings || 0,
          rank: stats.rank || stats.author_rank || 0,
        }
        : {
          articles: 0,
          views: 0,
          certificates: 0,
          earnings: 0,
          monthlyEarnings: 0,
          rank: 0,
        },
      membership,
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
    let userId = extractUserIdFromRequest(req);
    const updates = req.body || {};
    if (!userId) {
      if (process.env.ALLOW_GUEST_PROFILE === "true") {
        res.json({ success: true, message: "Guest profile update ignored in dev." });
        return;
      }
      res.status(401).json({ error: "Unauthorized", details: "User ID not found in request" });
      return;
    }

    // Find author
    let authorId: string | null = null;
    let author: any = await getDoc('authors', userId);
    if (author) {
      authorId = author.id;
    } else {
      const authors = await executeQuery('authors', [{ field: 'user_id', op: '==', value: userId }]);
      if (authors.length > 0) {
        author = authors[0];
        authorId = author.id;
      }
    }

    if (!authorId) {
      // Create
      const newAuthor = {
        user_id: userId,
        display_name: updates.name || "",
        profile_photo_url: updates.photoUrl || "",
        tags: [], // Store as array in Firestore
        social_links: {},
        payout_details: {},
        created_at: new Date()
      };
      const created = await createDoc('authors', newAuthor, userId);
      authorId = created.id;
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

    // Firestore stores JSON/Arrays natively, no stringify needed if we transition.
    // BUT legacy frontend might send objects.
    // The previous code STRINGIFIED them. 
    // Ideally we store as objects in Firestore.
    // Let's store as objects if they are objects, or string versions if we must maintain compatibility?
    // Firestore is flexible. Let's store as objects.
    if (updates.tags !== undefined) updateFields.tags = updates.tags;
    if (updates.socialLinks !== undefined) updateFields.social_links = updates.socialLinks;
    if (updates.payoutDetails !== undefined) updateFields.payout_details = updates.payoutDetails;
    if (updates.photoUrl !== undefined) updateFields.profile_photo_url = updates.photoUrl;

    if (authorId && Object.keys(updateFields).length > 0) {
      await updateDoc('authors', authorId as string, updateFields);
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

    let authorId: string | null = null;
    let author: any = await getDoc('authors', userId);

    if (author) {
      await updateDoc('authors', author.id, { profile_photo_url: photoUrl });
    } else {
      const authors = await executeQuery('authors', [{ field: 'user_id', op: '==', value: userId }]);
      if (authors.length > 0) {
        await updateDoc('authors', authors[0].id, { profile_photo_url: photoUrl });
      } else {
        // Create
        await createDoc('authors', {
          user_id: userId,
          display_name: "",
          profile_photo_url: photoUrl,
          created_at: new Date()
        }, userId);
      }
    }

    res.json({ success: true, message: "Profile photo updated", photoUrl });
  } catch (error) {
    logger.error("Error updating profile photo:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAuthorStats = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Upsert stats using userId as doc ID (or find by author_id if legacy)
    let statsDoc: any = await getDoc('author_stats', userId);

    // If not found by userId, try creation or query? 
    // We assume new stack uses userId.
    if (!statsDoc) {
      // Just create/set
      await createDoc('author_stats', {
        author_id: userId, // Link back to user/author
        articles_published: articles || 0,
        total_views: views || 0,
        certificates_earned: certificates || 0,
        total_earnings: earnings || 0,
        monthly_earnings: monthlyEarnings || 0,
        rank: rank || 0,
        updated_at: new Date()
      }, userId);
    } else {
      await updateDoc('author_stats', userId, {
        articles_published: articles !== undefined ? articles : statsDoc.articles_published,
        total_views: views !== undefined ? views : statsDoc.total_views,
        certificates_earned: certificates !== undefined ? certificates : statsDoc.certificates_earned,
        total_earnings: earnings !== undefined ? earnings : statsDoc.total_earnings,
        monthly_earnings: monthlyEarnings !== undefined ? monthlyEarnings : statsDoc.monthly_earnings,
        rank: rank !== undefined ? rank : statsDoc.rank,
        updated_at: new Date()
      });
    }

    res.json({ success: true, message: "Stats updated successfully" });
  } catch (error) {
    logger.error("Error updating author stats:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAuthorStats = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Try finding stats
    let stats: any = await getDoc('author_stats', userId);
    if (!stats) {
      // Try query by author_id matching userId (legacy assumption: author_id might be user_id?)
      // Or author_id matches author doc ID which might NOT be userId in legacy.
      // Let's resolve Author doc first.
      let authorId = userId;
      const author: any = await getDoc('authors', userId);
      if (author) authorId = author.id;
      else {
        const authors = await executeQuery('authors', [{ field: 'user_id', op: '==', value: userId }]);
        if (authors.length > 0) authorId = authors[0].id;
      }

      const s = await executeQuery('author_stats', [{ field: 'author_id', op: '==', value: authorId }]);
      if (s.length > 0) stats = s[0];
    }

    if (!stats) {
      // Return zeros
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

    res.json({
      success: true,
      stats: {
        articles: stats.articles_published || 0,
        views: stats.total_views || 0,
        certificates: stats.certificates_earned || 0,
        earnings: stats.total_earnings || 0,
        monthlyEarnings: stats.monthly_earnings || 0,
        rank: stats.rank || stats.author_rank || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching author stats:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    // Determine sort order manually or if executeQuery supports it.
    // executeQuery(collection, filters, limit, orderBy)
    const plans = await executeQuery('subscription_plans', [], undefined, { field: 'price_monthly', dir: 'asc' });

    const formattedPlans = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
      features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [],
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

export const getCurrentSubscriptionInternal = async (userId: string): Promise<any> => {
  try {
    // Filter by user_id, status=active, end_date > now
    // Firestore complex filter: end_date > now.
    // Must parse dates. Firestore dates are Timestamp or Date.

    // Note: Firestore comparisons need consistent types.
    // For now, let's fetch active subscriptions for user and filter in memory if needed (or verify exact filter).
    const subscriptions = await executeQuery('user_subscriptions', [
      { field: 'user_id', op: '==', value: userId },
      { field: 'status', op: '==', value: 'active' }
    ]);

    // Sort by end_date desc
    subscriptions.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

    const validSubs = subscriptions.filter((s: any) => new Date(s.end_date as any) > new Date());

    if (validSubs.length > 0) {
      const sub = validSubs[0] as any;
      // Fetch plan details
      const plan: any = await getDoc('subscription_plans', sub.plan_id);

      return {
        id: sub.id,
        planId: sub.plan_id,
        planName: plan ? plan.name : 'Unknown Plan',
        priceMonthly: sub.amount || (plan ? plan.price_monthly : 0),
        priceYearly: plan ? plan.price_yearly : 0,
        startDate: sub.start_date,
        endDate: sub.end_date,
        status: sub.status,
        features: plan && plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [],
      };
    } else {
      // Free plan
      const plans = await executeQuery('subscription_plans', [{ field: 'name', op: '==', value: 'Free Plan' }]);
      if (plans.length > 0) {
        const freePlan: any = plans[0];
        return {
          planId: freePlan.id,
          planName: freePlan.name,
          priceMonthly: 0,
          priceYearly: 0,
          status: "free",
          features: freePlan.features ? (typeof freePlan.features === 'string' ? JSON.parse(freePlan.features) : freePlan.features) : [],
        };
      }
      return null;
    }
  } catch (error) {
    logger.error("Error in getCurrentSubscriptionInternal:", error instanceof Error ? error.message : error);
    return null;
  }
};

export const incrementArticleCount = async (userId: string): Promise<void> => {
  try {
    // Resolve author stats doc needed?
    // We try direct access author_stats/{userId}
    let stats: any = await getDoc('author_stats', userId);

    if (!stats) {
      // Try querying by author_id
      let authorId = userId; // Assume same
      // Logic to resolve Author ID omitted for brevity, assume direct or we create new
      // If we don't find stats, we create for userId
      stats = { articles_published: 0, total_earnings: 0 };
      await createDoc('author_stats', {
        author_id: userId,
        articles_published: 1,
        updated_at: new Date()
      }, userId);
    } else {
      await updateDoc('author_stats', stats.id, {
        articles_published: (stats.articles_published || 0) + 1
      });
    }
  } catch (error) {
    logger.error("Error incrementing article count:", error instanceof Error ? error.message : error);
  }
};

export const incrementViews = async (userId: string, views: number = 1): Promise<void> => {
  try {
    let stats: any = await getDoc('author_stats', userId);
    if (!stats) {
      await createDoc('author_stats', {
        author_id: userId,
        total_views: views,
        articles_published: 0,
        updated_at: new Date()
      }, userId);
    } else {
      await updateDoc('author_stats', stats.id, {
        total_views: (stats.total_views || 0) + views
      });
    }
  } catch (error) {
    logger.error("Error incrementing views:", error instanceof Error ? error.message : error);
  }
};

export const addEarnings = async (userId: string, amount: number): Promise<void> => {
  try {
    let stats: any = await getDoc('author_stats', userId);
    if (!stats) {
      await createDoc('author_stats', {
        author_id: userId,
        total_earnings: amount,
        monthly_earnings: amount,
        articles_published: 0,
        updated_at: new Date()
      }, userId);
    } else {
      await updateDoc('author_stats', stats.id, {
        total_earnings: (stats.total_earnings || 0) + amount,
        monthly_earnings: (stats.monthly_earnings || 0) + amount
      });
    }
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
    // 1. Get stats sorted by total_earnings (or articles)
    // executeQuery(col, filters, limit, order)
    const stats = await executeQuery('author_stats', [], limit, { field: 'total_earnings', dir: 'desc' });

    // 2. Map authors
    // Manual join
    const results: any[] = [];

    // Optimisation: Fetch all authors in parallel?
    // stats has author_id (which could be userId or docId).
    // existing logic uses it to join.
    // We assume stats.author_id points to 'authors' doc ID OR 'users' ID.
    // Let's assume 'authors' doc ID.

    for (const statItem of stats) {
      const stat = statItem as any;
      // stat.author_id
      if (!stat.author_id) continue;

      let author: any = await getDoc('authors', stat.author_id);
      if (!author) {
        // Maybe author_id was user_id, check author where user_id = stat.author_id
        const matches = await executeQuery('authors', [{ field: 'user_id', op: '==', value: stat.author_id }]);
        if (matches.length > 0) author = matches[0];
      }

      if (author && (author.is_verified === true || author.is_verified === 'true')) {
        results.push({
          display_name: author.display_name,
          profile_photo_url: author.profile_photo_url,
          specialty: author.specialty,
          total_earnings: stat.total_earnings,
          articles_published: stat.articles_published,
          total_views: stat.total_views,
          rank: stat.rank
        });
      }
    }

    return results;
  } catch (error) {
    logger.error("Error getting top authors:", error instanceof Error ? error.message : error);
    return [];
  }
};
