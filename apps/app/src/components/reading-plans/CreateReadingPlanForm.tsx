'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateReadingPlanFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CreateReadingPlanForm({ onSubmit, onCancel }: CreateReadingPlanFormProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual creation state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [isPublic, setIsPublic] = useState(false);
  const [entries, setEntries] = useState<Array<{ day: number; passages: string[] }>>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentPassage, setCurrentPassage] = useState('');
  
  // AI creation state
  const [aiGoal, setAiGoal] = useState('');
  const [aiTimePerDay, setAiTimePerDay] = useState('15');
  const [aiDuration, setAiDuration] = useState('30');
  const [aiFocusAreas, setAiFocusAreas] = useState('');
  const [aiExperienceLevel, setAiExperienceLevel] = useState('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleAddPassage = () => {
    if (!currentPassage.trim()) return;

    const existingEntry = entries.find(e => e.day === currentDay);
    if (existingEntry) {
      setEntries(entries.map(e => 
        e.day === currentDay 
          ? { ...e, passages: [...e.passages, currentPassage.trim()] }
          : e
      ));
    } else {
      setEntries([...entries, { day: currentDay, passages: [currentPassage.trim()] }]);
    }
    setCurrentPassage('');
  };

  const handleRemovePassage = (day: number, passageIndex: number) => {
    setEntries(entries.map(e => {
      if (e.day === day) {
        const newPassages = e.passages.filter((_, i) => i !== passageIndex);
        return newPassages.length > 0 ? { ...e, passages: newPassages } : null;
      }
      return e;
    }).filter(Boolean) as typeof entries);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || entries.length === 0) {
      alert('Please provide a name and at least one reading entry');
      return;
    }

    // Convert entries to the format expected by the API
    const formattedEntries = [];
    for (let day = 1; day <= parseInt(duration); day++) {
      const entry = entries.find(e => e.day === day);
      formattedEntries.push({
        day,
        passages: entry?.passages || [],
        completed: false,
      });
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      duration: parseInt(duration),
      isPublic,
      entries: formattedEntries,
    });
  };

  const handleAiGenerate = async () => {
    if (!currentUser || !aiGoal || !aiTimePerDay || !aiDuration) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/reading-plans/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: aiGoal,
          timePerDay: aiTimePerDay,
          duration: aiDuration,
          focusAreas: aiFocusAreas,
          experienceLevel: aiExperienceLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      
      // Pre-fill the manual form with generated data
      setName(data.plan.name);
      setDescription(data.plan.description);
      setDuration(data.plan.duration.toString());
      setEntries(data.plan.entries);
      
      // Switch to manual tab to review/edit
      setActiveTab('manual');
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sortedEntries = [...entries].sort((a, b) => a.day - b.day);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual Creation</TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Assistant
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="ai-goal">What's your reading goal?</Label>
            <Textarea
              id="ai-goal"
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              placeholder="e.g., I want to understand the life of Jesus better, study prophecy, read through the Psalms..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ai-time">Minutes per day</Label>
              <Input
                id="ai-time"
                type="number"
                min="5"
                max="120"
                value={aiTimePerDay}
                onChange={(e) => setAiTimePerDay(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="ai-duration">Duration (days)</Label>
              <Select value={aiDuration} onValueChange={setAiDuration}>
                <SelectTrigger id="ai-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="14">2 Weeks</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                  <SelectItem value="60">2 Months</SelectItem>
                  <SelectItem value="90">3 Months</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="ai-focus">Focus areas (optional)</Label>
            <Input
              id="ai-focus"
              value={aiFocusAreas}
              onChange={(e) => setAiFocusAreas(e.target.value)}
              placeholder="e.g., Gospels, Wisdom literature, Paul's letters..."
            />
          </div>

          <div>
            <Label htmlFor="ai-experience">Experience level</Label>
            <Select value={aiExperienceLevel} onValueChange={setAiExperienceLevel}>
              <SelectTrigger id="ai-experience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Reading Plan
              </>
            )}
          </Button>

          {generatedPlan && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Plan generated! Switch to the Manual Creation tab to review and customize your plan before saving.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="manual">
        <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Read the Bible in a Year"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your reading plan..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (days)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">1 Week (7 days)</SelectItem>
              <SelectItem value="30">1 Month (30 days)</SelectItem>
              <SelectItem value="90">3 Months (90 days)</SelectItem>
              <SelectItem value="180">6 Months (180 days)</SelectItem>
              <SelectItem value="365">1 Year (365 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="public"
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked as boolean)}
          />
          <Label htmlFor="public" className="cursor-pointer">
            Make this plan public (others can view and clone it)
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reading Schedule</h3>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="day">Day</Label>
            <Input
              id="day"
              type="number"
              min="1"
              max={duration}
              value={currentDay}
              onChange={(e) => setCurrentDay(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex-[3]">
            <Label htmlFor="passage">Bible Passage</Label>
            <div className="flex gap-2">
              <Input
                id="passage"
                value={currentPassage}
                onChange={(e) => setCurrentPassage(e.target.value)}
                placeholder="e.g., Genesis 1-3, John 1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPassage();
                  }
                }}
              />
              <Button type="button" onClick={handleAddPassage} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {sortedEntries.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
            {sortedEntries.map((entry) => (
              <div key={entry.day} className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Day {entry.day}
                </div>
                <div className="pl-6 space-y-1">
                  {entry.passages.map((passage, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{passage}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePassage(entry.day, index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Plan
        </Button>
      </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
