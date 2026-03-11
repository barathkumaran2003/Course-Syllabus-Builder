import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import { Course } from "@/lib/types";

// ============================================
// Local Storage React Query Hooks
// ============================================

export const KEYS = {
  courses: ['courses'],
  course: (id: string) => ['course', id],
  versions: (id: string) => ['versions', id],
  stats: ['stats'],
};

// GET hooks
export function useCourses() {
  return useQuery({
    queryKey: KEYS.courses,
    queryFn: storage.getCourses,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: KEYS.course(id),
    queryFn: () => storage.getCourse(id),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: storage.getDashboardStats,
  });
}

export function useVersions(courseId: string) {
  return useQuery({
    queryKey: KEYS.versions(courseId),
    queryFn: () => storage.getVersions(courseId),
  });
}

// MUTATION hooks
export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.courses });
      queryClient.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.saveCourse,
    onSuccess: (updatedCourse) => {
      queryClient.setQueryData(KEYS.course(updatedCourse.id), updatedCourse);
      queryClient.invalidateQueries({ queryKey: KEYS.courses });
      queryClient.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.deleteCourse,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: KEYS.courses });
      queryClient.removeQueries({ queryKey: KEYS.course(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useDuplicateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.duplicateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.courses });
      queryClient.invalidateQueries({ queryKey: KEYS.stats });
    },
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.createVersion,
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: KEYS.versions(version.courseId) });
    },
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storage.restoreVersion,
    onSuccess: (restoredCourse) => {
      queryClient.setQueryData(KEYS.course(restoredCourse.id), restoredCourse);
      queryClient.invalidateQueries({ queryKey: KEYS.courses });
      queryClient.invalidateQueries({ queryKey: KEYS.versions(restoredCourse.id) });
    },
  });
}
