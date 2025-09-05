import { ObjectId } from 'mongodb';
import { getReadingPlansCollection } from '../mongodb';
import { ReadingPlan, ReadingPlanEntry } from '@/types';

export class ReadingPlanService {
  /**
   * Create a new reading plan
   */
  async createReadingPlan(
    userId: string,
    data: {
      name: string;
      description?: string;
      duration?: number;
      isPublic?: boolean;
      entries: Omit<ReadingPlanEntry, 'completed' | 'completedAt'>[];
      tags?: string[];
      groupId?: string;
    }
  ): Promise<ReadingPlan> {
    const collection = await getReadingPlansCollection();
    
    const newPlan: Omit<ReadingPlan, '_id'> = {
      userId,
      name: data.name,
      description: data.description,
      duration: data.duration || data.entries.length,
      isPublic: data.isPublic || false,
      entries: data.entries.map(entry => ({
        ...entry,
        completed: false,
      })),
      tags: data.tags,
      groupId: data.groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newPlan as any);
    
    return {
      _id: result.insertedId.toString(),
      ...newPlan,
    };
  }

  /**
   * Get all reading plans for a user
   */
  async getUserReadingPlans(userId: string): Promise<ReadingPlan[]> {
    const collection = await getReadingPlansCollection();
    
    const plans = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return plans.map(plan => ({
      ...plan,
      _id: plan._id.toString(),
    })) as ReadingPlan[];
  }

  /**
   * Get a specific reading plan
   */
  async getReadingPlan(planId: string, userId: string): Promise<ReadingPlan | null> {
    const collection = await getReadingPlansCollection();
    
    const plan = await collection.findOne({
      _id: new ObjectId(planId),
      $or: [
        { userId },
        { isPublic: true },
        { groupId: { $exists: true } } // TODO: Check if user is in group
      ]
    });
    
    if (!plan) return null;
    
    return {
      ...plan,
      _id: plan._id.toString(),
    } as ReadingPlan;
  }

  /**
   * Update reading plan details
   */
  async updateReadingPlan(
    planId: string,
    userId: string,
    updates: Partial<Pick<ReadingPlan, 'name' | 'description' | 'isPublic'>>
  ): Promise<boolean> {
    const collection = await getReadingPlansCollection();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(planId), userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Mark an entry as completed
   */
  async markEntryCompleted(
    planId: string,
    userId: string,
    entryIndex: number,
    notes?: string
  ): Promise<boolean> {
    const collection = await getReadingPlansCollection();
    
    const updateData: any = {
      [`entries.${entryIndex}.completed`]: true,
      [`entries.${entryIndex}.completedAt`]: new Date(),
      updatedAt: new Date(),
    };
    
    if (notes !== undefined) {
      updateData[`entries.${entryIndex}.notes`] = notes;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(planId), userId },
      { $set: updateData }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Mark an entry as incomplete
   */
  async markEntryIncomplete(
    planId: string,
    userId: string,
    entryIndex: number
  ): Promise<boolean> {
    const collection = await getReadingPlansCollection();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(planId), userId },
      {
        $set: {
          [`entries.${entryIndex}.completed`]: false,
          updatedAt: new Date(),
        },
        $unset: {
          [`entries.${entryIndex}.completedAt`]: "",
        },
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Add notes to an entry
   */
  async updateEntryNotes(
    planId: string,
    userId: string,
    entryIndex: number,
    notes: string
  ): Promise<boolean> {
    const collection = await getReadingPlansCollection();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(planId), userId },
      {
        $set: {
          [`entries.${entryIndex}.notes`]: notes,
          updatedAt: new Date(),
        },
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Delete a reading plan
   */
  async deleteReadingPlan(planId: string, userId: string): Promise<boolean> {
    const collection = await getReadingPlansCollection();
    
    const result = await collection.deleteOne({
      _id: new ObjectId(planId),
      userId,
    });
    
    return result.deletedCount > 0;
  }

  /**
   * Get reading plan progress
   */
  async getReadingPlanProgress(planId: string, userId: string): Promise<{
    totalEntries: number;
    completedEntries: number;
    percentageComplete: number;
    currentStreak: number;
    longestStreak: number;
  } | null> {
    const plan = await this.getReadingPlan(planId, userId);
    if (!plan) return null;
    
    const totalEntries = plan.entries.length;
    const completedEntries = plan.entries.filter(e => e.completed).length;
    const percentageComplete = totalEntries > 0 
      ? Math.round((completedEntries / totalEntries) * 100) 
      : 0;
    
    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort entries by completion date
    const sortedCompletedEntries = plan.entries
      .filter(e => e.completed && e.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedCompletedEntries.length; i++) {
      const completedDate = new Date(sortedCompletedEntries[i].completedAt!);
      completedDate.setHours(0, 0, 0, 0);
      
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedCompletedEntries[i - 1].completedAt!);
        prevDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((completedDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Check if this is part of current streak
      const daysSinceCompletion = Math.floor((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCompletion === 0 || (i === sortedCompletedEntries.length - 1 && daysSinceCompletion === 1)) {
        currentStreak = tempStreak;
      }
    }
    
    return {
      totalEntries,
      completedEntries,
      percentageComplete,
      currentStreak,
      longestStreak,
    };
  }

  /**
   * Get popular public reading plans (including system plans)
   */
  async getPopularReadingPlans(limit: number = 10): Promise<ReadingPlan[]> {
    const collection = await getReadingPlansCollection();
    
    // Get system plans first (they should appear at the top)
    const systemPlans = await collection
      .find({ userId: 'system', isPublic: true })
      .sort({ name: 1 }) // Sort system plans alphabetically
      .toArray();
    
    // Get other public plans
    const userPlans = await collection
      .find({ isPublic: true, userId: { $ne: 'system' } })
      .sort({ createdAt: -1 })
      .limit(Math.max(0, limit - systemPlans.length))
      .toArray();
    
    // Combine system plans and user plans
    const allPlans = [...systemPlans, ...userPlans].slice(0, limit);
    
    return allPlans.map(plan => ({
      ...plan,
      _id: plan._id.toString(),
    })) as ReadingPlan[];
  }

  /**
   * Clone a reading plan for a user
   */
  async cloneReadingPlan(
    originalPlanId: string,
    userId: string,
    newName?: string
  ): Promise<ReadingPlan | null> {
    const originalPlan = await this.getReadingPlan(originalPlanId, userId);
    if (!originalPlan || (!originalPlan.isPublic && originalPlan.userId !== 'system')) return null;
    
    const newPlan = await this.createReadingPlan(userId, {
      name: newName || `${originalPlan.name} (Copy)`,
      description: originalPlan.description,
      duration: originalPlan.duration,
      isPublic: false,
      entries: originalPlan.entries.map(entry => ({
        day: entry.day,
        passages: entry.passages,
        notes: entry.notes,
        // Include legacy fields if they exist
        reference: entry.reference,
        parsedReference: entry.parsedReference,
        aiSummary: entry.aiSummary,
      })),
      tags: originalPlan.tags,
    });
    
    return newPlan;
  }
}

// Export singleton instance
export const readingPlanService = new ReadingPlanService();
