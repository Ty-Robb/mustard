import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Clock, 
  Users, 
  BookOpen, 
  Award, 
  ChevronRight,
  Filter,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LMSCourse, UserProgress, CourseFilters } from '@repo/types';
import { useAuth } from '@/hooks/useAuth';
import { sampleCourses } from '@/lib/data/sample-courses';

interface CourseSelectorProps {
  onSelectCourse: (courseId: string) => void;
  className?: string;
}

export function CourseSelectorClient({ onSelectCourse, className }: CourseSelectorProps) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [enrollments, setEnrollments] = useState<UserProgress[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<LMSCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CourseFilters>({});
  const [activeTab, setActiveTab] = useState('all');
  const [useSampleData, setUseSampleData] = useState(false);

  // Get auth token with retry
  const getAuthToken = async (retries = 3): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await currentUser.getIdToken();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    }
    throw lastError || new Error('Failed to get auth token');
  };

  // Fetch with retry logic
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        
        // If it's a 503 (service unavailable), retry
        if (response.status === 503 && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError || new Error('Network request failed');
  };

  // Fetch courses from API with enhanced error handling
  const fetchCourses = async (filters: CourseFilters) => {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.category) params.append('category', filters.category);
      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      
      const response = await fetchWithRetry(`/api/lms/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch courses: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new response formats
      return data.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // If it's an auth error, we might need to refresh the page
      if (error instanceof Error && error.message.includes('auth')) {
        // You could trigger a re-authentication flow here
        console.error('Authentication error - user may need to log in again');
      }
      
      // Return empty array but preserve the error for display
      throw error;
    }
  };

  // Fetch user enrollments with retry
  const fetchEnrollments = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetchWithRetry('/api/lms/courses?type=enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch enrollments');
      }
      
      const data = await response.json();
      return data.enrollments || [];
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  };

  // Fetch recommended courses with retry
  const fetchRecommendedCourses = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetchWithRetry('/api/lms/courses?type=recommended', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch recommended courses');
      }
      
      const data = await response.json();
      return data.courses || [];
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setError('Please log in to view courses');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data with proper error handling
        const results = await Promise.allSettled([
          fetchCourses(filters),
          fetchEnrollments(),
          fetchRecommendedCourses(),
        ]);

        // Handle courses result
        if (results[0].status === 'fulfilled') {
          setCourses(results[0].value);
        } else {
          console.error('Failed to fetch courses:', results[0].reason);
          setCourses([]);
          setError('Unable to load courses. Please try again later.');
        }

        // Handle enrollments result
        if (results[1].status === 'fulfilled') {
          setEnrollments(results[1].value);
        } else {
          console.error('Failed to fetch enrollments:', results[1].reason);
          setEnrollments([]);
        }

        // Handle recommended courses result
        if (results[2].status === 'fulfilled') {
          setRecommendedCourses(results[2].value);
        } else {
          console.error('Failed to fetch recommended courses:', results[2].reason);
          setRecommendedCourses([]);
        }

        // If all requests failed, show a more prominent error
        if (results.every(r => r.status === 'rejected')) {
          setError('Unable to connect to the learning platform. Using sample data for demonstration.');
          // Use sample data as fallback
          setUseSampleData(true);
          setCourses(sampleCourses);
        }
      } catch (error) {
        console.error('Unexpected error loading courses:', error);
        setError('An unexpected error occurred. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const handleDifficultyFilter = (difficulty: string) => {
    setFilters(prev => ({
      ...prev,
      difficulty: difficulty === 'all' ? undefined : difficulty as any,
    }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category,
    }));
  };

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments.find(e => e.courseId === courseId);
  };

  const renderCourseCard = (course: LMSCourse) => {
    const enrollment = getEnrollmentForCourse(course.id);
    const isEnrolled = !!enrollment;
    const isCompleted = enrollment?.completedAt;

    return (
      <Card 
        key={course.id} 
        className={cn(
          "hover:shadow-lg transition-shadow cursor-pointer",
          isCompleted && "border-green-500"
        )}
        onClick={() => {
          console.log('[CourseSelectorClient] Card clicked, course ID:', course.id);
          onSelectCourse(course.id);
        }}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {course.description}
              </CardDescription>
            </div>
            {isCompleted && (
              <Award className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Tags and Difficulty */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {course.difficulty}
              </Badge>
              {course.category && (
                <Badge variant="secondary" className="text-xs">
                  {course.category.replace('-', ' ')}
                </Badge>
              )}
              {course.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Course Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.estimatedHours}h
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {course.modules.length} modules
              </div>
              {course.enrollmentCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.enrollmentCount}
                </div>
              )}
            </div>

            {/* Progress or Action */}
            {isEnrolled ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{enrollment.overallProgress}%</span>
                </div>
                <Progress value={enrollment.overallProgress} className="h-2" />
              </div>
            ) : (
              <Button 
                className="w-full" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCourse(course.id);
                }}
              >
                <span>Start Course</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredCourses = {
    all: courses,
    enrolled: courses.filter(c => enrollments.some(e => e.courseId === c.id && !e.completedAt)),
    completed: courses.filter(c => enrollments.some(e => e.courseId === c.id && e.completedAt)),
    recommended: recommendedCourses,
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state with fallback option
  if (error && courses.length === 0 && !useSampleData) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold">Unable to Load Courses</h3>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => {
                  setUseSampleData(true);
                  setCourses(sampleCourses);
                  setError(null);
                }} 
              >
                Use Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Learning Center</h1>
          </div>
          {(useSampleData || error) && (
            <Badge variant="secondary" className="text-xs">
              {useSampleData ? 'Demo Mode' : 'Limited Connectivity'}
            </Badge>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select onValueChange={handleDifficultyFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="biblical-studies">Biblical Studies</SelectItem>
                <SelectItem value="theology">Theology</SelectItem>
                <SelectItem value="ministry">Ministry</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Courses ({filteredCourses.all.length})
          </TabsTrigger>
          <TabsTrigger value="enrolled">
            In Progress ({filteredCourses.enrolled.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredCourses.completed.length})
          </TabsTrigger>
          <TabsTrigger value="recommended">
            Recommended ({filteredCourses.recommended.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(filteredCourses).map(([key, courseList]) => (
          <TabsContent key={key} value={key} className="mt-6">
            {courseList.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    {key === 'enrolled' && "You haven't enrolled in any courses yet."}
                    {key === 'completed' && "You haven't completed any courses yet."}
                    {key === 'recommended' && "No recommended courses at this time."}
                    {key === 'all' && "No courses found matching your criteria."}
                  </p>
                  {(key === 'enrolled' || key === 'completed') && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab('all')}
                    >
                      Browse Courses
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courseList.map(renderCourseCard)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
