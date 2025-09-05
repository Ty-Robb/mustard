'use client';

import { useState } from 'react';
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
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  BookOpen,
  Clock,
  Tag,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LMSCourse, LMSModule, LMSStep } from '@/types/lms';

export default function NewCoursePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Course state
  const [course, setCourse] = useState<Partial<LMSCourse>>({
    title: '',
    description: '',
    difficulty: 'beginner',
    estimatedHours: 1,
    tags: [],
    modules: [],
    category: 'biblical-studies',
    isPublished: false,
  });

  const [tagInput, setTagInput] = useState('');

  const handleSave = async (publish = false) => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      const courseData = {
        ...course,
        isPublished: publish,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const { courseId } = await response.json();
        router.push(`/courses/${courseId}/edit`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    const newModule: Partial<LMSModule> = {
      id: `module-${Date.now()}`,
      title: `Module ${(course.modules?.length || 0) + 1}`,
      description: '',
      order: (course.modules?.length || 0) + 1,
      steps: [],
      requiredForCompletion: 100,
      estimatedMinutes: 60,
    };

    setCourse({
      ...course,
      modules: [...(course.modules || []), newModule as LMSModule],
    });
  };

  const updateModule = (index: number, updates: Partial<LMSModule>) => {
    const modules = [...(course.modules || [])];
    modules[index] = { ...modules[index], ...updates };
    setCourse({ ...course, modules });
  };

  const deleteModule = (index: number) => {
    const modules = [...(course.modules || [])];
    modules.splice(index, 1);
    // Reorder remaining modules
    modules.forEach((m, i) => {
      m.order = i + 1;
    });
    setCourse({ ...course, modules });
  };

  const addTag = () => {
    if (tagInput.trim() && !course.tags?.includes(tagInput.trim())) {
      setCourse({
        ...course,
        tags: [...(course.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCourse({
      ...course,
      tags: course.tags?.filter(t => t !== tag) || [],
    });
  };

  const calculateTotalHours = () => {
    const totalMinutes = course.modules?.reduce((acc, module) => 
      acc + module.estimatedMinutes, 0) || 0;
    return Math.ceil(totalMinutes / 60);
  };

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
            <h1 className="text-3xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground mt-1">
              Build your personal learning experience
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || !course.title}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !course.title || !course.modules?.length}
          >
            Publish Course
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">
            Modules ({course.modules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Course Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the core details of your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Biblical Studies"
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
                  placeholder="Provide a compelling description of what students will learn..."
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
                  {course.tags?.map((tag) => (
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
                  placeholder="https://example.com/course-thumbnail.jpg"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Organize your course content into logical modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.modules?.length === 0 ? (
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
                  {course.modules?.map((module, index) => (
                    <Card key={module.id} className="p-4">
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
                                onChange={(e) => updateModule(index, { title: e.target.value })}
                                placeholder="Module title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={module.estimatedMinutes}
                                onChange={(e) => updateModule(index, { 
                                  estimatedMinutes: parseInt(e.target.value) || 60 
                                })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(index, { description: e.target.value })}
                              placeholder="Module description"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              <Clock className="inline h-4 w-4 mr-1" />
                              {module.steps.length} steps
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModule(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}
