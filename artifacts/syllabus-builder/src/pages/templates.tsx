import React from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useCreateCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layers, FileText, ArrowRight, Code, Database, Server, Smartphone, Laptop, Globe, Shield, Terminal } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const TEMPLATES = [
  {
    id: "fs-web",
    name: "Full Stack Development",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    description: "End-to-end web development with React, Node.js, and MongoDB.",
    moduleCount: 6,
    topicCount: 24,
    content: {
      courseTitle: "MERN Full Stack Web Development",
      courseDescription: "Comprehensive training program covering frontend and backend technologies.",
      modules: [
        { title: "Frontend Basics (HTML/CSS/JS)", topics: ["HTML5 Semantics", "CSS3 Flexbox & Grid", "JS ES6+ Features", "DOM Manipulation"] },
        { title: "React Fundamentals", topics: ["React Components", "State & Props", "React Router", "Hooks (useState, useEffect)"] },
        { title: "Node.js & Express", topics: ["Node Architecture", "Express Routing", "Middleware", "REST API Design"] },
        { title: "MongoDB & Mongoose", topics: ["NoSQL Basics", "CRUD Operations", "Data Modeling", "Aggregations"] },
        { title: "Authentication & Security", topics: ["JWT Tokens", "Password Hashing", "Role-based Access Control", "CORS"] },
        { title: "Deployment & DevOps", topics: ["Docker Basics", "Vercel Deployment", "AWS EC2 Basics", "CI/CD Pipelines"] }
      ]
    }
  },
  {
    id: "java-prog",
    name: "Java Programming",
    icon: Code,
    color: "from-orange-500 to-amber-500",
    description: "Core and advanced Java concepts for enterprise applications.",
    moduleCount: 5,
    topicCount: 18,
    content: {
      courseTitle: "Complete Java Programming",
      courseDescription: "From basic syntax to advanced enterprise concepts using Java 17+.",
      modules: [
        { title: "Java Fundamentals", topics: ["Variables & Data Types", "Control Structures", "Arrays & Strings"] },
        { title: "Object Oriented Programming", topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Interfaces & Abstract Classes"] },
        { title: "Collections & Generics", topics: ["List & Set Interfaces", "Maps & HashMaps", "Custom Generics", "Iterators"] },
        { title: "Advanced Features", topics: ["Exception Handling", "File I/O", "Multithreading", "Java 8 Streams"] },
        { title: "Database Connectivity", topics: ["JDBC Basics", "Connection Pooling", "Prepared Statements"] }
      ]
    }
  },
  {
    id: "spring-boot",
    name: "Spring Boot",
    icon: Server,
    color: "from-green-500 to-emerald-500",
    description: "Build robust REST APIs and microservices with Spring Boot.",
    moduleCount: 4,
    topicCount: 16,
    content: {
      courseTitle: "Spring Boot Microservices",
      courseDescription: "Master building scalable backend systems with the Spring ecosystem.",
      modules: [
        { title: "Spring Core Concepts", topics: ["Dependency Injection", "Application Context", "Spring Beans"] },
        { title: "RESTful Web Services", topics: ["Spring Web MVC", "Controller Annotations", "Exception Handling", "Validation"] },
        { title: "Data Persistence", topics: ["Spring Data JPA", "Hibernate", "Entity Relationships", "JPQL"] },
        { title: "Security & Testing", topics: ["Spring Security", "OAuth2 & JWT", "JUnit & Mockito", "Integration Testing"] }
      ]
    }
  },
  {
    id: "react-dev",
    name: "React Development",
    icon: Laptop,
    color: "from-cyan-500 to-blue-600",
    description: "Modern frontend development with React and ecosystem tools.",
    moduleCount: 4,
    topicCount: 15,
    content: {
      courseTitle: "Advanced React Mastery",
      courseDescription: "Deep dive into React, State Management, and Performance.",
      modules: [
        { title: "React Core", topics: ["Component Lifecycle", "Context API", "Custom Hooks", "React Patterns"] },
        { title: "State Management", topics: ["Redux Toolkit", "RTK Query", "Zustand Basics"] },
        { title: "Performance Optimization", topics: ["useMemo & useCallback", "Code Splitting", "Virtual DOM Insights"] },
        { title: "Testing & Ecosystem", topics: ["Jest Fundamentals", "React Testing Library", "Next.js Intro", "Tailwind CSS"] }
      ]
    }
  },
  {
    id: "python-prog",
    name: "Python Programming",
    icon: Terminal,
    color: "from-yellow-400 to-orange-500",
    description: "Versatile Python skills for automation, data, and web.",
    moduleCount: 5,
    topicCount: 19,
    content: {
      courseTitle: "Python for Professionals",
      courseDescription: "Comprehensive Python course from zero to hero.",
      modules: [
        { title: "Python Basics", topics: ["Syntax & Variables", "Lists, Tuples, Sets", "Dictionaries", "Functions"] },
        { title: "Object Oriented Python", topics: ["Classes & Instances", "Magic Methods", "Inheritance", "Decorators"] },
        { title: "Modules & Packages", topics: ["Virtual Environments", "Pip & PyPI", "Creating Packages"] },
        { title: "File Handling & Data", topics: ["Reading/Writing Files", "CSV & JSON", "SQLite Basics"] },
        { title: "Web Scraping & APIs", topics: ["Requests Library", "BeautifulSoup", "Building a Simple Flask API"] }
      ]
    }
  },
  {
    id: "data-science",
    name: "Data Science",
    icon: Database,
    color: "from-violet-500 to-purple-600",
    description: "Data analysis, visualization, and machine learning basics.",
    moduleCount: 4,
    topicCount: 16,
    content: {
      courseTitle: "Data Science Bootcamp",
      courseDescription: "Learn to extract insights and build predictive models from data.",
      modules: [
        { title: "Data Manipulation", topics: ["NumPy Basics", "Pandas DataFrames", "Data Cleaning", "Handling Missing Values"] },
        { title: "Data Visualization", topics: ["Matplotlib", "Seaborn", "Plotly Interactive Charts"] },
        { title: "Statistical Foundation", topics: ["Probability", "Hypothesis Testing", "A/B Testing"] },
        { title: "Machine Learning", topics: ["Scikit-Learn Intro", "Linear Regression", "Classification Models", "Model Evaluation"] }
      ]
    }
  },
  {
    id: "testing",
    name: "Software Testing",
    icon: Shield,
    color: "from-rose-500 to-red-600",
    description: "Quality assurance, manual testing, and test automation.",
    moduleCount: 4,
    topicCount: 14,
    content: {
      courseTitle: "QA & Test Automation",
      courseDescription: "Master software testing methodologies and automation tools.",
      modules: [
        { title: "Testing Fundamentals", topics: ["Software Testing Life Cycle", "Test Planning", "Bug Reporting", "Agile Testing"] },
        { title: "Selenium WebDriver", topics: ["Selenium Architecture", "Locators (XPath/CSS)", "Handling Web Elements"] },
        { title: "Test Frameworks", topics: ["TestNG", "Data Driven Testing", "Page Object Model"] },
        { title: "API Testing", topics: ["Postman Setup", "REST Assured Basics", "Automated API Checks"] }
      ]
    }
  },
  {
    id: "devops",
    name: "DevOps Engineering",
    icon: Layers,
    color: "from-slate-600 to-gray-800",
    description: "CI/CD, containerization, and infrastructure as code.",
    moduleCount: 5,
    topicCount: 18,
    content: {
      courseTitle: "DevOps Masterclass",
      courseDescription: "Bridge the gap between development and operations.",
      modules: [
        { title: "Linux & Git", topics: ["Linux Administration", "Bash Scripting", "Advanced Git Workflows"] },
        { title: "Containerization", topics: ["Docker Fundamentals", "Dockerfiles", "Docker Compose"] },
        { title: "CI/CD Pipelines", topics: ["Jenkins Setup", "Declarative Pipelines", "GitHub Actions"] },
        { title: "Container Orchestration", topics: ["Kubernetes Architecture", "K8s Deployments & Services", "Helm"] },
        { title: "Infrastructure & Cloud", topics: ["AWS Core Services", "Terraform Basics", "Monitoring with Prometheus/Grafana"] }
      ]
    }
  }
];

export default function Templates() {
  const [, setLocation] = useLocation();
  const createCourse = useCreateCourse();

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    // Generate UUIDs for the template data
    const modulesWithIds = template.content.modules.map(mod => ({
      id: uuidv4(),
      title: mod.title,
      topics: mod.topics.map(t => ({
        id: uuidv4(),
        title: t,
        notes: ""
      }))
    }));

    const course = await createCourse.mutateAsync({
      courseTitle: template.content.courseTitle,
      courseDescription: template.content.courseDescription,
      instituteName: "My Institute",
    });

    // Directly update storage with the modules
    import('@/lib/storage').then(async (storage) => {
      course.modules = modulesWithIds;
      await storage.saveCourse(course);
      setLocation(`/builder/${course.id}`);
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Template Library</h1>
            <p className="text-muted-foreground mt-1">Start quickly with industry-standard curriculum templates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
                <div className={`h-24 bg-gradient-to-br ${template.color} relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <Icon className="w-12 h-12 text-white/90 drop-shadow-md z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold font-display mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{template.description}</p>
                  
                  <div className="flex gap-3 mb-6">
                    <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1.5" />
                      {template.moduleCount} Mods
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      {template.topicCount} Topics
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-auto font-medium" 
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
