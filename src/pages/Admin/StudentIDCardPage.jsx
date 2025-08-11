import React, { useState, useEffect } from "react";
import { Download, Filter, User, Calendar, CreditCard, Phone, Mail, MapPin } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const StudentIDCardPage = () => {
  const API = import.meta.env.VITE_SERVER_URL;
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStudentCard, setSelectedStudentCard] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [schoolLogoDataUrl, setSchoolLogoDataUrl] = useState("");
  const [schoolPhone, setSchoolPhone] = useState(""); // NEW: school number for back footer
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");

  // ======== True-size / layout constants ========
  const CARD_W_MM = 85.6;     // CR80
  const CARD_H_MM = 54.0;
  const HEADER_H_MM = 12.0;   // vector header overlay height

  const PAGE_W_MM = 297; // A4 landscape
  const PAGE_H_MM = 210;

  const PAGE_MARGIN_MM = 10;
  const CARD_GAP_MM = 5;

  // Duplex / crop
  const BLEED_MM = 0;
  const CROP_MARK_LEN_MM = 3.5;
  const CROP_MARK_STROKE_MM = 0.2;
  const DUPLEX_FLIP = "long"; // 'long' or 'short'

  const TRIM_W_MM = CARD_W_MM;
  const TRIM_H_MM = CARD_H_MM;
  const RENDER_W_MM = CARD_W_MM + BLEED_MM * 2;
  const RENDER_H_MM = CARD_H_MM + BLEED_MM * 2;

  // ========= Auth / data loading =========
  const getAuthToken = () => {
    return (
      document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1] ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    );
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${API}classes/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const resData = data?.data || data;
      const rawClasses = Array.isArray(resData?.results)
        ? resData.results
        : Array.isArray(resData)
        ? resData
        : [];

      setClasses(rawClasses);

      if (rawClasses.length > 0) {
        const c0 = rawClasses[0];
        setSchoolName(c0.school_name || c0.school || "SCHOOL NAME");
        const logo = c0.school_logo || c0.logo || c0.school_logo_url || c0.logo_url || "";
        if (logo) setSchoolLogoUrl(logo.startsWith("http") ? logo : `${API}${logo}`);

        // Try to pull a school phone from common keys; fallback if missing
        setSchoolPhone(
          c0.school_phone ||
            c0.phone ||
            c0.contact_number ||
            c0.contact ||
            "+92-XXX-XXXXXXX"
        );
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      setError("Failed to load classes. Please check your connection and try again.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    setLoadingStudents(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${API}api/auth/users/list_profiles/student/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const allStudents = data.data?.results || [];
      const selectedClassObj = classes.find((c) => c.id === classId);
      if (!selectedClassObj) throw new Error("Selected class not found");

      const filteredStudents = allStudents.filter((student) =>
        student.class_name?.includes(selectedClassObj?.class_name)
      );

      setStudents(filteredStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      setError("Failed to load students. Please try again.");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleFilter = () => {
    if (selectedClass && selectedClass.id) {
      fetchStudentsByClass(selectedClass.id);
    } else {
      setError("Please select a class first");
    }
  };

  const issuedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  // ========= helpers =========
  const generateQRCode = (student) => {
    const qrData = {
      name: `${student.first_name} ${student.last_name}`,
      id: student.profile_id,
      class: student.class_name,
      cnic: student.cnic || "Not provided",
      dob: student.date_of_birth || student.dob || "Not provided",
      issued: issuedDate,
      school: schoolName || "SCHOOL NAME",
      father: student.father_name || "Not provided",
      phone: student.phone || "Not provided",
    };
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      JSON.stringify(qrData)
    )}`;
  };

  // Make text/images sharper in capture
  const captureElement = async (el) => {
    return await html2canvas(el, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
    });
  };

  const addCanvasToPdfAt = (pdf, canvas, xMM, yMM, wMM, hMM) => {
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", xMM, yMM, wMM, hMM, undefined, "FAST");
  };

  // Load logo as DataURL once so jsPDF can embed it sharply
  useEffect(() => {
    const loadLogo = async () => {
      if (!schoolLogoUrl) {
        setSchoolLogoDataUrl("");
        return;
      }
      try {
        const res = await fetch(schoolLogoUrl, { mode: "cors" });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => setSchoolLogoDataUrl(reader.result?.toString() || "");
        reader.readAsDataURL(blob);
      } catch {
        setSchoolLogoDataUrl("");
      }
    };
    loadLogo();
  }, [schoolLogoUrl]);

  // IMPROVED: Draw crisp vector header with better scaling
  const overlayVectorHeader = (pdf, x, y, w) => {
    const h = HEADER_H_MM;
    // dark blue bar
    pdf.setFillColor(30, 58, 138);
    pdf.rect(x, y, w, h, "F");

    // logo badge on left
    const pad = 2.2;
    const circleR = h * 0.35;
    const cx = x + pad + circleR;
    const cy = y + h / 2;

    pdf.setFillColor(255, 255, 255);
    pdf.circle(cx, cy, circleR, "F");

    if (schoolLogoDataUrl) {
      const side = circleR * 2 * 0.92;
      pdf.addImage(schoolLogoDataUrl, "PNG", cx - side / 2, cy - side / 2, side, side, undefined, "FAST");
    } else {
      pdf.setTextColor(30, 58, 138);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(circleR * 1.1);
      pdf.text("S", cx, cy + 0.8, { align: "center" });
    }

    // FIXED: Better school name scaling based on card width
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    
    // Calculate font size based on card width for better scaling
    const schoolNameText = schoolName || "SCHOOL NAME";
    let fontSize = Math.min(h * 0.46, w * 0.08); // Scale with both height and width
    
    // Adjust font size based on text length for better fit
    if (schoolNameText.length > 20) {
      fontSize *= 0.8;
    } else if (schoolNameText.length > 15) {
      fontSize *= 0.9;
    }
    
    pdf.setFontSize(fontSize);
    pdf.text(schoolNameText, x + w / 2, y + h / 2 + 1, { align: "center" });
  };

  // ========= Card DOM builders (true-size DOM) =========
  const headerHTML = () => {
    // (kept for on-screen preview; the printed PDF will overlay vector header)
    return `
      <div style="
        background:linear-gradient(90deg,#1e3a8a,#1e40af);
        color:#fff; display:flex; align-items:center; justify-content:space-between;
        padding:2mm 3mm;">
        <div style="width:6.2mm;height:6.2mm;background:#fff;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#1e3a8a;font-weight:800;font-size:3mm">S</div>
        <div style="flex:1;text-align:center;font-weight:800;font-size:3.8mm;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${schoolName || "SCHOOL NAME"}
        </div>
      </div>
    `;
  };

  // NEW: back footer (school phone + lost note)
  const backFooterHTML = () => {
    return `
      <div style="
        border-top:0.3mm solid #e5e7eb;
        padding:1.6mm 3mm 2mm 3mm;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:2mm;
      ">
        <div style="font-size:2.4mm;color:#111827;">
          <b>School:</b> ${schoolPhone || "+92-XXX-XXXXXXX"}
        </div>
        <div style="font-size:2.2mm;color:#374151;text-align:right;line-height:1.25;">
          If this card is lost, please contact the school immediately.
        </div>
      </div>
    `;
  };

  const buildPrintCardNode = (student, side) => {
    const container = document.createElement("div");
    container.style.width = `${CARD_W_MM}mm`;
    container.style.height = `${CARD_H_MM}mm`;
    container.style.background = "#fff";
    container.style.border = "0.6mm solid #1e3a8a";
    container.style.borderRadius = "2mm";
    container.style.overflow = "hidden";
    container.style.boxSizing = "border-box";
    container.style.display = "flex";
    container.style.flexDirection = "column";

    const header = headerHTML();

    if (side === "front") {
      container.innerHTML = `
        ${header}
        <div style="padding:3mm; display:flex; gap:3mm; flex:1; box-sizing:border-box;">
          <div style="width:22mm;height:26mm;background:#e5e7eb;border:0.3mm solid #d1d5db;border-radius:2mm; overflow:hidden; display:flex;align-items:center;justify-content:center;">
            ${
              student.profile_picture
                ? `<img crossOrigin="anonymous" src="${
                    student.profile_picture.startsWith("http") ? student.profile_picture : `${API}${student.profile_picture}`
                  }" style="width:100%;height:100%;object-fit:cover;" />`
                : `
            <svg width="12mm" height="12mm" viewBox="0 0 24 24" fill="none">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="#9ca3af"/>
            </svg>`
            }
          </div>
          <div style="flex:1;font-size:3.1mm;line-height:1.35;color:#111827;">
            <div style="font-weight:900;color:#1e3a8a;margin-bottom:1mm;letter-spacing:.05mm;">STUDENT ID CARD</div>
            <div><b>Name:</b> ${student.first_name} ${student.last_name}</div>
            <div><b>ID:</b> ${student.profile_id}</div>
            <div><b>Class:</b> ${student.class_name || ""}</div>
            <div><b>Father:</b> ${student.father_name || "Not provided"}</div>
            <div><b>Issued:</b> ${issuedDate}</div>
          </div>
        </div>
      `;
    } else {
      // Smaller text on back side as requested
      container.innerHTML = `
        ${header}
        <div style="padding:3mm; display:flex; gap:3mm; flex:1; box-sizing:border-box;">
          <div style="flex:1;font-size:2.8mm; color:#111827;">
            <div style="display:flex;gap:2mm;margin-bottom:1mm;"><span>💳</span><span><b>CNIC:</b> ${
              student.cnic || student.b_form || "Not provided"
            }</span></div>
            <div style="display:flex;gap:2mm;margin-bottom:1mm;"><span>📅</span><span><b>DOB:</b> ${
              student.date_of_birth
                ? new Date(student.date_of_birth).toLocaleDateString()
                : student.dob
                ? new Date(student.dob).toLocaleDateString()
                : "Not provided"
            }</span></div>
            <div style="display:flex;gap:2mm;margin-bottom:2mm;"><span>🩸</span><span><b>Blood:</b> ${
              student.blood_group || "Not provided"
            }</span></div>

            <div style="display:flex;gap:2mm;margin-bottom:1mm; font-size:2.6mm;"><span>📞</span><span>${
              student.phone || student.mobile || "+92-000-0000000"
            }</span></div>
            <div style="display:flex;gap:2mm;margin-bottom:1mm; font-size:2.6mm;"><span>✉️</span><span>${
              student.email || "school@example.com"
            }</span></div>
            <div style="display:flex;gap:2mm; font-size:2.6mm;"><span>📍</span><span>${
              student.address || "Address not provided"
            }</span></div>
          </div>
          <div style="width:24mm;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <img crossOrigin="anonymous" src="${generateQRCode(student)}" style="width:22mm;height:22mm;border:0.3mm solid #e5e7eb;border-radius:2mm;"/>
            <div style="font-size:2.4mm;color:#6b7280;margin-top:1mm;text-align:center;">Scan for Details</div>
          </div>
        </div>
        ${backFooterHTML()}
      `;
    }
    return container;
  };

  const buildPrintCardNodeDuplex = (student, side) => {
    const outer = document.createElement("div");
    outer.style.width = `${RENDER_W_MM}mm`;
    outer.style.height = `${RENDER_H_MM}mm`;
    outer.style.background = "#fff";
    const inner = buildPrintCardNode(student, side);
    inner.style.width = `${TRIM_W_MM}mm`;
    inner.style.height = `${TRIM_H_MM}mm`;
    inner.style.margin = `${BLEED_MM}mm`;
    inner.style.border = inner.style.border || "0.6mm solid #1e3a8a";
    outer.appendChild(inner);
    return outer;
  };

  const drawCropMarks = (pdf, x, y, w, h) => {
    pdf.setLineWidth(CROP_MARK_STROKE_MM);
    pdf.line(x - CROP_MARK_LEN_MM, y, x, y);
    pdf.line(x, y - CROP_MARK_LEN_MM, x, y);
    pdf.line(x + w, y, x + w + CROP_MARK_LEN_MM, y);
    pdf.line(x + w, y - CROP_MARK_LEN_MM, x + w, y);
    pdf.line(x - CROP_MARK_LEN_MM, y + h, x, y + h);
    pdf.line(x, y + h, x, y + h + CROP_MARK_LEN_MM);
    pdf.line(x + w, y + h, x + w + CROP_MARK_LEN_MM, y + h);
    pdf.line(x + w, y + h, x + w, y + h + CROP_MARK_LEN_MM);
  };

  // IMPROVED: Helper function to simulate async delay for progress
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ========= Generators =========

  // Bulk TRUE-SIZE (fronts then backs)
  const generatePDF = async () => {
    if (students.length === 0) {
      alert("No cards to generate!");
      return;
    }
    setLoadingPDF(true);
    setProgress(0);

    const usableW = PAGE_W_MM - PAGE_MARGIN_MM * 2;
    const usableH = PAGE_H_MM - PAGE_MARGIN_MM * 2;
    const cols = Math.max(1, Math.floor((usableW + CARD_GAP_MM) / (CARD_W_MM + CARD_GAP_MM)));
    const rows = Math.max(1, Math.floor((usableH + CARD_GAP_MM) / (CARD_H_MM + CARD_GAP_MM)));

    try {
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-10000px";
      host.style.top = "0";
      host.id = "print-host";
      document.body.appendChild(host);

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });

      let processed = 0;
      const totalFaces = students.length * 2;

      // FRONT pages
      let i = 0;
      while (i < students.length) {
        if (i > 0) pdf.addPage("a4", "landscape");
        for (let r = 0; r < rows && i < students.length; r++) {
          for (let c = 0; c < cols && i < students.length; c++) {
            const node = buildPrintCardNode(students[i], "front");
            host.appendChild(node);
            const canvas = await captureElement(node);
            const x = PAGE_MARGIN_MM + c * (CARD_W_MM + CARD_GAP_MM);
            const y = PAGE_MARGIN_MM + r * (CARD_H_MM + CARD_GAP_MM);
            addCanvasToPdfAt(pdf, canvas, x, y, CARD_W_MM, CARD_H_MM);

            // overlay sharp header
            overlayVectorHeader(pdf, x, y, CARD_W_MM);

            i++;
            processed++;
            setProgress(Math.min(95, Math.round((processed / totalFaces) * 100)));
          }
        }
      }

      // BACK pages
      pdf.addPage("a4", "landscape");
      i = 0;
      while (i < students.length) {
        if (i > 0) pdf.addPage("a4", "landscape");
        for (let r = 0; r < rows && i < students.length; r++) {
          for (let c = 0; c < cols && i < students.length; c++) {
            const node = buildPrintCardNode(students[i], "back");
            host.appendChild(node);
            const canvas = await captureElement(node);
            const x = PAGE_MARGIN_MM + c * (CARD_W_MM + CARD_GAP_MM);
            const y = PAGE_MARGIN_MM + r * (CARD_H_MM + CARD_GAP_MM);
            addCanvasToPdfAt(pdf, canvas, x, y, CARD_W_MM, CARD_H_MM);

            // overlay sharp header
            overlayVectorHeader(pdf, x, y, CARD_W_MM);

            i++;
            processed++;
            setProgress(Math.min(98, Math.round((processed / totalFaces) * 100)));
          }
        }
      }

      pdf.save(
        `IDCards_${(schoolName || "School").toString().replace(/\s+/g, "")}_${selectedClass?.class_name || ""}_true-size.pdf`
      );
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF at true size.");
    } finally {
      const host = document.getElementById("print-host");
      if (host) host.remove();
      setLoadingPDF(false);
      setTimeout(() => setProgress(0), 300);
    }
  };

  // Duplex imposition (front & back on same sheets), optional crop marks
  const generatePDFDuplex = async ({ includeCropMarks = true } = {}) => {
    if (students.length === 0) {
      alert("No cards to generate!");
      return;
    }
    setLoadingPDF(true);
    setProgress(0);

    const usableW = PAGE_W_MM - PAGE_MARGIN_MM * 2;
    const usableH = PAGE_H_MM - PAGE_MARGIN_MM * 2;
    const cols = Math.max(1, Math.floor((usableW + CARD_GAP_MM) / (RENDER_W_MM + CARD_GAP_MM)));
    const rows = Math.max(1, Math.floor((usableH + CARD_GAP_MM) / (RENDER_H_MM + CARD_GAP_MM)));

    try {
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-10000px";
      host.style.top = "0";
      host.id = "duplex-host";
      document.body.appendChild(host);

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });

      const fronts = [];
      const backs = [];
      let processed = 0;
      const totalFaces = students.length * 2;

      for (let i = 0; i < students.length; i++) {
        const node = buildPrintCardNodeDuplex(students[i], "front");
        host.appendChild(node);
        const canvas = await captureElement(node);
        fronts.push(canvas);
        processed++;
        setProgress(Math.min(90, Math.round((processed / totalFaces) * 100)));
      }
      for (let i = 0; i < students.length; i++) {
        const node = buildPrintCardNodeDuplex(students[i], "back");
        host.appendChild(node);
        const canvas = await captureElement(node);
        backs.push(canvas);
        processed++;
        setProgress(Math.min(96, Math.round((processed / totalFaces) * 100)));
      }

      // fronts
      let idx = 0;
      while (idx < students.length) {
        if (idx > 0) pdf.addPage("a4", "landscape");
        for (let r = 0; r < rows && idx < students.length; r++) {
          for (let c = 0; c < cols && idx < students.length; c++, idx++) {
            const x = PAGE_MARGIN_MM + c * (RENDER_W_MM + CARD_GAP_MM);
            const y = PAGE_MARGIN_MM + r * (RENDER_H_MM + CARD_GAP_MM);
            addCanvasToPdfAt(pdf, fronts[idx], x, y, RENDER_W_MM, RENDER_H_MM);
            overlayVectorHeader(pdf, x + BLEED_MM, y + BLEED_MM, TRIM_W_MM);
            if (includeCropMarks) drawCropMarks(pdf, x + BLEED_MM, y + BLEED_MM, TRIM_W_MM, TRIM_H_MM);
          }
        }
      }

      // backs mirrored by flip edge
      const mirrorHoriz = DUPLEX_FLIP === "long";
      const mirrorVert = DUPLEX_FLIP === "short";

      idx = 0;
      while (idx < students.length) {
        pdf.addPage("a4", "landscape");
        for (let r = 0; r < rows && idx < students.length; r++) {
          for (let c = 0; c < cols && idx < students.length; c++, idx++) {
            let slotC = c;
            let slotR = r;
            if (mirrorHoriz) slotC = cols - 1 - c;
            if (mirrorVert) slotR = rows - 1 - r;

            const x = PAGE_MARGIN_MM + slotC * (RENDER_W_MM + CARD_GAP_MM);
            const y = PAGE_MARGIN_MM + slotR * (RENDER_H_MM + CARD_GAP_MM);

            addCanvasToPdfAt(pdf, backs[idx], x, y, RENDER_W_MM, RENDER_H_MM);
            overlayVectorHeader(pdf, x + BLEED_MM, y + BLEED_MM, TRIM_W_MM);
            if (includeCropMarks) drawCropMarks(pdf, x + BLEED_MM, y + BLEED_MM, TRIM_W_MM, TRIM_H_MM);
          }
        }
      }

      pdf.save(
        `IDCards_${(schoolName || "School").toString().replace(/\s+/g, "")}_${selectedClass?.class_name || ""}_duplex_true-size.pdf`
      );
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating duplex PDF.");
    } finally {
      const host = document.getElementById("duplex-host");
      if (host) host.remove();
      setLoadingPDF(false);
      setTimeout(() => setProgress(0), 300);
    }
  };

  // IMPROVED: Single card with slower, more visible progress
  const printSingleCard = async (student) => {
    setLoadingPDF(true);
    setProgress(0);
    
    try {
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.left = "-10000px";
      host.style.top = "0";
      host.id = "single-print-host";
      document.body.appendChild(host);

      // Step 1: Initialize
      setProgress(5);
      await delay(200);

      // Step 2: Create front side
      setProgress(15);
      const frontNode = buildPrintCardNode(student, "front");
      host.appendChild(frontNode);
      
      setProgress(25);
      await delay(300);
      
      // Step 3: Capture front canvas
      setProgress(35);
      const frontCanvas = await captureElement(frontNode);
      
      setProgress(45);
      await delay(200);

      // Step 4: Create back side  
      setProgress(55);
      const backNode = buildPrintCardNode(student, "back");
      host.appendChild(backNode);
      
      setProgress(65);
      await delay(300);
      
      // Step 5: Capture back canvas
      setProgress(75);
      const backCanvas = await captureElement(backNode);
      
      setProgress(85);
      await delay(200);

      // Step 6: Create PDF
      const pdf = new jsPDF({ unit: "mm", format: [CARD_W_MM, CARD_H_MM], orientation: "landscape" });

      // Front
      addCanvasToPdfAt(pdf, frontCanvas, 0, 0, CARD_W_MM, CARD_H_MM);
      overlayVectorHeader(pdf, 0, 0, CARD_W_MM);

      setProgress(90);
      await delay(200);

      // Back
      pdf.addPage([CARD_W_MM, CARD_H_MM], "landscape");
      addCanvasToPdfAt(pdf, backCanvas, 0, 0, CARD_W_MM, CARD_H_MM);
      overlayVectorHeader(pdf, 0, 0, CARD_W_MM);

      setProgress(95);
      await delay(200);

      // Step 7: Save PDF
      pdf.save(`IDCard_${student.first_name || "Student"}_${student.profile_id}_true-size.pdf`);
      setProgress(100);
      await delay(300);
      
    } catch (error) {
      console.error("Error printing card:", error);
      alert("Error generating card. Please try again.");
    } finally {
      const host = document.getElementById("single-print-host");
      if (host) host.remove();
      setTimeout(() => {
        setLoadingPDF(false);
        setProgress(0);
      }, 500);
    }
  };

  // ========= Misc =========
  const getStudentImageUrl = (student) => {
    if (student.profile_picture) {
      return student.profile_picture.startsWith("http") ? student.profile_picture : `${API}${student.profile_picture}`;
    }
    return null;
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Handlers for compact buttons
  const handleFrontBack = () => generatePDF();
  const handleDuplexMarks = () => generatePDFDuplex({ includeCropMarks: true });

  // ========= UI =========
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-2 sm:p-4 lg:p-6">
      {/* IMPROVED: Global loader with better progress text */}
      {loadingPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-sm w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
            <p className="mt-2 text-gray-700 font-semibold text-lg">
              {progress < 20 ? "Initializing..." :
               progress < 40 ? "Creating Cards..." :
               progress < 70 ? "Processing Images..." :
               progress < 90 ? "Generating PDF..." :
               "Finalizing Download..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600 font-medium">{Math.round(progress)}% Complete</p>
            {progress < 95 && (
              <p className="mt-1 text-xs text-gray-500">Please wait, this may take a moment...</p>
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {selectedStudentCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                {/* Front Side */}
                <div className="w-full max-w-[400px]">
                  <h3 className="text-base font-bold mb-2 text-center text-blue-900">Front</h3>
                  <div className="w-full aspect-[5/3] bg-white rounded-lg overflow-hidden shadow border-2 border-blue-900">
                    <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-2 text-white flex items-center justify-between">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden">
                        {schoolLogoUrl ? (
                          <img
                            src={schoolLogoUrl}
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain p-0.5"
                            alt="logo"
                          />
                        ) : (
                          <span className="text-blue-900 font-extrabold text-xs">S</span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold tracking-wide text-center flex-1">
                        {schoolName || "SCHOOL NAME"}
                      </span>
                    </div>
                    <div className="p-4 flex gap-4 h-full">
                      <div className="w-20 h-24 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getStudentImageUrl(selectedStudentCard) ? (
                          <img
                            src={getStudentImageUrl(selectedStudentCard)}
                            crossOrigin="anonymous"
                            alt="Student"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <User className="w-10 h-10 text-gray-500" />
                      </div>
                      <div className="flex-1 text-sm space-y-1.5">
                        <h2 className="text-base font-extrabold text-blue-900">STUDENT ID CARD</h2>
                        <p><strong>Name:</strong> {selectedStudentCard.first_name} {selectedStudentCard.last_name}</p>
                        <p><strong>ID:</strong> {selectedStudentCard.profile_id}</p>
                        <p><strong>Class:</strong> {selectedStudentCard.class_name}</p>
                        <p><strong>Father:</strong> {selectedStudentCard.father_name || "Not provided"}</p>
                        <p><strong>Issued:</strong> {issuedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="w-full max-w-[400px]">
                  <h3 className="text-base font-bold mb-2 text-center text-blue-900">Back</h3>
                  <div className="w-full aspect-[5/3] bg-white rounded-lg overflow-hidden shadow border-2 border-blue-900">
                    <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-2 text-white flex items-center justify-between">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden">
                        {schoolLogoUrl ? (
                          <img
                            src={schoolLogoUrl}
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain p-0.5"
                            alt="logo"
                          />
                        ) : (
                          <span className="text-blue-900 font-extrabold text-xs">S</span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold tracking-wide text-center flex-1">
                        {schoolName || "SCHOOL NAME"}
                      </span>
                    </div>

                    {/* Smaller info on back */}
                    <div className="p-4 flex gap-4">
                      <div className="flex-1 space-y-2 text-[12px] leading-snug">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span><strong>CNIC:</strong> {selectedStudentCard.cnic || selectedStudentCard.b_form || "Not provided"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span><strong>DOB:</strong> {selectedStudentCard.date_of_birth ? new Date(selectedStudentCard.date_of_birth).toLocaleDateString() : (selectedStudentCard.dob ? new Date(selectedStudentCard.dob).toLocaleDateString() : "Not provided")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0">🩸</span>
                            <span><strong>Blood:</strong> {selectedStudentCard.blood_group || "Not provided"}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{selectedStudentCard.phone || selectedStudentCard.mobile || "+92-000-0000000"}</span>
                          </div>
                          <div className="flex items-start gap-2 break-all">
                            <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{selectedStudentCard.email || "school@example.com"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span>{selectedStudentCard.address || "Address not provided"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center justify-center px-2">
                        <img
                          src={generateQRCode(selectedStudentCard)}
                          crossOrigin="anonymous"
                          alt="QR Code"
                          className="w-24 h-24 border rounded shadow-sm"
                        />
                        <p className="text-[11px] text-gray-600 mt-1 text-center">Scan for Details</p>
                      </div>
                    </div>

                    {/* Footer with school phone + lost note */}
                    <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
                      <div className="text-[11px] text-gray-800"><b>School:</b> {schoolPhone || "+92-XXX-XXXXXXX"}</div>
                      <div className="text-[10px] text-gray-600 text-right">If this card is lost, please contact the school immediately.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
                <button
                  onClick={() => printSingleCard(selectedStudentCard)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  disabled={loadingPDF}
                >
                  <Download className="w-4 h-4" />
                  {loadingPDF ? "Downloading..." : "Download Card"}
                </button>
                <button
                  onClick={() => setSelectedStudentCard(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                  disabled={loadingPDF}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h1 className="text-lg sm:text-xl font-bold">Print ID-Cards</h1>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Dropdown */}
              <select
                value={selectedClass?.id ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedClass(Number.isFinite(id) ? (classes.find(c => Number(c.id) === id) || null) : null);
                }}
                className="text-black px-2 py-1 rounded-md min-w-[140px] text-xs focus:outline-none focus:ring-1 focus:ring-cyan-300"
                disabled={loadingClasses}
              >
                <option value="">{loadingClasses ? "Loading..." : "Select Class"}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} {cls.section ? `- ${cls.section}` : ""}
                  </option>
                ))}
              </select>

              {/* Filter Button */}
              <button
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs px-3 py-1 rounded-md disabled:opacity-50"
                onClick={handleFilter}
                disabled={!selectedClass || loadingStudents}
              >
                Filter
              </button>

              {/* Front+Back Button */}
              <button
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-md disabled:opacity-50"
                onClick={handleFrontBack}
                disabled={loadingPDF || students.length === 0}
              >
                Front+Back
              </button>

              {/* Duplex+Marks Button */}
              <button
                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-md disabled:opacity-50"
                onClick={handleDuplexMarks}
                disabled={loadingPDF || students.length === 0}
              >
                Duplex+Marks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {students.map((student) => (
          <div
            key={student.profile_id}
            className="card-container group cursor-pointer transform transition-all duration-200 hover:scale-[1.015] hover:shadow-lg"
            onClick={() => setSelectedStudentCard(student)}
          >
            <div className="bg-white rounded-lg overflow-hidden shadow border-2 border-blue-200 group-hover:border-blue-400">
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-3 py-2 text-white flex items-center justify-between">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {schoolLogoUrl ? (
                    <img src={schoolLogoUrl} crossOrigin="anonymous" className="w-full h-full object-contain p-0.5" alt="logo" />
                  ) : (
                    <span className="text-blue-900 font-extrabold text-xs">S</span>
                  )}
                </div>
                <span className="text-xs font-extrabold tracking-wide text-center flex-1 mx-2">
                  {schoolName || "SCHOOL NAME"}
                </span>
              </div>
              <div className="p-3">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-14 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {getStudentImageUrl(student) ? (
                      <img
                        src={getStudentImageUrl(student)}
                        crossOrigin="anonymous"
                        alt="Student"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-blue-900 text-sm mb-1 truncate">Student ID Card</h3>
                    <p className="text-xs text-gray-600">
                      Name: {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-gray-600">ID: {student.profile_id}</p>
                    <p className="text-xs text-gray-600">Class: {student.class_name}</p>
                    <p className="text-xs text-gray-600 truncate">Father: {student.father_name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Issued: {issuedDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 && !loadingStudents && !error && (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {!selectedClass ? "Select a class and click 'Filter' to view students" : "No students found for the selected class"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentIDCardPage;