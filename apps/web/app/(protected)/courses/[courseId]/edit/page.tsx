'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  BookOpen,
  Clock,
  Tag,
  Image,
  Edit,
  FileText,
  MessageSquare,
  PresentationIcon,
  ClipboardList,
  Link,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LMSCourse, LMSModule, LMSStep } from '@repo/types';

// Step type icons
const stepTypeIcons = {
  lesson: BookOpen,
  quiz: ClipboardList,
  assignment: FileText,
  discussion: MessageSquare,
  presentation: PresentationIcon,
  resource: Link,
};

// Available AI agents
const aiAgents = [
  { id: 'general-assistant', name: 'General Assistant' },
  { id: 'biblical-scholar', name: 'Biblical Scholar' },
  { id: 'theology-assistant', name: 'Theology Assistant' },
  { id: 'essay-writer', name: 'Essay Writer' },
  { id: 'creative-writer', name: 'Creative Writer' },
  { id: 'devotional-guide', name: 'Devotional Guide' },
];

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState<{ moduleIndex: number; stepIndex: number } | null>(null);
  
  // Course state
  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Step editor state
  const [stepForm, setStepForm] = useState<Partial<LMSStep>>({
    title: '',
    description: '',
    type: 'lesson',
    agentId: 'general-assistant',
    estimatedMinutes: 15,
    content: {
      instructions: '',
      initialPrompt: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      fetchCourse();
    }
  }, [courseId, currentUser]);

  const fetchCourse = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else if (response.status === 403) {
        setError('You do not have permission to edit this course');
        setTimeout(() => router.push('/courses/my-courses'), 2000);
      } else {
        setError('Failed to fetch course');
        console.error('Failed to fetch course');
      }
    } catch (error) {
      setError('Error fetching course');
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!course || !currentUser) return;
    
    setSaving(true);
    setError(null);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(course),
      });

      if (response.ok) {
        // Show success message
        console.log('Course saved successfully');
      } else if (response.status === 403) {
        setError('You do not have permission to update this course');
      } else {
        setError('Failed to save course');
      }
    } catch (error) {
      setError('Error saving course');
      console.error('Failed to save course:', error);
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    if (!course) return;
    
    const newModule: LMSModule = {
      id: `module-${Date.now()}`,
      courseId: course.id,
      title: `Module ${course.modules.length + 1}`,
      description: '',
      order: course.modules.length + 1,
      steps: [],
      requiredForCompletion: 100,
      estimatedMinutes: 60,
    };

    setCourse({
      ...course,
      modules: [...course.modules, newModule],
    });
  };

  const updateModule = (index: number, updates: Partial<LMSModule>) => {
    if (!course) return;
    
    const modules = [...course.modules];
    modules[index] = { ...modules[index], ...updates };
    setCourse({ ...course, modules });
  };

  const deleteModule = (index: number) => {
    if (!course) return;
    
    const modules = [...course.modules];
    modules.splice(index, 1);
    // Reorder remaining modules
    modules.forEach((m, i) => {
      m.order = i + 1;
    });
    setCourse({ ...course, modules });
  };

  const addStep = (moduleIndex: number) => {
    setActiveModuleIndex(moduleIndex);
    setEditingStep(null);
    setStepForm({
      title: '',
      description: '',
      type: 'lesson',
      agentId: 'general-assistant',
      estimatedMinutes: 15,
      content: {
        instructions: '',
        initialPrompt: '',
      },
    });
    setShowStepEditor(true);
  };

  const editStep = (moduleIndex: number, stepIndex: number) => {
    if (!course) return;
    
    const step = course.modules[moduleIndex].steps[stepIndex];
    setActiveModuleIndex(moduleIndex);
    setEditingStep({ moduleIndex, stepIndex });
    setStepForm(step);
    setShowStepEditor(true);
  };

  const saveStep = () => {
    if (!course || activeModuleIndex === null) return;
    
    const modules = [...course.modules];
    const module = modules[activeModuleIndex];
    
    if (editingStep) {
      // Update existing step
      module.steps[editingStep.stepIndex] = {
        ...module.steps[editingStep.stepIndex],
        ...stepForm,
      } as LMSStep;
    } else {
      // Add new step
      const newStep: LMSStep = {
        id: `step-${Date.now()}`,
        moduleId: module.id,
        order: module.steps.length + 1,
        ...stepForm,
      } as LMSStep;
      module.steps.push(newStep);
    }
    
    setCourse({ ...course, modules });
    setShowStepEditor(false);
  };

  const deleteStep = (moduleIndex: number, stepIndex: number) => {
    if (!course) return;
    
    const modules = [...course.modules];
    modules[moduleIndex].steps.splice(stepIndex, 1);
    // Reorder remaining steps
    modules[moduleIndex].steps.forEach((s, i) => {
      s.order = i + 1;
    });
    setCourse({ ...course, modules });
  };

  const addTag = () => {
    if (!course) return;
    
    if (tagInput.trim() && !course.tags.includes(tagInput.trim())) {
      setCourse({
        ...course,
        tags: [...course.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      tags: course.tags.filter(t => t !== tag),
    });
  };

  const calculateTotalHours = () => {
    if (!course) return 0;
    
    const totalMinutes = course.modules.reduce((acc, module) => 
      acc + module.estimatedMinutes, 0);
    return Math.ceil(totalMinutes / 60);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to edit courses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Course not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/courses/my-courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Course</h1>
            <p className="text-muted-foreground mt-1">
              {course.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={() => router.push(`/courses/${courseId}/preview`)}
          >
            Preview Course
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">
            Modules ({course.modules.length})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Course Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the core details of your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={course.category}
                    onValueChange={(value) => setCourse({ ...course, category: value as any })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biblical-studies">Biblical Studies</SelectItem>
                      <SelectItem value="theology">Theology</SelectItem>
                      <SelectItem value="ministry">Ministry</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={course.difficulty}
                    onValueChange={(value) => setCourse({ ...course, difficulty: value as any })}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      value={course.estimatedHours}
                      onChange={(e) => setCourse({ ...course, estimatedHours: parseInt(e.target.value) || 1 })}
                    />
                    <span className="text-sm text-muted-foreground">
                      (Auto: {calculateTotalHours()} hours)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={course.thumbnail || ''}
                  onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                />
                {course.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={course.thumbnail}
                      alt="Course thumbnail"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="published">Published</Label>
                  <input
                    id="published"
                    type="checkbox"
                    checked={course.isPublished || false}
                    onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                {course.enrollmentCount !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    {course.enrollmentCount} students enrolled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Manage modules and their steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.modules.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add modules to structure your course content
                  </p>
                  <Button onClick={addModule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="cursor-move">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Module Title</Label>
                                <Input
                                  value={module.title}
                                  onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  value={module.estimatedMinutes}
                                  onChange={(e) => updateModule(moduleIndex, { 
                                    estimatedMinutes: parseInt(e.target.value) || 60 
                                  })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={module.description}
                                onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteModule(moduleIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Module Steps */}
                        <div className="ml-9 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Steps</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addStep(moduleIndex)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Step
                            </Button>
                          </div>
                          {module.steps.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              No steps yet. Add steps to create lessons, quizzes, and assignments.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {module.steps.map((step, stepIndex) => {
                                const StepIcon = stepTypeIcons[step.type] || BookOpen;
                                return (
                                  <div
                                    key={step.id}
                                    className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50"
                                  >
                                    <StepIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 text-sm">{step.title}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {step.estimatedMinutes} min
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => editStep(moduleIndex, stepIndex)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteStep(moduleIndex, stepIndex)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button onClick={addModule} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Configure advanced course options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Prerequisites</Label>
                <p className="text-sm text-muted-foreground">
                  Select courses that should be completed before this one
                </p>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground italic">
                    Course prerequisite selection coming soon...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Step Editor Dialog */}
      <Dialog open={showStepEditor} onOpenChange={setShowStepEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? 'Edit Step' : 'Add New Step'}
            </DialogTitle>
            <DialogDescription>
              Configure the learning step details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Step Title</Label>
                <Input
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Biblical Context"
                />
              </div>
              <div className="space-y-2">
                <Label>Step Type</Label>
                <Select
                  value={stepForm.type}
                  onValueChange={(value) => setStepForm({ ...stepForm, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={stepForm.description}
                onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Brief description of what students will learn..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>AI Agent</Label>
                <Select
                  value={stepForm.agentId}
                  onValueChange={(value) => setStepForm({ ...stepForm, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={stepForm.estimatedMinutes}
                  onChange={(e) => setStepForm({ 
                    ...stepForm, 
                    estimatedMinutes: parseInt(e.target.value) || 15 
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={stepForm.content?.instructions || ''}
                onChange={(e) => setStepForm({ 
                  ...stepForm, 
                  content: { ...stepForm.content, instructions: e.target.value }
                })}
                placeholder="Detailed instructions for the student..."
                rows={3}
              />
            </div>

            {stepForm.type === 'lesson' && (
              <div className="space-y-2">
                <Label>Initial AI Prompt</Label>
                <Textarea
                  value={stepForm.content?.initialPrompt || ''}
                  onChange={(e) => setStepForm({ 
                    ...stepForm, 
                    content: { ...stepForm.content, initialPrompt: e.target.value }
                  })}
                  placeholder="What should the AI agent say to start the lesson?"
                  rows={2}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStepEditor(false)}>
                Cancel
              </Button>
              <Button onClick={saveStep}>
                {editingStep ? 'Update Step' : 'Add Step'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
