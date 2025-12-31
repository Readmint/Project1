
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { executeQuery } from './utils/firestore-helpers';

dotenv.config();

const checkIndexes = async () => {
    console.log('Starting Index Check...');
    await connectDatabase();

    const checks = [
        {
            name: 'Content (Status + CreatedAt)',
            collection: 'content',
            filters: [{ field: 'status', op: '==', value: 'published' }],
            orderBy: { field: 'created_at', dir: 'desc' }
        },
        {
            name: 'Content (Status + Category + CreatedAt)',
            collection: 'content',
            filters: [
                { field: 'status', op: '==', value: 'published' },
                { field: 'category_id', op: '==', value: 'dummy_category' }
            ],
            orderBy: { field: 'created_at', dir: 'desc' }
        },
        {
            name: 'Workflow Events (Article + CreatedAt)',
            collection: 'workflow_events',
            filters: [{ field: 'article_id', op: '==', value: 'dummy_article' }],
            orderBy: { field: 'created_at', dir: 'desc' }
        },
        {
            name: 'Reviews (Article + CreatedAt)',
            collection: 'reviews',
            filters: [{ field: 'article_id', op: '==', value: 'dummy_article' }],
            orderBy: { field: 'created_at', dir: 'desc' }
        },
        {
            name: 'Reviewer Assignments (Reviewer + AssignedDate)',
            collection: 'reviewer_assignments',
            filters: [{ field: 'reviewer_id', op: '==', value: 'dummy_reviewer' }],
            orderBy: { field: 'assigned_date', dir: 'desc' }
        },
        {
            name: 'Plagiarism Reports (Article + CreatedAt)',
            collection: 'plagiarism_reports',
            filters: [{ field: 'article_id', op: '==', value: 'dummy_article' }],
            orderBy: { field: 'created_at', dir: 'desc' }
        },
        {
            name: 'Subscription Plans (Price)',
            collection: 'subscription_plans',
            filters: [],
            orderBy: { field: 'price_monthly', dir: 'asc' }
        },
        {
            name: 'Author Stats (Total Earnings)',
            collection: 'author_stats',
            filters: [],
            orderBy: { field: 'total_earnings', dir: 'desc' }
        }
    ];

    for (const check of checks) {
        console.log(`\nChecking: ${check.name}...`);
        try {
            await executeQuery(check.collection as any, check.filters as any, 1, check.orderBy as any);
            console.log(`✅ OK`);
        } catch (error: any) {
            if (error.message.includes('requires an index')) {
                const link = error.message.match(/https:\/\/[^\s]*/)?.[0];
                console.log(`❌ MISSING INDEX`);
                console.log(`👉 Link: ${link}`);
            } else {
                console.log(`⚠️ Error: ${error.message}`);
            }
        }
    }

    console.log('\nIndex Check Completed.');
    process.exit(0);
};

checkIndexes();
