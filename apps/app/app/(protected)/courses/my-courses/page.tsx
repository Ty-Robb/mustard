'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  BookOpen,
  Clock,
  Users,
  Star,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LMSCourse } from '@repo/types';

export default function MyCoursesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (currentUser) {
      fetchMyCourses();
    }
  }, [currentUser]);

  const fetchMyCourses = async () => {
    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/lms/courses?type=my-courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/lms/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleDuplicate = async (course: LMSCourse) => {
    try {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const duplicatedCourse = {
        ...course,
        id: undefined,
        title: `${course.title} (Copy)`,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(duplicatedCourse),
      });

      if (response.ok) {
        fetchMyCourses();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to duplicate course');
      }
    } catch (error) {
      console.error('Failed to duplicate course:', error);
      alert('Failed to duplicate course. Please try again.');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'published' && course.isPublished) ||
                         (filter === 'draft' && !course.isPublished);
    
    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to view your courses.
            </p>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your personal learning courses
          </p>
        </div>
        <Button onClick={() => router.push('/courses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({courses.length})
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('published')}
          >
            Published ({courses.filter(c => c.isPublished).length})
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('draft')}
          >
            Drafts ({courses.filter(c => !c.isPublished).length})
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search' 
                : 'Create your first course to start building your personal learning library'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/courses/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Course
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={cn(getDifficultyColor(course.difficulty))}>
                    {course.difficulty}
                  </Badge>
                  <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {course.modules.length} modules
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    {course.estimatedHours} hours
                  </div>
                  {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {course.enrollmentCount} enrolled
                    </div>
                  )}
                  {course.rating && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="mr-2 h-4 w-4 fill-current text-yellow-500" />
                      {course.rating.toFixed(1)} ({course.ratingCount} reviews)
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/courses/${course.id}/edit`)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/courses/${course.id}/preview`)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(course)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {courses.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Course Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.filter(c => c.isPublished).length}
                </p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((acc, c) => acc + c.modules.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Modules</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((acc, c) => acc + c.estimatedHours, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
