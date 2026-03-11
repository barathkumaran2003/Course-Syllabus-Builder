export interface Topic {
  id: string;
  title: string;
  notes: string;
}

export interface Module {
  id: string;
  title: string;
  topics: Topic[];
}

export interface Course {
  id: string;
  courseTitle: string;
  courseDescription: string;
  instituteName: string;
  instituteLogo?: string; // base64
  modules: Module[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface Version {
  id: string;
  courseId: string;
  savedAt: number; // timestamp
  snapshot: Course;
}

export interface DashboardStats {
  totalCourses: number;
  totalModules: number;
  totalTopics: number;
}

export interface Branding {
  instituteName: string;
  tagline: string;
  footerText: string;
  logo: string;
  theme: string;
}
