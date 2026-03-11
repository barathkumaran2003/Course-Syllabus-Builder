import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useCreateCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Wand2, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const CATEGORY_SYLLABUS_MAP: Record<string, any> = {
  "Full Stack": [
    { title: "Frontend Fundamentals", topics: ["HTML5 & CSS3 Basics", "JavaScript ES6+", "Responsive Design with Tailwind"] },
    { title: "React SPA", topics: ["Components & Props", "State & Effect Hooks", "React Router", "State Management (Redux/Zustand)"] },
    { title: "Backend with Node.js", topics: ["Node.js & Express Basics", "RESTful APIs", "Middleware & Error Handling"] },
    { title: "Database & Deployment", topics: ["MongoDB & Mongoose", "SQL Basics (PostgreSQL)", "Docker & CI/CD", "AWS/Vercel Deployment"] }
  ],
  "Java": [
    { title: "Core Java Concepts", topics: ["Variables, Data Types & Operators", "Control Flow & Loops", "Arrays & Strings"] },
    { title: "Object-Oriented Programming", topics: ["Classes & Objects", "Inheritance & Polymorphism", "Abstraction & Encapsulation"] },
    { title: "Advanced Java", topics: ["Collections Framework", "Exception Handling", "Multithreading & Concurrency", "Java 8 Streams & Lambdas"] }
  ],
  "Python": [
    { title: "Python Basics", topics: ["Syntax & Variables", "Control Structures", "Functions & Modules"] },
    { title: "Data Structures", topics: ["Lists & Tuples", "Dictionaries & Sets", "List Comprehensions"] },
    { title: "Object-Oriented Python", topics: ["Classes & Inheritance", "Magic Methods", "File I/O"] },
    { title: "Advanced Python", topics: ["Decorators & Generators", "Regular Expressions", "Error Handling"] }
  ],
  "React": [
    { title: "React Fundamentals", topics: ["JSX & Elements", "Components, Props & State", "Event Handling"] },
    { title: "Hooks & Lifecycle", topics: ["useState & useEffect", "Custom Hooks", "useContext & useReducer"] },
    { title: "Routing & State Management", topics: ["React Router DOM", "Redux Toolkit", "React Query"] },
    { title: "Performance & Testing", topics: ["Memoization (useMemo, useCallback)", "Jest & React Testing Library"] }
  ],
  "Spring Boot": [
    { title: "Spring Core", topics: ["Dependency Injection (DI)", "Inversion of Control (IoC)", "Spring Beans & Annotations"] },
    { title: "Spring Boot Basics", topics: ["Auto Configuration", "Spring Boot Starters", "REST APIs with Spring Web"] },
    { title: "Data Access", topics: ["Spring Data JPA", "Hibernate ORM", "Transactions"] },
    { title: "Security & Testing", topics: ["Spring Security Basics", "JWT Authentication", "JUnit & Mockito"] }
  ],
  "Data Science": [
    { title: "Math & Stats Foundation", topics: ["Linear Algebra basics", "Probability & Distributions", "Statistical Inference"] },
    { title: "Data Manipulation", topics: ["NumPy Arrays", "Pandas DataFrames", "Data Cleaning & Preprocessing"] },
    { title: "Data Visualization", topics: ["Matplotlib & Seaborn", "Plotly", "Interactive Dashboards"] },
    { title: "Machine Learning Basics", topics: ["Scikit-Learn", "Linear & Logistic Regression", "Decision Trees & Random Forests"] }
  ],
  "Software Testing": [
    { title: "Manual Testing", topics: ["SDLC & STLC", "Test Cases & Bug Reports", "Agile Testing"] },
    { title: "Automated Testing Foundation", topics: ["Selenium WebDriver Basics", "Locators & Waits", "TestNG / JUnit"] },
    { title: "API Testing", topics: ["Postman Basics", "REST Assured", "JSON & XML Payloads"] },
    { title: "CI/CD & Performance", topics: ["JMeter Basics", "Jenkins & Git Integration", "Continuous Testing"] }
  ],
  "DevOps": [
    { title: "Version Control & Linux", topics: ["Git & GitHub workflows", "Linux CLI Basics", "Bash Scripting"] },
    { title: "Containerization", topics: ["Docker Architecture", "Docker Compose", "Building Custom Images"] },
    { title: "Orchestration", topics: ["Kubernetes Architecture", "Pods, Services & Deployments", "Helm Charts"] },
    { title: "CI/CD & Cloud", topics: ["Jenkins Pipelines", "GitHub Actions", "AWS / Azure Basics", "Infrastructure as Code (Terraform)"] }
  ]
};

export default function AIGenerator() {
  const [, setLocation] = useLocation();
  const createCourse = useCreateCourse();
  
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [audience, setAudience] = useState("Beginner");
  const [category, setCategory] = useState("Full Stack");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSyllabus, setGeneratedSyllabus] = useState<any>(null);

  const handleGenerate = () => {
    if (!title || !category) return;
    
    setIsGenerating(true);
    setGeneratedSyllabus(null);
    
    // Simulate AI delay
    setTimeout(() => {
      const template = CATEGORY_SYLLABUS_MAP[category] || CATEGORY_SYLLABUS_MAP["Full Stack"];
      
      const modules = template.map((mod: any) => ({
        id: uuidv4(),
        title: mod.title,
        topics: mod.topics.map((t: string) => ({
          id: uuidv4(),
          title: t,
          notes: `Covering best practices and real-world applications for ${t}.`
        }))
      }));
      
      setGeneratedSyllabus({
        courseTitle: title,
        courseDescription: `A comprehensive ${duration ? duration + " " : ""}course on ${category} designed for ${audience.toLowerCase()}s.`,
        instituteName: "My Institute",
        modules
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleUseSyllabus = async () => {
    if (!generatedSyllabus) return;
    
    const course = await createCourse.mutateAsync({
      courseTitle: generatedSyllabus.courseTitle,
      courseDescription: generatedSyllabus.courseDescription,
      instituteName: generatedSyllabus.instituteName,
    });
    
    // We update the newly created course with the generated modules
    // To do this we can use the storage function directly or modify useCreateCourse, 
    // but the easiest way is to push it through idb after creating, or pass modules in create.
    // Our createCourse hook takes Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'>
    // So we'll have to use updateCourse hook. Let's just import storage directly here for speed.
    import('@/lib/storage').then(async (storage) => {
      course.modules = generatedSyllabus.modules;
      await storage.saveCourse(course);
      setLocation(`/builder/${course.id}`);
    });
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center p-8 glass-card rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 mb-6">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-3">AI Syllabus Generator</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Instantly generate a complete, professional course structure tailored to your audience using AI-powered keyword mapping.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 glass-card shadow-lg sticky top-6">
              <h3 className="font-semibold text-xl mb-6">Course Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input 
                    placeholder="e.g. Master Modern React" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORY_SYLLABUS_MAP).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Duration (Optional)</Label>
                  <Input 
                    placeholder="e.g. 8 Weeks, 40 Hours" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full mt-4 h-12 text-md shadow-lg shadow-primary/25 rounded-xl transition-all"
                  onClick={handleGenerate}
                  disabled={!title || !category || isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="w-5 h-5 mr-2" /> Generate Syllabus</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 glass-card rounded-2xl border-dashed border-2 border-primary/30"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-foreground mb-2">Analyzing Requirements...</h3>
                  <p className="text-muted-foreground">Structuring curriculum for {category} ({audience})</p>
                </motion.div>
              ) : generatedSyllabus ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-500/20">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-3" />
                      <span className="font-medium">Syllabus generated successfully!</span>
                    </div>
                    <Button onClick={handleUseSyllabus} className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20">
                      Use This Syllabus <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  <Card className="p-8 shadow-xl border-t-4 border-t-primary">
                    <div className="mb-8 border-b pb-6">
                      <h2 className="text-3xl font-display font-bold mb-2">{generatedSyllabus.courseTitle}</h2>
                      <p className="text-muted-foreground text-lg">{generatedSyllabus.courseDescription}</p>
                    </div>
                    
                    <div className="space-y-8">
                      {generatedSyllabus.modules.map((mod: any, i: number) => (
                        <div key={i} className="space-y-3">
                          <h3 className="text-xl font-bold flex items-center text-foreground">
                            <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3">
                              {i + 1}
                            </span>
                            {mod.title}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                            {mod.topics.map((topic: any, j: number) => (
                              <div key={j} className="bg-muted/50 p-3 rounded-lg border border-border/50 text-sm">
                                <span className="font-medium">{topic.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 glass-card rounded-2xl border-dashed border-2 border-border"
                >
                  <Wand2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">Ready to generate</h3>
                  <p className="text-muted-foreground/70 text-center max-w-md">
                    Fill out the course details on the left and click generate to instantly build a complete syllabus structure.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
