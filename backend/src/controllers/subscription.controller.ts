import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let subscriptionPlans;

    if (db.collection) {
      // Firebase - Get subscription plans
      const plansSnapshot = await db.collection('subscription_plans').get();
      subscriptionPlans = plansSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      // MySQL - Get subscription plans
      const [rows]: any = await db.execute('SELECT * FROM subscription_plans ORDER BY price_monthly ASC');
      subscriptionPlans = rows.map((row: any) => ({
        ...row,
        features: JSON.parse(row.features || '[]')
      }));
    }

    // If no plans in database, return default plans
    if (!subscriptionPlans || subscriptionPlans.length === 0) {
      subscriptionPlans = [
        {
          id: '1',
          name: 'Free Plan',
          description: 'Basic access with limited features',
          price_monthly: 0,
          price_yearly: 0,
          features: ['Limited reading access', 'Basic content', 'Ad-supported'],
          duration: 'monthly'
        },
        {
          id: '2',
          name: 'Standard Plan',
          description: 'Full access to most magazines',
          price_monthly: 9.99,
          price_yearly: 99.99,
          features: ['Most magazines unlocked', 'Ad-free reading', 'Offline access'],
          duration: 'monthly'
        },
        {
          id: '3',
          name: 'Premium Plan',
          description: 'Complete unlimited access',
          price_monthly: 19.99,
          price_yearly: 199.99,
          features: ['All magazines unlocked', 'Ad-free experience', 'Exclusive content', 'Early access', 'Priority support'],
          duration: 'monthly'
        }
      ];
    }

    res.status(200).json({
      status: 'success',
      data: { plans: subscriptionPlans }
    });
  } catch (error) {
    logger.error('Get subscription plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};