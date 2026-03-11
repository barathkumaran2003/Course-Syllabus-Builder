import React from "react";
import { useDashboardStats, useCourses, useCreateCourse } from "@/hooks/use-courses";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { BookCopy, Layers, FileText, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const createCourse = useCreateCourse();

  const handleCreateNew = async () => {
    const course = await createCourse.mutateAsync({
      courseTitle: "Untitled Course",
      courseDescription: "Enter description here...",
      instituteName: "My Institute",
    });
    setLocation(`/builder/${course.id}`);
  };

  const recentCourses = courses?.slice(0, 4) || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Hero */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl glass-card border-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90 mix-blend-multiply z-10" />
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 p-8 md:p-12 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Craft Premium Syllabi.</h1>
            <p className="text-white/80 text-lg max-w-xl mb-8">
              Design, manage, and export professional course outlines in minutes. 
              No backend required—everything is securely stored in your browser.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 hover-elevate shadow-xl text-base font-semibold px-8 py-6 rounded-xl"
              onClick={handleCreateNew}
              disabled={createCourse.isPending}
            >
              {createCourse.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Create New Course
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Courses" 
            value={stats?.totalCourses ?? 0} 
            icon={BookCopy} 
            loading={statsLoading}
            delay={0.1}
          />
          <StatCard 
            title="Total Modules" 
            value={stats?.totalModules ?? 0} 
            icon={Layers} 
            loading={statsLoading}
            delay={0.2}
          />
          <StatCard 
            title="Total Topics" 
            value={stats?.totalTopics ?? 0} 
            icon={FileText} 
            loading={statsLoading}
            delay={0.3}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Courses</h2>
            <Link href="/courses" className="text-primary font-medium hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {coursesLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.4 }}
                >
                  <Link href={`/builder/${course.id}`}>
                    <Card className="p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer h-full glass-card hover:-translate-y-1">
                      <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">{course.courseTitle}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">{course.courseDescription}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <span>{course.modules.length} modules</span>
                        <span>Updated {formatDistanceToNow(course.updatedAt, { addSuffix: true })}</span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border-2 border-dashed border-border rounded-2xl">
              <p className="text-muted-foreground">No courses yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, loading, delay }: { title: string, value: number, icon: any, loading: boolean, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
    >
      <Card className="p-6 glass-card border border-white/40 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
            )}
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
