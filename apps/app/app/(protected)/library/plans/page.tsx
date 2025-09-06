'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReadingPlanList } from '@/components/reading-plans/ReadingPlanList';
import { CreateReadingPlanForm } from '@/components/reading-plans/CreateReadingPlanForm';
import { useReadingPlans } from '@/hooks/useReadingPlans';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReadingPlansPage() {
  const router = useRouter();
  const { userPlans, publicPlans, loading, error, createPlan, deletePlan, clonePlan } = useReadingPlans();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelectPlan = (planId: string) => {
    router.push(`/library/plans/${planId}`);
  };

  const handleEditPlan = (planId: string) => {
    router.push(`/library/plans/${planId}/edit`);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this reading plan?')) {
      await deletePlan(planId);
    }
  };

  const handleClonePlan = async (planId: string) => {
    const name = prompt('Enter a name for the cloned plan:');
    if (name) {
      await clonePlan(planId, name);
    }
  };

  const handleCreatePlan = async (data: any) => {
    const newPlan = await createPlan(data);
    if (newPlan) {
      setShowCreateForm(false);
      router.push(`/library/plans/${newPlan._id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Reading Plans</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage your Bible reading plans
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Reading Plans</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage your Bible reading plans
              </p>
            </div>
            <div className="text-center py-8 text-destructive">
              Error loading reading plans: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reading Plans</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your Bible reading plans
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* User Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Plans</h2>
        <ReadingPlanList
          plans={userPlans}
          onSelectPlan={handleSelectPlan}
          onEditPlan={handleEditPlan}
          onDeletePlan={handleDeletePlan}
          onClonePlan={handleClonePlan}
        />
      </div>

      {/* Public Plans */}
      {publicPlans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Public Plans</h2>
          <ReadingPlanList
            plans={publicPlans}
            onSelectPlan={handleSelectPlan}
            onClonePlan={handleClonePlan}
            showActions={false}
          />
        </div>
      )}

          {/* Create Plan Dialog */}
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Reading Plan</DialogTitle>
              </DialogHeader>
              <CreateReadingPlanForm
                onSubmit={handleCreatePlan}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
