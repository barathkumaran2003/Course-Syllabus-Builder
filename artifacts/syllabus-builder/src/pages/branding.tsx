import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Palette as PaletteIcon, CheckCircle2 } from "lucide-react";
import * as storage from "@/lib/storage";
import { useBranding } from "@/contexts/branding-context";

const THEMES = [
  { id: "indigo", name: "Indigo / Violet", class: "bg-gradient-to-br from-indigo-500 to-violet-500" },
  { id: "blue", name: "Blue / Cyan", class: "bg-gradient-to-br from-blue-500 to-cyan-500" },
  { id: "emerald", name: "Green / Emerald", class: "bg-gradient-to-br from-green-500 to-emerald-500" },
  { id: "amber", name: "Orange / Amber", class: "bg-gradient-to-br from-orange-500 to-amber-500" },
  { id: "rose", name: "Rose / Pink", class: "bg-gradient-to-br from-rose-500 to-pink-500" },
  { id: "slate", name: "Slate / Zinc", class: "bg-gradient-to-br from-slate-600 to-zinc-500" },
];

export default function Branding() {
  const { toast } = useToast();
  const { refreshBranding } = useBranding();
  const [instituteName, setInstituteName] = useState("My Institute");
  const [tagline, setTagline] = useState("Empowering Futures");
  const [footerText, setFooterText] = useState("© 2024 My Institute. All rights reserved.");
  const [logo, setLogo] = useState("");
  const [theme, setTheme] = useState("indigo");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    storage.getBranding().then(data => {
      if (data) {
        setInstituteName(data.instituteName || "My Institute");
        setTagline(data.tagline || "Empowering Futures");
        setFooterText(data.footerText || "© 2024 My Institute. All rights reserved.");
        setLogo(data.logo || "");
        setTheme(data.theme || "indigo");
      }
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await storage.saveBranding({
      instituteName,
      tagline,
      footerText,
      logo,
      theme
    });
    await refreshBranding();
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Branding saved",
        description: "Your institute branding has been updated successfully.",
      });
    }, 500);
  };

  const activeThemeClass = THEMES.find(t => t.id === theme)?.class || THEMES[0].class;

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Institute Branding</h1>
          <p className="text-muted-foreground mt-1">Customize how your generated syllabi look.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 space-y-6 shadow-md border-border/50">
            <h3 className="text-xl font-semibold flex items-center"><PaletteIcon className="w-5 h-5 mr-2 text-primary" /> Branding Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Institute Name</Label>
                <Input value={instituteName} onChange={e => setInstituteName(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input value={footerText} onChange={e => setFooterText(e.target.value)} />
              </div>

              <div className="space-y-2 pt-2">
                <Label>Institute Logo</Label>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden relative">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    Click the box to upload a logo. <br/>Recommended: Square PNG or SVG, transparent background.
                    {logo && (
                      <Button variant="link" size="sm" className="text-destructive p-0 h-auto mt-2 block" onClick={() => setLogo("")}>
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <Label>Color Theme (For PDF Covers)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 ${t.class} ${theme === t.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' : 'opacity-80'}`}
                    >
                      {theme === t.id && <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-4 h-12 text-md shadow-lg shadow-primary/20 rounded-xl"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save Branding</>}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold px-2">Cover Page Preview</h3>
            <Card className="aspect-[1/1.414] shadow-2xl overflow-hidden relative flex flex-col">
              <div className={`h-1/2 w-full ${activeThemeClass} p-10 flex flex-col justify-center text-white relative`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  {logo && <img src={logo} alt="Logo" className="h-16 w-auto mb-6 object-contain filter drop-shadow-lg" />}
                  <h2 className="text-3xl font-bold font-display leading-tight">Course Title Example</h2>
                  <p className="mt-4 text-white/80 uppercase tracking-widest text-sm font-semibold">Course Syllabus</p>
                </div>
              </div>
              <div className="flex-1 bg-white p-10 flex flex-col justify-center relative">
                <div className="absolute top-0 right-10 w-24 h-24 bg-white rounded-full -translate-y-1/2 shadow-xl flex items-center justify-center">
                  <BookCopy className="w-10 h-10 text-primary opacity-50" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{instituteName}</h3>
                  <p className="text-primary font-medium mt-1">{tagline}</p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500">{footerText}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Temporary icon to use in preview
function BookCopy(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M2 16V4a2 2 0 0 1 2-2h11"/>
      <path d="M5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/>
      <rect width="13" height="15" x="9" y="7" rx="2" ry="2"/>
    </svg>
  );
}