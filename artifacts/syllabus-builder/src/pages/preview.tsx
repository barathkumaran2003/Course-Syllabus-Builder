import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { FileDown, Download, Loader2, Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import pptxgen from "pptxgenjs";
import { useBranding } from "@/contexts/branding-context";

export default function Preview() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const { branding } = useBranding();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPPT, setIsExportingPPT] = useState(false);

  // Resolved values: branding is the source of truth, course fields are fallback
  const displayInstituteName = branding?.instituteName || course?.instituteName || "";
  const displayLogo = branding?.logo || course?.instituteLogo || "";

  if (isLoading || !course) {
    return <Layout activeCourseId={courseId}><div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin" /></div></Layout>;
  }

  const exportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title & Institute
      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      doc.text(course.courseTitle, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(displayInstituteName, 20, yPos);
      yPos += 20;

      // Description
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitDesc = doc.splitTextToSize(course.courseDescription, 170);
      doc.text(splitDesc, 20, yPos);
      yPos += (splitDesc.length * 6) + 15;

      // Modules
      course.modules.forEach((mod, mIndex) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`Module ${mIndex + 1}: ${mod.title}`, 20, yPos);
        yPos += 8;

        const tableData = mod.topics.map((t, i) => [`${i + 1}`, t.title, t.notes]);
        
        if (tableData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [['#', 'Topic', 'Details']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }, // Primary color
            margin: { left: 20, right: 20 },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
        } else {
          yPos += 10;
        }
      });

      doc.save(`${course.courseTitle.replace(/\s+/g, '_')}_Syllabus.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const children: any[] = [
        new Paragraph({
          text: course.courseTitle,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: displayInstituteName,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: course.courseDescription,
          spacing: { after: 400 },
        }),
      ];

      course.modules.forEach((mod, mIndex) => {
        children.push(
          new Paragraph({
            text: `Module ${mIndex + 1}: ${mod.title}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        mod.topics.forEach((t, i) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}. ${t.title}`, bold: true }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              text: t.notes,
              spacing: { after: 100 },
            })
          );
        });
      });

      const doc = new Document({
        sections: [{ properties: {}, children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${course.courseTitle.replace(/\s+/g, '_')}_Syllabus.docx`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const exportPPT = async () => {
    setIsExportingPPT(true);
    try {
      const pres = new pptxgen();
      
      // Cover Slide
      const coverSlide = pres.addSlide();
      coverSlide.background = { color: "1e1b4b" }; // Dark indigo background
      
      coverSlide.addText(course.courseTitle, { 
        x: "10%", y: "40%", w: "80%", h: 1.5, 
        fontSize: 44, color: "ffffff", bold: true, align: "center" 
      });
      
      coverSlide.addText(displayInstituteName, { 
        x: "10%", y: "60%", w: "80%", h: 1, 
        fontSize: 24, color: "a5b4fc", align: "center" 
      });

      // Overview Slide
      const overviewSlide = pres.addSlide();
      overviewSlide.addText("Course Overview", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "333333" });
      overviewSlide.addText(course.courseDescription, { 
        x: 0.5, y: 1.5, w: "90%", h: 3, 
        fontSize: 18, color: "666666", valign: "top" 
      });

      // Module Slides
      course.modules.forEach((mod, idx) => {
        const slide = pres.addSlide();
        slide.addText(`Module ${idx + 1}: ${mod.title}`, { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "4f46e5" }); // Primary color
        
        const topicsList = mod.topics.map((t, i) => `${i + 1}. ${t.title}`);
        if (topicsList.length > 0) {
          slide.addText(topicsList.join("\n"), { 
            x: 0.5, y: 1.5, w: "90%", h: 3.5, 
            fontSize: 20, color: "333333", bullet: true, valign: "top" 
          });
        } else {
          slide.addText("No topics defined.", { x: 0.5, y: 1.5, fontSize: 18, color: "999999", italic: true });
        }
      });

      // Thank You Slide
      const endSlide = pres.addSlide();
      endSlide.background = { color: "1e1b4b" };
      endSlide.addText("Thank You", { 
        x: "10%", y: "45%", w: "80%", h: 1, 
        fontSize: 48, color: "ffffff", bold: true, align: "center" 
      });

      await pres.writeFile({ fileName: `${course.courseTitle.replace(/\s+/g, '_')}_Presentation.pptx` });
    } finally {
      setIsExportingPPT(false);
    }
  };

  return (
    <Layout activeCourseId={courseId}>
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Preview Pane */}
        <div className="flex-1 bg-muted/30 rounded-2xl border p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <Card className="max-w-3xl mx-auto bg-white shadow-xl min-h-[800px] p-10 md:p-16">
            <div className="text-center mb-12 pb-8 border-b-2 border-primary/20">
              {displayLogo && (
                <img src={displayLogo} alt="Logo" className="h-20 mx-auto mb-6 object-contain" />
              )}
              <h1 className="text-4xl font-bold text-slate-900 mb-3 font-display">{course.courseTitle}</h1>
              <p className="text-xl text-primary font-medium">{displayInstituteName}</p>
            </div>

            <div className="mb-10 text-slate-700 leading-relaxed text-lg">
              {course.courseDescription}
            </div>

            <div className="space-y-10">
              {course.modules.map((module, mIndex) => (
                <div key={module.id} className="break-inside-avoid">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center">
                    <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3">
                      {mIndex + 1}
                    </span>
                    {module.title}
                  </h2>
                  <div className="space-y-4 pl-4">
                    {module.topics.map((topic, tIndex) => (
                      <div key={topic.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-accent/40 before:rounded-full">
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">{topic.title}</h3>
                        {topic.notes && <p className="text-slate-600 leading-relaxed">{topic.notes}</p>}
                      </div>
                    ))}
                    {module.topics.length === 0 && <p className="text-slate-400 italic">No topics defined.</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action Pane */}
        <div className="w-full lg:w-80 space-y-6">
          <Card className="p-6 glass-card">
            <h3 className="font-bold text-lg mb-4">Export Options</h3>
            <div className="space-y-3">
              <Button 
                onClick={exportPDF} 
                disabled={isExportingPDF}
                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 hover:-translate-y-0.5 transition-transform"
              >
                {isExportingPDF ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileDown className="w-5 h-5 mr-2" />}
                Export PDF
              </Button>
              <Button 
                onClick={exportDocx} 
                disabled={isExportingDocx}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-transform"
              >
                {isExportingDocx ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Export DOCX
              </Button>
              <Button 
                onClick={exportPPT} 
                disabled={isExportingPPT}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/20 hover:-translate-y-0.5 transition-transform"
              >
                {isExportingPPT ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Presentation className="w-5 h-5 mr-2" />}
                Export PowerPoint
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Generated files will be saved to your downloads folder.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
