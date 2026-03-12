import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { FileDown, Download, Loader2, Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip } from "docx";
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
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // ── Header: Logo ─────────────────────────────────────────────────
      if (displayLogo) {
        try {
          const ext = displayLogo.startsWith("data:image/png") ? "PNG" : "JPEG";
          const logoH = 20;
          const logoW = 40;
          doc.addImage(displayLogo, ext, (pageW - logoW) / 2, y, logoW, logoH);
          y += logoH + 6;
        } catch (_) { /* skip if image fails */ }
      }

      // Course Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(course.courseTitle, contentW);
      doc.text(titleLines, pageW / 2, y, { align: "center" });
      y += titleLines.length * 10 + 3;

      // Institute Name
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(99, 102, 241); // primary indigo
      doc.text(displayInstituteName, pageW / 2, y, { align: "center" });
      y += 8;

      // Separator line
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 10;

      // ── Course Description ────────────────────────────────────────────
      if (course.courseDescription) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105); // slate-600
        const descLines = doc.splitTextToSize(course.courseDescription, contentW);
        checkPageBreak(descLines.length * 6 + 10);
        doc.text(descLines, margin, y);
        y += descLines.length * 6 + 12;
      }

      // ── Modules ───────────────────────────────────────────────────────
      course.modules.forEach((mod, mIndex) => {
        checkPageBreak(18);

        // Numbered badge rect
        const badgeSize = 7;
        const badgeX = margin;
        const badgeY = y - 5.5;
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(String(mIndex + 1), badgeX + badgeSize / 2, badgeY + 5, { align: "center" });

        // Module title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // slate-800
        const modTitle = mod.title;
        doc.text(modTitle, margin + badgeSize + 3, y);
        y += 2;

        // Underline rule
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        // Topics
        if (mod.topics.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184); // slate-400
          checkPageBreak(8);
          doc.text("No topics defined.", margin + 6, y);
          y += 10;
        } else {
          mod.topics.forEach((topic) => {
            // Bullet dot
            const bulletX = margin + 8;
            const bulletY = y - 1.5;
            doc.setFillColor(139, 92, 246); // accent violet
            doc.circle(bulletX, bulletY, 1.2, "F");

            // Topic title (bold)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59); // slate-800
            const topicTitleLines = doc.splitTextToSize(topic.title, contentW - 16);
            checkPageBreak(topicTitleLines.length * 6 + 4);
            doc.text(topicTitleLines, margin + 13, y);
            y += topicTitleLines.length * 6;

            // Topic notes (regular, gray)
            if (topic.notes) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(100, 116, 139); // slate-500
              const notesLines = doc.splitTextToSize(topic.notes, contentW - 16);
              checkPageBreak(notesLines.length * 5.5 + 3);
              doc.text(notesLines, margin + 13, y);
              y += notesLines.length * 5.5 + 5;
            } else {
              y += 4;
            }
          });
        }

        y += 6; // spacing after each module
      });

      doc.save(`${course.courseTitle.replace(/\s+/g, '_')}_Syllabus.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const children: any[] = [];

      // Course Title (centered, large)
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: course.courseTitle,
              bold: true,
              size: 52, // 26pt
              color: "0F172A", // slate-900
            }),
          ],
        })
      );

      // Institute Name (centered, indigo)
      if (displayInstituteName) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: displayInstituteName,
                size: 26, // 13pt
                color: "6366F1", // primary indigo
              }),
            ],
          })
        );
      }

      // Separator (empty paragraph with bottom border)
      children.push(
        new Paragraph({
          spacing: { after: 240 },
          border: {
            bottom: {
              color: "C7D2FE", // indigo-200
              space: 4,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          children: [],
        })
      );

      // Course Description
      if (course.courseDescription) {
        children.push(
          new Paragraph({
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: course.courseDescription,
                size: 22, // 11pt
                color: "475569", // slate-600
              }),
            ],
          })
        );
      }

      // Modules
      course.modules.forEach((mod, mIndex) => {
        // Module heading: "1  Module Title"
        children.push(
          new Paragraph({
            spacing: { before: 400, after: 120 },
            border: {
              bottom: {
                color: "E2E8F0", // slate-200
                space: 4,
                style: BorderStyle.SINGLE,
                size: 4,
              },
            },
            children: [
              new TextRun({
                text: `${mIndex + 1}  `,
                bold: true,
                size: 28, // 14pt
                color: "6366F1", // indigo badge color
              }),
              new TextRun({
                text: mod.title,
                bold: true,
                size: 28, // 14pt
                color: "1E293B", // slate-800
              }),
            ],
          })
        );

        if (mod.topics.length === 0) {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "No topics defined.",
                  italics: true,
                  size: 20,
                  color: "94A3B8", // slate-400
                }),
              ],
            })
          );
        } else {
          mod.topics.forEach((topic) => {
            // Topic title as bullet
            children.push(
              new Paragraph({
                spacing: { before: 120, after: 40 },
                indent: { left: convertInchesToTwip(0.25) },
                children: [
                  new TextRun({ text: "• ", size: 22, color: "8B5CF6" }), // accent violet bullet
                  new TextRun({
                    text: topic.title,
                    bold: true,
                    size: 22, // 11pt
                    color: "1E293B", // slate-800
                  }),
                ],
              })
            );

            // Topic notes
            if (topic.notes) {
              children.push(
                new Paragraph({
                  spacing: { after: 80 },
                  indent: { left: convertInchesToTwip(0.45) },
                  children: [
                    new TextRun({
                      text: topic.notes,
                      size: 20, // 10pt
                      color: "64748B", // slate-500
                    }),
                  ],
                })
              );
            }
          });
        }
      });

      const docFile = new Document({
        numbering: {
          config: [],
        },
        sections: [{ properties: {}, children }],
      });

      const blob = await Packer.toBlob(docFile);
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
