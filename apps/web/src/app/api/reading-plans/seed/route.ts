import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { defaultReadingPlans } from '@/lib/data/default-reading-plans';
import { ReadingPlan } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection<Omit<ReadingPlan, '_id'>>('reading_plans');

    // Check for force update parameter
    const { searchParams } = new URL(request.url);
    const forceUpdate = searchParams.get('force') === 'true';

    // Check if default plans already exist
    const existingPlans = await collection.find({
      userId: 'system',
      name: { $in: defaultReadingPlans.map(p => p.name!) }
    }).toArray();

    if (existingPlans.length > 0 && !forceUpdate) {
      return NextResponse.json({
        message: 'Default plans already exist. Add ?force=true to update them.',
        existingCount: existingPlans.length
      });
    }

    // If force update, delete existing system plans
    if (forceUpdate && existingPlans.length > 0) {
      await collection.deleteMany({
        userId: 'system',
        name: { $in: defaultReadingPlans.map(p => p.name!) }
      });
    }

    // Create system plans with all required fields
    const systemPlans = defaultReadingPlans.map(plan => {
      const { _id, ...planWithoutId } = plan as any;
      return {
        ...planWithoutId,
        userId: 'system', // System-owned plans
        name: plan.name!,
        description: plan.description || '',
        duration: plan.duration!,
        isPublic: plan.isPublic!,
        entries: plan.entries!,
        tags: plan.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const result = await collection.insertMany(systemPlans);

    return NextResponse.json({
      success: true,
      message: `Successfully ${forceUpdate ? 'updated' : 'created'} ${result.insertedCount} default reading plans`,
      insertedCount: result.insertedCount
    });
  } catch (error) {
    console.error('Error seeding reading plans:', error);
    return NextResponse.json(
      { error: 'Failed to seed reading plans' },
      { status: 500 }
    );
  }
}

// GET endpoint to check existing default plans
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('reading_plans');

    const systemPlans = await collection.find({
      userId: 'system'
    }).toArray();

    return NextResponse.json({
      success: true,
      count: systemPlans.length,
      plans: systemPlans.map((plan: any) => ({
        name: plan.name,
        duration: plan.duration,
        tags: plan.tags,
        entriesCount: plan.entries.length
      }))
    });
  } catch (error) {
    console.error('Error fetching system plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system plans' },
      { status: 500 }
    );
  }
}
