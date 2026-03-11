import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useCourse, useVersions, useRestoreVersion } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { History as HistoryIcon, ArrowLeftRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

export default function History() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: versions = [], isLoading: versionsLoading } = useVersions(courseId);
  const restoreVersion = useRestoreVersion();
  const { toast } = useToast();

  const [versionToRestore, setVersionToRestore] = useState<string | null>(null);

  const handleRestore = async () => {
    if (versionToRestore) {
      await restoreVersion.mutateAsync(versionToRestore);
      toast({ title: "Version Restored", description: "The current state has been backed up." });
      setVersionToRestore(null);
    }
  };

  if (courseLoading || versionsLoading) {
    return <Layout activeCourseId={courseId}><div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin" /></div></Layout>;
  }

  return (
    <Layout activeCourseId={courseId}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Version History</h1>
          <p className="text-muted-foreground mt-1">Restore previous snapshots of <b>{course?.courseTitle}</b>.</p>
        </div>

        {versions.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {versions.map((version) => (
              <div key={version.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <HistoryIcon className="w-4 h-4" />
                </div>
                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 glass-card hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-foreground">{format(version.savedAt, "MMM d, yyyy")}</h4>
                      <p className="text-xs text-muted-foreground">{format(version.savedAt, "h:mm a")}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-lg h-8"
                      onClick={() => setVersionToRestore(version.id)}
                    >
                      <ArrowLeftRight className="w-3 h-3 mr-1" /> Restore
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-3 flex items-center gap-4 bg-muted/50 p-2 rounded-lg">
                    <span>{version.snapshot.modules.length} modules</span>
                    <span>{version.snapshot.modules.reduce((acc, m) => acc + m.topics.length, 0)} topics</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed glass-card">
            <HistoryIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No version history</h3>
            <p className="text-muted-foreground mt-2">
              Save snapshots in the Builder to create restore points.
            </p>
          </Card>
        )}

        <AlertDialog open={!!versionToRestore} onOpenChange={(open) => !open && setVersionToRestore(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Restore this version?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace your current syllabus with this snapshot. Your current working state will automatically be saved as a new version before restoring.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore} className="bg-primary rounded-xl">
                Yes, Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
