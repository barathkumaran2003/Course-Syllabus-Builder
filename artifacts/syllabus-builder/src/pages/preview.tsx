import React, { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useCourse } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { FileDown, Download, Loader2, Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { saveAs } from "file-saver";
import pptxgen from "pptxgenjs";
import { useBranding } from "@/contexts/branding-context";
import html2canvas from "html2canvas";

export default function Preview() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const { branding } = useBranding();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const displayInstituteName = branding?.instituteName || course?.instituteName || "";
  const displayLogo = branding?.logo || course?.instituteLogo || "";

  if (isLoading || !course) {
    return <Layout activeCourseId={courseId}><div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin" /></div></Layout>;
  }

  // Renders the preview card to a canvas, sanitizing oklab/oklch colors first
  const renderPreviewCanvas = async () => {
    if (!previewRef.current) throw new Error("Preview element not available");

    // 1×1 canvas trick: browser natively converts any CSS color (incl. oklab/oklch) to sRGB
    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = colorCanvas.height = 1;
    const ctx = colorCanvas.getContext("2d")!;

    const toRgb = (color: string): string | null => {
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return a < 255
          ? `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`
          : `rgb(${r},${g},${b})`;
      } catch {
        return null;
      }
    };

    const colorProps = [
      "color", "background-color",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "outline-color",
    ];

    // Collect original elements for index-aligned mapping inside onclone
    const originalElements = [
      previewRef.current,
      ...Array.from(previewRef.current.querySelectorAll("*")),
    ] as HTMLElement[];

    return html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc: Document, clonedRoot: HTMLElement) => {
        // ── Step 1: Override CSS custom properties in :root ──────────────
        // html2canvas parses linked CSS files; oklch in those crashes it.
        // Inject an override <style> that converts all CSS vars with oklch/oklab to rgb.
        const varOverrides: string[] = [];

        [...document.styleSheets].forEach((sheet) => {
          try {
            [...sheet.cssRules].forEach((rule) => {
              const styleRule = rule as CSSStyleRule;
              if (!styleRule.style) return;
              for (let i = 0; i < styleRule.style.length; i++) {
                const prop = styleRule.style[i];
                const value = styleRule.style.getPropertyValue(prop).trim();
                if (
                  prop.startsWith("--") &&
                  (value.includes("oklab") || value.includes("oklch"))
                ) {
                  const rgb = toRgb(value);
                  if (rgb) varOverrides.push(`${prop}: ${rgb}`);
                }
              }
            });
          } catch {
            // cross-origin sheets are inaccessible — skip
          }
        });

        if (varOverrides.length > 0) {
          const overrideStyle = clonedDoc.createElement("style");
          overrideStyle.textContent = `:root { ${varOverrides.join("; ")} }`;
          clonedDoc.head.appendChild(overrideStyle);
        }

        // ── Step 2: Override computed colors on every element ────────────
        // Map original ↔ clone by position so we can read original computed styles
        const clonedElements = [
          clonedRoot,
          ...Array.from(clonedRoot.querySelectorAll("*")),
        ] as HTMLElement[];

        originalElements.forEach((origEl, i) => {
          const cloneEl = clonedElements[i];
          if (!cloneEl) return;
          const computed = window.getComputedStyle(origEl);
          colorProps.forEach((prop) => {
            const value = computed.getPropertyValue(prop);
            if (value && (value.includes("oklab") || value.includes("oklch"))) {
              const rgb = toRgb(value);
              if (rgb) cloneEl.style.setProperty(prop, rgb, "important");
            }
          });
        });
      },
    });
  };

  const exportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const canvas = await renderPreviewCanvas();
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgWidth = pageW;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageH;

      // Additional pages for long content
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageH;
      }

      pdf.save(`${course.courseTitle.replace(/\s+/g, "_")}_Syllabus.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const canvas = await renderPreviewCanvas();

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95)
      );
      const arrayBuffer = await blob.arrayBuffer();

      // A4 width at 96dpi ≈ 794px; scale height proportionally
      const docWidthPx = 794;
      const docHeightPx = Math.round((canvas.height / canvas.width) * docWidthPx);

      const docFile = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: arrayBuffer,
                    transformation: { width: docWidthPx, height: docHeightPx },
                    type: "jpg",
                  } as any),
                ],
              }),
            ],
          },
        ],
      });

      const docBlob = await Packer.toBlob(docFile);
      saveAs(docBlob, `${course.courseTitle.replace(/\s+/g, "_")}_Syllabus.docx`);
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
      coverSlide.background = { color: "1e1b4b" };
      coverSlide.addText(course.courseTitle, {
        x: "10%", y: "40%", w: "80%", h: 1.5,
        fontSize: 44, color: "ffffff", bold: true, align: "center",
      });
      coverSlide.addText(displayInstituteName, {
        x: "10%", y: "60%", w: "80%", h: 1,
        fontSize: 24, color: "a5b4fc", align: "center",
      });

      // Overview Slide
      const overviewSlide = pres.addSlide();
      overviewSlide.addText("Course Overview", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "333333" });
      overviewSlide.addText(course.courseDescription, {
        x: 0.5, y: 1.5, w: "90%", h: 3,
        fontSize: 18, color: "666666", valign: "top",
      });

      // Module Slides
      course.modules.forEach((mod, idx) => {
        const slide = pres.addSlide();
        slide.addText(`Module ${idx + 1}: ${mod.title}`, { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "4f46e5" });
        const topicsList = mod.topics.map((t, i) => `${i + 1}. ${t.title}`);
        if (topicsList.length > 0) {
          slide.addText(topicsList.join("\n"), {
            x: 0.5, y: 1.5, w: "90%", h: 3.5,
            fontSize: 20, color: "333333", bullet: true, valign: "top",
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
        fontSize: 48, color: "ffffff", bold: true, align: "center",
      });

      await pres.writeFile({ fileName: `${course.courseTitle.replace(/\s+/g, "_")}_Presentation.pptx` });
    } finally {
      setIsExportingPPT(false);
    }
  };

  return (
    <Layout activeCourseId={courseId}>
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Preview Pane */}
        <div className="flex-1 bg-muted/30 rounded-2xl border p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <Card ref={previewRef} className="max-w-3xl mx-auto bg-white shadow-xl min-h-[800px] p-10 md:p-16">
            <div className="text-center mb-12 pb-8 border-b-2 border-primary/20">
              {displayLogo && (
                <img
                  src={displayLogo}
                  alt="Logo"
                  className="mx-auto mb-6 object-contain"
                  style={{ display: "block", maxWidth: "90px", marginLeft: "auto", marginRight: "auto", marginBottom: "25px" }}
                />
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
                    {module.topics.map((topic) => (
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
