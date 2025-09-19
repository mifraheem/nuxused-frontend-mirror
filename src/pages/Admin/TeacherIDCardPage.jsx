import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { User, RefreshCw, Download, IdCard, GraduationCap, Building2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CARD_WIDTH_REM = 20;          // 20rem ~ 320px (nice readable width)
const CARD_HEIGHT_PX = 420;         // shared height for FRONT & BACK

const TeacherIDCard = () => {
  const API = import.meta.env.VITE_SERVER_URL ;

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [schoolData, setSchoolData] = useState({
    name: "Institute Name",
    logo: null,
    slogan: "Slogan text line goes here",
    phone: "+92-123-4567890",
  });

  // progress overlay
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  // Refs for modal capture
  const modalFrontRef = useRef(null);
  const modalBackRef = useRef(null);

  const getToken = () => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };
    return (
      getCookie("access_token") ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    );
  };

  const fetchSchoolData = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API}classes/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = data?.data?.results || [];
      if (list.length) {
        const s = list[0];
        setSchoolData({
          name: s.school_name || s.school || "Institute Name",
          logo: s.school_logo || s.logo || s.school_logo_url || s.logo_url || null,
          slogan: s.slogan || "Slogan text line goes here",
          phone: s.phone || "+92-123-4567890",
        });
      }
    } catch {/* defaults ok */ }
  };

  const fetchTeachers = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API}api/auth/users/list_profiles/teacher/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTeachers(data?.data?.results || []);
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    fetchSchoolData();
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProfilePictureUrl = (t) =>
    t?.profile_picture
      ? t.profile_picture.startsWith("http")
        ? t.profile_picture
        : `${API}${t.profile_picture}`
      : null;

  const getSchoolLogoUrl = () => {
    if (!schoolData.logo) return null;
    return schoolData.logo.startsWith("http") || schoolData.logo.startsWith("data:")
      ? schoolData.logo
      : `${API}${schoolData.logo}`;
  };

  // -------- date helpers (support multiple backend key names) --------
  const formatDate = (val) => {
    if (!val) return "—";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString();
    } catch {
      return "—";
    }
  };
  const getIssued = (t) =>
    t.issue_date || t.issued_date || t.issued_on || t.card_issued_on || null;
  const getExpiry = (t) =>
    t.expiry_date || t.expire_date || t.valid_till || t.valid_until || t.card_expiry || null;

  /* =====================  CARDS  ===================== */

  // FRONT — professional look (same fixed height as back) with full school name display
  const CardFront = (teacher, forwardedRef) => {
    if (!teacher) return null;

    const initials =
      (schoolData?.name || "School")
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const issued = formatDate(getIssued(teacher));
    const expires = formatDate(getExpiry(teacher));

    // Determine if school name is long to adjust layout
    const schoolName = schoolData.name;
    const isLongName = schoolName.length > 25;

    return (
      <div
        ref={forwardedRef}
        className="teacher-card-front bg-white border-4 border-teal-700 rounded-2xl shadow-lg overflow-hidden relative flex flex-col"
        style={{ width: `${CARD_WIDTH_REM}rem`, height: CARD_HEIGHT_PX }}
      >
        {/* Header - Dynamic height based on school name length */}
        <div className={`relative bg-gradient-to-br from-teal-800 to-teal-600 ${isLongName ? 'h-36' : 'h-28'}`}>
          {/* School name - Full display with wrapping */}
          <div className="absolute top-2 left-3 right-20">
            <h3 className={`text-yellow-300 font-semibold leading-tight ${isLongName ? 'text-xs' : 'text-sm sm:text-base'}`}
                style={{ 
                  wordWrap: 'break-word',
                  hyphens: 'auto',
                  overflowWrap: 'break-word'
                }}>
              {schoolName}
            </h3>
          </div>

          {/* Logo - Positioned to accommodate text */}
          <div className="absolute top-2 right-2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center">
            {getSchoolLogoUrl() ? (
              <img
                src={getSchoolLogoUrl()}
                alt="School Logo"
                className="w-10 h-10 object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-yellow-200 font-bold text-sm">{initials}</span>
            )}
          </div>

          {/* Decorative shapes (subtle) */}
          <div className="absolute -bottom-8 -right-10 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-black/10 rounded-full" />

          {/* Role chip - Positioned dynamically */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${isLongName ? '-bottom-4' : '-bottom-4'}`}>
            <span className="inline-flex items-center gap-2 bg-white text-teal-800 border border-teal-200 px-3 py-1 rounded-full shadow-sm text-xs font-bold tracking-wide">
              <IdCard className="w-4 h-4" />
              TEACHER
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="mt-5 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {getProfilePictureUrl(teacher) ? (
                <img
                  src={getProfilePictureUrl(teacher)}
                  alt="Teacher"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <User className="w-14 h-14 text-gray-400" />
              )}
            </div>
            {/* subtle accent ring */}
            <span className="absolute inset-0 rounded-full ring-1 ring-teal-600/20" />
          </div>
        </div>

        {/* Name */}
        <div className="mt-0 text-center px-4">
          <h2 className="text-lg font-extrabold text-teal-900 leading-tight"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>
            {teacher.first_name} {teacher.last_name}
          </h2>
          {/* small ID under name */}
          <p className="text-xs text-teal-700/80 mt-0.5 break-all">ID: {teacher.profile_id}</p>
        </div>

        {/* Info section */}
        <div className="mt-0 mx-4 rounded-xl border border-teal-100 overflow-hidden">
          {/* Row: Qualification */}
          <div className="grid grid-cols-[118px,1fr]">
            <div className="bg-teal-700 text-white px-3 py-2 text-xs font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-white/90" />
              <span>Qualification</span>
            </div>
            <div className="px-3 py-2 text-sm text-teal-900 bg-white break-words">
              {teacher.qualification || teacher.department_name || "Not provided"}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-teal-100" />

          {/* Row: Department */}
          <div className="grid grid-cols-[118px,1fr]">
            <div className="bg-teal-700 text-white px-3 py-2 text-xs font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/90" />
              <span>Department</span>
            </div>
            <div className="px-3 py-2 text-sm text-teal-900 bg-white break-words">
              {teacher.department || "Not provided"}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-teal-100" />

          {/* Row: Validity (Issued / Expires) */}
          <div className="grid grid-cols-2 text-xs">
            <div className="px-3 py-2 bg-white">
              <span className="block font-semibold text-teal-900">Issued</span>
              <span className="block text-teal-700/90">{issued}</span>
            </div>
            <div className="px-3 py-2 bg-white border-l border-teal-100">
              <span className="block font-semibold text-teal-900">Expires</span>
              <span className="block text-teal-700/90">{expires}</span>
            </div>
          </div>
        </div>

        {/* Spacer to ensure consistent height */}
        <div className="flex-1" />
      </div>
    );
  };

  // BACK — same fixed height as front
  const CardBack = (teacher, forwardedRef) => {
    if (!teacher) return null;
    const qrData = encodeURIComponent(
      JSON.stringify({
        role: "Teacher",
        name: `${teacher.first_name} ${teacher.last_name}`,
        id: teacher.profile_id,
        qualification: teacher.qualification || teacher.department_name || "Not provided",
        phone: teacher.phone || "Not provided",
        email: teacher.email || "Not provided",
        school: schoolData.name,
      })
    );
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    return (
      <div
        ref={forwardedRef}
        className="bg-white border-4 border-teal-700 rounded-xl shadow-lg overflow-hidden relative"
        style={{ width: `${CARD_WIDTH_REM}rem`, height: CARD_HEIGHT_PX }}
      >
        <div className="p-4">
          <h3 className="text-sm font-bold text-teal-700 border-b border-teal-200 pb-1 text-center">
            Personal Details
          </h3>
          <div className="text-xs text-teal-800 space-y-1 mt-2">
            <div><span className="font-semibold">CNIC:</span> {teacher.cnic || "Not provided"}</div>
            <div>
              <span className="font-semibold">DOB:</span>{" "}
              {teacher.date_of_birth
                ? new Date(teacher.date_of_birth).toLocaleDateString()
                : teacher.dob
                  ? new Date(teacher.dob).toLocaleDateString()
                  : "Not provided"}
            </div>
            <div><span className="font-semibold">Blood Group:</span> {teacher.blood_group || "Not provided"}</div>
            <div><span className="font-semibold">Phone:</span> {teacher.phone || "+92-000-0000000"}</div>
            <div className="break-all"><span className="font-semibold">Email:</span> {teacher.email || "school@example.com"}</div>
            <div><span className="font-semibold">Address:</span> {teacher.address || "Address not provided"}</div>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="bg-white border-2 border-teal-200 rounded-lg p-2 inline-block">
              <img src={qrUrl} alt="QR Code" className="w-32 h-32" crossOrigin="anonymous" />
            </div>
            <div className="text-xs text-teal-600 mt-1">Scan for Details</div>
          </div>

          <div className="mt-3 text-center text-[10px] text-gray-600">
            If lost, contact: {schoolData.name} | Phone: {schoolData.phone}
          </div>
        </div>
      </div>
    );
  };

  /* =====================  DOWNLOADS  ===================== */

  const renderOffscreen = async (jsx) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.zIndex = "-1";
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(jsx);
    // wait two frames to ensure paint
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { host, root };
  };

  const captureNode = async (node) =>
    await html2canvas(node, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
    });

  // All teachers: both sides (front then back per teacher) + progress
  const downloadAllBothSides = async () => {
    if (!teachers.length) return;
    setBusy(true);
    setProgress(5);

    const totalFaces = teachers.length * 2;
    let done = 0;

    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i];

        // FRONT
        const frontOS = await renderOffscreen(<div>{CardFront(t)}</div>);
        const frontCanvas = await captureNode(frontOS.host);
        frontOS.root.unmount(); frontOS.host.remove();

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const frRatio = frontCanvas.height / frontCanvas.width;
        const frW = pageW - 20;
        const frH = frW * frRatio;
        if (i > 0) pdf.addPage();
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 10, (pageH - frH) / 2, frW, frH, undefined, "FAST");

        done += 1;
        setProgress(Math.min(95, Math.round((done / totalFaces) * 100)));

        // BACK
        const backOS = await renderOffscreen(<div>{CardBack(t)}</div>);
        const backCanvas = await captureNode(backOS.host);
        backOS.root.unmount(); backOS.host.remove();

        const bkRatio = backCanvas.height / backCanvas.width;
        const bkW = pageW - 20;
        const bkH = bkW * bkRatio;
        pdf.addPage();
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 10, (pageH - bkH) / 2, bkW, bkH, undefined, "FAST");

        done += 1;
        setProgress(Math.min(98, Math.round((done / totalFaces) * 100)));
      }

      pdf.save(`Teacher_ID_Cards_${(schoolData.name || "School").replace(/\s+/g, "")}.pdf`);
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    } finally {
      setTimeout(() => { setBusy(false); setProgress(0); }, 400);
    }
  };

  // Selected teacher: both sides (uses modal DOM) + progress
  const downloadSelectedBoth = async () => {
    if (!selectedTeacher) return;
    setBusy(true);
    setProgress(10);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      const frontCanvas = await captureNode(modalFrontRef.current);
      setProgress(45);
      const backCanvas = await captureNode(modalBackRef.current);
      setProgress(75);

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const frRatio = frontCanvas.height / frontCanvas.width;
      const frW = pageW - 20;
      const frH = frW * frRatio;
      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 10, (pageH - frH) / 2, frW, frH, undefined, "FAST");

      const bkRatio = backCanvas.height / backCanvas.width;
      const bkW = pageW - 20;
      const bkH = bkW * bkRatio;
      pdf.addPage();
      pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 10, (pageH - bkH) / 2, bkW, bkH, undefined, "FAST");

      const name = `${selectedTeacher.first_name || "Teacher"}_${selectedTeacher.last_name || ""}`.trim();
      pdf.save(`${name}_ID_Card.pdf`);
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    } finally {
      setTimeout(() => { setBusy(false); setProgress(0); }, 400);
    }
  };

  /* =====================  UI  ===================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-3 sm:p-4 lg:p-6">
      {/* Progress overlay */}
      {busy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-sm w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-600 mb-4"></div>
            <p className="mt-1 text-gray-700 font-semibold text-lg">
              {progress < 25 ? "Initializing..." :
                progress < 55 ? "Rendering cards..." :
                  progress < 85 ? "Generating PDF..." :
                    "Finalizing..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-teal-600 to-teal-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 font-medium">{Math.round(progress)}% Complete</p>
            {progress < 95 && <p className="mt-1 text-xs text-gray-500">Please wait…</p>}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h1 className="text-base sm:text-lg font-bold">Print Teacher ID-Cards</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={fetchTeachers}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={downloadAllBothSides}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2 disabled:opacity-50"
                  disabled={!teachers.length}
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid — fixed 2 cols on ≥ sm, 1 col on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center">
          {teachers.map((t) => (
            <button
              key={t.profile_id}
              className="mx-auto focus:outline-none"
              style={{ width: `${CARD_WIDTH_REM}rem` }}
              onClick={() => setSelectedTeacher(t)}
              aria-label={`Open ${t.first_name} ${t.last_name} card`}
            >
              {CardFront(t)}
            </button>
          ))}
          {!teachers.length && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No teachers found.
            </div>
          )}
        </div>
      </div>

      {/* Modal: front + back + download/close */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[98vw] sm:max-w-[92vw] lg:w-[980px] max-h-[92vh] overflow-hidden relative">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl leading-none z-10"
              aria-label="Close"
            >
              ×
            </button>

            <div className="p-2 sm:p-4 overflow-y-auto max-h-[92vh]">
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
                <div ref={modalFrontRef}>{CardFront(selectedTeacher)}</div>
                <div ref={modalBackRef}>{CardBack(selectedTeacher)}</div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={downloadSelectedBoth}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherIDCard;