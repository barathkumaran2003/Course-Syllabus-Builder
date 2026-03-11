import React, { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useCourse, useUpdateCourse, useCreateVersion } from "@/hooks/use-courses";
import { Course, Module, Topic } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { useBranding } from "@/contexts/branding-context";
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Plus, GripVertical, Trash2, ChevronDown, ChevronRight, Save, Upload, Loader2, CheckCircle2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Builder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: initialCourse, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse();
  const createVersion = useCreateVersion();
  const { toast } = useToast();
  const { branding } = useBranding();

  const [course, setCourse] = useState<Course | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Track last-known branding name to detect changes vs. user customization
  const prevBrandingNameRef = useRef<string | null>(null);

  // Initialize local state when data loads; pre-fill instituteName from branding if empty
  useEffect(() => {
    if (initialCourse && !course) {
      const brandingName = branding?.instituteName ?? "";
      const resolvedName = initialCourse.instituteName || brandingName;
      setCourse({ ...initialCourse, instituteName: resolvedName });
      prevBrandingNameRef.current = brandingName;
    }
  }, [initialCourse, branding]);

  // Auto-sync instituteName when branding changes (only if user hasn't customized it)
  useEffect(() => {
    if (!branding || !course) return;
    const prev = prevBrandingNameRef.current;
    const newBrandingName = branding.instituteName;
    if (newBrandingName !== prev) {
      // If course name still matches old branding value, update it to new branding value
      if (course.instituteName === prev || course.instituteName === "") {
        setCourse(c => c ? { ...c, instituteName: newBrandingName } : c);
        setSaveStatus('unsaved');
      }
      prevBrandingNameRef.current = newBrandingName;
    }
  }, [branding]);

  // Debounced Auto-save
  useEffect(() => {
    if (!course || saveStatus !== 'unsaved') return;
    
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await updateCourse.mutateAsync(course);
      setSaveStatus('saved');
    }, 2000);

    return () => clearTimeout(timer);
  }, [course, saveStatus, updateCourse]);

  const updateField = (field: keyof Course, value: any) => {
    setCourse(prev => prev ? { ...prev, [field]: value } : null);
    setSaveStatus('unsaved');
  };

  const addModule = () => {
    if (!course) return;
    const newModule: Module = { id: uuidv4(), title: "New Module", topics: [] };
    setCourse({ ...course, modules: [...course.modules, newModule] });
    setSaveStatus('unsaved');
  };

  const handleManualSaveVersion = async () => {
    if (!course) return;
    setSaveStatus('saving');
    const updated = await updateCourse.mutateAsync(course);
    await createVersion.mutateAsync(updated);
    setSaveStatus('saved');
    toast({ title: "Version saved", description: "A snapshot has been added to history." });
  };

  // DND Setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !course) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      // Is it a module drag?
      const isModule = course.modules.some(m => m.id === activeId);
      if (isModule) {
        const oldIndex = course.modules.findIndex(m => m.id === activeId);
        const newIndex = course.modules.findIndex(m => m.id === overId);
        setCourse({
          ...course,
          modules: arrayMove(course.modules, oldIndex, newIndex)
        });
        setSaveStatus('unsaved');
      }
      // Topic dragging is handled within the ModuleItem component via callbacks to simplify parent state
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('instituteLogo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading || !course) {
    return <Layout activeCourseId={courseId}><div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout activeCourseId={courseId}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Syllabus Builder</h1>
          <div className="flex items-center text-sm mt-1">
            {saveStatus === 'saving' && <span className="text-muted-foreground flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
            {saveStatus === 'saved' && <span className="text-emerald-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> All changes saved locally</span>}
            {saveStatus === 'unsaved' && <span className="text-amber-600">Unsaved changes</span>}
          </div>
        </div>
        <Button 
          onClick={handleManualSaveVersion} 
          variant="outline" 
          className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
        >
          <Save className="w-4 h-4 mr-2" /> Save Snapshot
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
        {/* Left Panel: Course Meta */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <Card className="p-5 glass-card rounded-2xl space-y-5">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Course Title</Label>
              <Input 
                value={course.courseTitle} 
                onChange={(e) => updateField('courseTitle', e.target.value)} 
                className="mt-1.5 font-semibold text-lg h-12 bg-white/50"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Institute Name</Label>
              <Input 
                value={course.instituteName} 
                onChange={(e) => updateField('instituteName', e.target.value)} 
                className="mt-1.5 bg-white/50"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Course Description</Label>
              <Textarea 
                value={course.courseDescription} 
                onChange={(e) => updateField('courseDescription', e.target.value)} 
                className="mt-1.5 min-h-[120px] bg-white/50 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Institute Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {(course.instituteLogo || branding?.logo) ? (
                  <img src={course.instituteLogo || branding?.logo} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg border p-1 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel: Modules DND */}
        <div className="lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar pb-20">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={course.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {course.modules.map((module) => (
                  <SortableModule 
                    key={module.id} 
                    module={module} 
                    course={course}
                    setCourse={setCourse}
                    setSaveStatus={setSaveStatus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <Button 
            onClick={addModule} 
            variant="outline" 
            className="w-full mt-6 h-14 border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Module
          </Button>
        </div>
      </div>
    </Layout>
  );
}

// Sub-component for Module
function SortableModule({ module, course, setCourse, setSaveStatus }: any) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const updateTitle = (val: string) => {
    const updated = course.modules.map((m: Module) => m.id === module.id ? { ...m, title: val } : m);
    setCourse({ ...course, modules: updated });
    setSaveStatus('unsaved');
  };

  const deleteModule = () => {
    const updated = course.modules.filter((m: Module) => m.id !== module.id);
    setCourse({ ...course, modules: updated });
    setSaveStatus('unsaved');
  };

  const addTopic = () => {
    const newTopic: Topic = { id: uuidv4(), title: "New Topic", notes: "" };
    const updated = course.modules.map((m: Module) => 
      m.id === module.id ? { ...m, topics: [...m.topics, newTopic] } : m
    );
    setCourse({ ...course, modules: updated });
    setSaveStatus('unsaved');
    setExpanded(true);
  };

  const handleTopicDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = module.topics.findIndex((t: Topic) => t.id === active.id);
      const newIndex = module.topics.findIndex((t: Topic) => t.id === over.id);
      const reorderedTopics = arrayMove(module.topics, oldIndex, newIndex);
      
      const updated = course.modules.map((m: Module) => 
        m.id === module.id ? { ...m, topics: reorderedTopics } : m
      );
      setCourse({ ...course, modules: updated });
      setSaveStatus('unsaved');
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-2xl border ${isDragging ? 'shadow-2xl border-primary' : 'shadow-sm border-border'} overflow-hidden transition-colors`}>
      {/* Module Header */}
      <div className="flex items-center p-3 bg-muted/30 border-b border-border/50 group">
        <button {...attributes} {...listeners} className="p-2 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="w-5 h-5" />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="p-2 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <Input 
          value={module.title} 
          onChange={(e) => updateTitle(e.target.value)} 
          className="flex-1 border-transparent bg-transparent font-semibold text-lg hover:border-border focus:border-primary focus:bg-white transition-all h-10 px-2 shadow-none"
        />
        <Button variant="ghost" size="icon" onClick={deleteModule} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Topics List */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 bg-white/50 space-y-3">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleTopicDragEnd}>
                <SortableContext items={module.topics.map((t: Topic) => t.id)} strategy={verticalListSortingStrategy}>
                  {module.topics.map((topic: Topic) => (
                    <SortableTopic 
                      key={topic.id} 
                      topic={topic} 
                      moduleId={module.id}
                      course={course}
                      setCourse={setCourse}
                      setSaveStatus={setSaveStatus}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button onClick={addTopic} variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 ml-8">
                <Plus className="w-4 h-4 mr-1" /> Add Topic
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Topic
import { AnimatePresence } from "framer-motion";
function SortableTopic({ topic, moduleId, course, setCourse, setSaveStatus }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const updateTopic = (field: 'title' | 'notes', val: string) => {
    const updated = course.modules.map((m: Module) => {
      if (m.id === moduleId) {
        return {
          ...m,
          topics: m.topics.map(t => t.id === topic.id ? { ...t, [field]: val } : t)
        };
      }
      return m;
    });
    setCourse({ ...course, modules: updated });
    setSaveStatus('unsaved');
  };

  const deleteTopic = () => {
    const updated = course.modules.map((m: Module) => {
      if (m.id === moduleId) {
        return { ...m, topics: m.topics.filter(t => t.id !== topic.id) };
      }
      return m;
    });
    setCourse({ ...course, modules: updated });
    setSaveStatus('unsaved');
  };

  return (
    <div ref={setNodeRef} style={style} className={`ml-8 flex items-start gap-2 group ${isDragging ? 'opacity-50' : ''}`}>
      <button {...attributes} {...listeners} className="mt-2 text-muted-foreground/50 hover:text-foreground cursor-grab">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 bg-white border border-border/60 rounded-xl p-3 shadow-sm group-hover:border-primary/30 transition-colors">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <Input 
              value={topic.title} 
              onChange={(e) => updateTopic('title', e.target.value)} 
              placeholder="Topic Title"
              className="h-8 border-transparent hover:border-border focus:border-primary shadow-none px-2 font-medium"
            />
            <Textarea 
              value={topic.notes} 
              onChange={(e) => updateTopic('notes', e.target.value)} 
              placeholder="Brief notes or description..."
              className="min-h-[60px] text-sm resize-none border-transparent hover:border-border focus:border-primary shadow-none px-2 py-1"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={deleteTopic} className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
