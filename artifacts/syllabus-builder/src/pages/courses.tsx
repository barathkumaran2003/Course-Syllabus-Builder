import React, { useState } from "react";
import { useCourses, useCreateCourse, useDeleteCourse, useDuplicateCourse } from "@/hooks/use-courses";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Search, MoreVertical, Copy, Trash2, Edit3, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Courses() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();
  const duplicateCourse = useDuplicateCourse();
  
  const [search, setSearch] = useState("");
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const filteredCourses = courses.filter(c => 
    c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
    c.instituteName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    const course = await createCourse.mutateAsync({
      courseTitle: "Untitled Course",
      courseDescription: "",
      instituteName: "My Institute",
    });
    setLocation(`/builder/${course.id}`);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateCourse.mutateAsync(id);
    toast({ title: "Course duplicated successfully" });
  };

  const handleDeleteConfirm = async () => {
    if (courseToDelete) {
      await deleteCourse.mutateAsync(courseToDelete);
      toast({ title: "Course deleted" });
      setCourseToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Course Library</h1>
            <p className="text-muted-foreground mt-1">Manage all your syllabi in one place.</p>
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={createCourse.isPending}
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover-elevate rounded-xl px-6"
          >
            {createCourse.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            New Course
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search courses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-white/40 focus:ring-primary shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-primary/30 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                      <BookCopy className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                        <DropdownMenuItem onClick={() => setLocation(`/builder/${course.id}`)}>
                          <Edit3 className="w-4 h-4 mr-2" /> Edit Builder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/preview/${course.id}`)}>
                          <FileText className="w-4 h-4 mr-2" /> Preview & Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicate(course.id)}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => setCourseToDelete(course.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2 line-clamp-1">
                    {course.courseTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1 line-clamp-2 mb-6">
                    {course.courseDescription || "No description provided."}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center bg-muted px-2 py-1 rounded-md">
                      <Layers className="w-3 h-3 mr-1" /> {course.modules.length} mods
                    </span>
                    <span>{formatDistanceToNow(course.updatedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <img src={`${import.meta.env.BASE_URL}images/empty-state.png`} alt="Empty" className="w-64 h-64 mx-auto mb-6 opacity-80" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first syllabus.</p>
            <Button onClick={handleCreate} disabled={createCourse.isPending}>
              Create Course
            </Button>
          </div>
        )}

        <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this course? This action cannot be undone and will remove all associated versions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
