import { get, set, keys, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Course, Version, DashboardStats } from './types';

const COURSES_PREFIX = 'course_';
const VERSIONS_PREFIX = 'version_';

// Helpers
const getCourseKey = (id: string) => `${COURSES_PREFIX}${id}`;
const getVersionKey = (id: string) => `${VERSIONS_PREFIX}${id}`;

// Courses
export async function getCourses(): Promise<Course[]> {
  const allKeys = await keys();
  const courseKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(COURSES_PREFIX));
  const courses = await Promise.all(courseKeys.map(k => get<Course>(k as string)));
  return courses.filter((c): c is Course => c !== undefined).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getCourse(id: string): Promise<Course | undefined> {
  return get<Course>(getCourseKey(id));
}

export async function saveCourse(course: Course): Promise<Course> {
  const updatedCourse = { ...course, updatedAt: Date.now() };
  await set(getCourseKey(course.id), updatedCourse);
  return updatedCourse;
}

export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'>): Promise<Course> {
  const course: Course = {
    ...data,
    id: uuidv4(),
    modules: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(getCourseKey(course.id), course);
  return course;
}

export async function deleteCourse(id: string): Promise<void> {
  await del(getCourseKey(id));
  // Cleanup related versions
  const allVersions = await getVersions(id);
  await Promise.all(allVersions.map(v => del(getVersionKey(v.id))));
}

export async function duplicateCourse(id: string): Promise<Course> {
  const source = await getCourse(id);
  if (!source) throw new Error("Course not found");

  const duplicate: Course = {
    ...source,
    id: uuidv4(),
    courseTitle: `${source.courseTitle} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Deep clone modules to get fresh IDs
    modules: source.modules.map(m => ({
      ...m,
      id: uuidv4(),
      topics: m.topics.map(t => ({ ...t, id: uuidv4() }))
    }))
  };

  await set(getCourseKey(duplicate.id), duplicate);
  return duplicate;
}

// Versions
export async function getVersions(courseId: string): Promise<Version[]> {
  const allKeys = await keys();
  const versionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(VERSIONS_PREFIX));
  const versions = await Promise.all(versionKeys.map(k => get<Version>(k as string)));
  return versions
    .filter((v): v is Version => v !== undefined && v.courseId === courseId)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function createVersion(course: Course): Promise<Version> {
  const version: Version = {
    id: uuidv4(),
    courseId: course.id,
    savedAt: Date.now(),
    snapshot: JSON.parse(JSON.stringify(course)), // Deep clone
  };
  await set(getVersionKey(version.id), version);
  return version;
}

export async function restoreVersion(versionId: string): Promise<Course> {
  const version = await get<Version>(getVersionKey(versionId));
  if (!version) throw new Error("Version not found");
  
  // Create a backup of current before restoring
  const current = await getCourse(version.courseId);
  if (current) {
    await createVersion(current);
  }

  // Restore snapshot but update timestamp
  const restoredCourse = { ...version.snapshot, updatedAt: Date.now() };
  await set(getCourseKey(restoredCourse.id), restoredCourse);
  return restoredCourse;
}

// Stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const courses = await getCourses();
  const totalCourses = courses.length;
  let totalModules = 0;
  let totalTopics = 0;

  courses.forEach(c => {
    totalModules += c.modules.length;
    c.modules.forEach(m => {
      totalTopics += m.topics.length;
    });
  });

  return { totalCourses, totalModules, totalTopics };
}
