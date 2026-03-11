import React, { useRef } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, ShieldAlert, FileJson, Info } from "lucide-react";
import * as storage from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await storage.getAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syllabus_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export successful", description: "Your data has been downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: "Could not export data.", variant: "destructive" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await storage.importData(json);
        toast({ title: "Import successful", description: "Data has been restored. Reloading..." });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({ title: "Import failed", description: "Invalid JSON file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    await storage.clearAllData();
    toast({ title: "Data cleared", description: "All local data has been removed. Reloading..." });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application data and preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-xl font-semibold flex items-center"><FileJson className="w-5 h-5 mr-2 text-primary" /> Data Management</h3>
            <p className="text-sm text-muted-foreground">
              All your courses and branding data are stored locally in your browser. Use these tools to backup your data or move it to another device.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExport} className="flex-1 bg-primary text-primary-foreground h-12 shadow-lg shadow-primary/20">
                <Download className="w-4 h-4 mr-2" /> Export All Data (JSON)
              </Button>
              
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 h-12">
                <Upload className="w-4 h-4 mr-2" /> Import Data
              </Button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImport} 
              />
            </div>
          </Card>

          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <h3 className="text-xl font-semibold text-destructive flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Danger Zone</h3>
            <p className="text-sm text-destructive/80 mt-2 mb-6">
              This action will permanently delete all courses, versions, and branding settings from your browser. This cannot be undone unless you have a backup.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-12 shadow-lg shadow-destructive/20">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your data from the local database. You will lose all courses and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>

          <Card className="p-6 bg-muted/30">
            <h3 className="text-xl font-semibold flex items-center mb-4"><Info className="w-5 h-5 mr-2 text-muted-foreground" /> About</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>App Version:</strong> 1.2.0</p>
              <p><strong>Storage:</strong> IndexedDB (Browser Local)</p>
              <p><strong>Offline Capable:</strong> Yes</p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
