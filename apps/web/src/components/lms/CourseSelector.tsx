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
import { LMSCourse, UserProgress, CourseFilters } from '@/types/lms';
import { getLMSService } from '@/lib/services/lms.service';
import { useAuth } from '@/hooks/useAuth';

interface CourseSelectorProps {
  onSelectCourse: (courseId: string) => void;
  className?: string;
}

export function CourseSelector({ onSelectCourse, className }: CourseSelectorProps) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [enrollments, setEnrollments] = useState<UserProgress[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<LMSCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CourseFilters>({});
  const [activeTab, setActiveTab] = useState('all');

  const lmsService = currentUser ? getLMSService(currentUser.uid) : null;

  useEffect(() => {
    if (!lmsService) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allCourses, userEnrollments, recommended] = await Promise.all([
          lmsService.getCourses(filters),
          lmsService.getUserEnrollments(),
          lmsService.getRecommendedCourses(),
        ]);

        setCourses(allCourses);
        setEnrollments(userEnrollments);
        setRecommendedCourses(recommended);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [lmsService, filters]);

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
        onClick={() => onSelectCourse(course.id)}
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
              {course.enrollmentCount && (
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
              <Button className="w-full" size="sm">
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
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Learning Center</h1>
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
