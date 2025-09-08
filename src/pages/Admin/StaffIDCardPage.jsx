import React, { useEffect, useRef, useState } from "react";
import {
  User, RefreshCw, Download, IdCard, Briefcase
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CARD_WIDTH_REM = 20; // ~320px readable width
const CARD_HEIGHT_PX = 420; // shared height front/back

const StaffIDCardPage = () => {
  const API = import.meta.env.VITE_SERVER_URL ;

  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [schoolData, setSchoolData] = useState({
    name: "Institute Name",
    logo: null,
    slogan: "Slogan text line goes here",
    phone: "+92-123-4567890",
  });

  // progress overlay
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  // modal refs
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

  // replace your fetchSchoolData with this
  const fetchSchoolData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API}classes/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) return;

      const data = await res.json();
      const list = data?.data?.results || [];
      if (!list.length) return;

      const s = list[0];

      // name is a plain string in `school`
      const name = s?.school || "Institute Name";

      // there is no logo in this payload; keep null so initials render
      setSchoolData(prev => ({
        ...prev,
        name,
        logo: null, // until backend provides one
      }));
    } catch {
      /* keep defaults */
    }
  };


  const fetchStaff = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/auth/users/list_profiles/staff/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStaff(data?.data?.results || []);
    } catch {
      setStaff([]);
    }
  };

  useEffect(() => {
    fetchSchoolData();
    fetchStaff();
  }, []);

  const getProfilePictureUrl = (s) =>
    s?.profile_picture
      ? s.profile_picture.startsWith("http")
        ? s.profile_picture
        : `${API}${s.profile_picture}`
      : null;

  const getSchoolLogoUrl = () => {
    if (!schoolData.logo) return null;
    return schoolData.logo.startsWith("http") || schoolData.logo.startsWith("data:")
      ? schoolData.logo
      : `${API}${schoolData.logo}`;
  };

  // --- date helpers (handles multiple possible backend keys) ---
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
  const getIssued = (s) =>
    s.issue_date || s.issued_date || s.issued_on || s.card_issued_on || null;
  const getExpiry = (s) =>
    s.expire_date || s.expiry_date || s.valid_till || s.valid_until || s.card_expiry || null;

  /* ===================== CARDS ===================== */

  // FRONT — sea‑green theme, fixed size, + validity row with full school name display
  const CardFront = (staffMember, forwardedRef) => {
    if (!staffMember) return null;

    const initials =
      (schoolData?.name || "School")
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const issued = formatDate(getIssued(staffMember));
    const expiry = formatDate(getExpiry(staffMember));

    // Determine if school name is long to adjust layout
    const schoolName = schoolData.name;
    const isLongName = schoolName.length > 25;

    return (
      <div
        ref={forwardedRef}
        className="staff-card-front bg-white border-4 border-[#3a6b6b] rounded-2xl shadow-lg overflow-hidden relative flex flex-col"
        style={{ width: `${CARD_WIDTH_REM}rem`, height: CARD_HEIGHT_PX }}
      >
        {/* Header - Dynamic height based on school name length */}
        <div className={`relative bg-gradient-to-br from-[#2e4f4f] via-[#3a6b6b] to-[#4f8a8a] ${isLongName ? 'h-36' : 'h-28'}`}>
          {/* School name - Full display with wrapping */}
          <div className="absolute top-2 left-3 right-20">
            <h3 className={`text-white font-semibold leading-tight drop-shadow ${isLongName ? 'text-xs' : 'text-sm sm:text-base'}`}
                style={{ 
                  wordWrap: 'break-word',
                  hyphens: 'auto',
                  overflowWrap: 'break-word'
                }}>
              {schoolName}
            </h3>
          </div>

          {/* Logo - Positioned to accommodate text */}
          <div className="absolute top-2 right-2 w-14 h-14 rounded-full bg-[#2e4f4f]/50 backdrop-blur-sm ring-2 ring-[#4f8a8a]/50 flex items-center justify-center shadow-sm">
            {getSchoolLogoUrl() ? (
              <img
                src={getSchoolLogoUrl()}
                alt="School Logo"
                className="w-10 h-10 object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-white font-bold text-sm">{initials}</span>
            )}
          </div>

          {/* Decorative shapes */}
          <div className="absolute -bottom-8 -right-10 w-28 h-28 bg-[#2e4f4f]/20 rounded-full" />
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-black/20 rounded-full" />

          {/* Role chip - Positioned dynamically */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${isLongName ? '-bottom-4' : '-bottom-4'}`}>
            <span className="inline-flex items-center gap-2 bg-[#2e4f4f] text-white border border-[#3a6b6b] px-3 py-1 rounded-full shadow-sm text-xs font-bold tracking-wide">
              <IdCard className="w-4 h-4" />
              STAFF
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="mt-8 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full ring-4 ring-[#3a6b6b] shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {getProfilePictureUrl(staffMember) ? (
                <img
                  src={getProfilePictureUrl(staffMember)}
                  alt="Staff"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <User className="w-14 h-14 text-[#a3c6c6]" />
              )}
            </div>
            <span className="absolute inset-0 rounded-full ring-1 ring-[#3a6b6b]/30" />
          </div>
        </div>

        {/* Name + ID */}
        <div className="mt-3 text-center px-4">
          <h2 className="text-lg font-extrabold text-[#2e4f4f] leading-tight"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>
            {staffMember.first_name} {staffMember.last_name}
          </h2>
          <p className="text-xs text-[#3a6b6b] mt-0.5 break-all">ID: {staffMember.profile_id}</p>
        </div>

        {/* Info rows */}
        <div className="mt-2 mx-4 rounded-xl border border-[#3a6b6b] overflow-hidden">
          <div className="grid grid-cols-[118px,1fr]">
            <div className="bg-[#2e4f4f] text-white px-3 py-2 text-xs font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-white/90" />
              <span>Position</span>
            </div>
            <div className="px-3 py-2 text-sm text-[#2e4f4f] bg-white break-words">
              {staffMember.position || "Not provided"}
            </div>
          </div>

          {/* Validity row */}
          <div className="h-px bg-[#3a6b6b]/40" />
          <div className="grid grid-cols-2 text-xs">
            <div className="px-3 py-2 bg-white">
              <span className="block font-semibold text-[#2e4f4f]">Issued</span>
              <span className="block text-[#3a6b6b]">{issued}</span>
            </div>
            <div className="px-3 py-2 bg-white border-l border-[#3a6b6b]/40">
              <span className="block font-semibold text-[#2e4f4f]">Expires</span>
              <span className="block text-[#3a6b6b]">{expiry}</span>
            </div>
          </div>
        </div>

        {/* Spacer to keep height equal to back */}
        <div className="flex-1" />
      </div>
    );
  };

  // BACK — fixed size
  const CardBack = (staffMember, forwardedRef) => {
    if (!staffMember) return null;

    const qrData = encodeURIComponent(JSON.stringify({
      role: "Staff",
      name: `${staffMember.first_name} ${staffMember.last_name}`,
      id: staffMember.profile_id,
      position: staffMember.position || "Not provided",
      phone: staffMember.phone || "Not provided",
      email: staffMember.email || "Not provided",
      school: schoolData.name,
    }));
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    return (
      <div
        ref={forwardedRef}
        className="bg-white border-4 border-[#3a6b6b] rounded-xl shadow-lg overflow-hidden relative"
        style={{ width: `${CARD_WIDTH_REM}rem`, height: CARD_HEIGHT_PX }}
      >
        <div className="p-4">
          <h3 className="text-sm font-bold text-[#2e4f4f] border-b border-[#3a6b6b] pb-1 text-center">
            Personal Details
          </h3>

          <div className="text-xs text-[#3a6b6b] space-y-1 mt-2">
            <div><span className="font-semibold">CNIC:</span> {staffMember.cnic || "Not provided"}</div>
            <div>
              <span className="font-semibold">DOB:</span>{" "}
              {staffMember.date_of_birth
                ? new Date(staffMember.date_of_birth).toLocaleDateString()
                : (staffMember.dob ? new Date(staffMember.dob).toLocaleDateString() : "Not provided")}
            </div>
            <div><span className="font-semibold">Blood Group:</span> {staffMember.blood_group || "Not provided"}</div>
            <div><span className="font-semibold">Phone:</span> {staffMember.phone || "+92-000-0000000"}</div>
            <div className="break-all"><span className="font-semibold">Email:</span> {staffMember.email || "school@example.com"}</div>
            <div><span className="font-semibold">Address:</span> {staffMember.address || "Address not provided"}</div>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="bg-white border-2 border-[#3a6b6b] rounded-lg p-2 inline-block">
              <img src={qrUrl} alt="QR Code" className="w-32 h-32" crossOrigin="anonymous" />
            </div>
            <div className="text-xs text-[#a3c6c6] mt-1">Scan for Details</div>
          </div>

          <div className="mt-3 text-center text-[10px] text-[#a3c6c6]">
            If lost, contact: {schoolData.name} | Phone: {schoolData.phone}
          </div>
        </div>
      </div>
    );
  };

  /* ===================== DOWNLOADS ===================== */

  const renderOffscreen = async (jsx) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.zIndex = "-1";
    document.body.appendChild(host);
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(host);
    root.render(jsx);
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

  const downloadAllBothSides = async () => {
    if (!staff.length) return;
    setBusy(true);
    setProgress(5);

    const totalFaces = staff.length * 2;
    let done = 0;

    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      for (let i = 0; i < staff.length; i++) {
        const s = staff[i];

        // FRONT
        const frontOS = await renderOffscreen(<div>{CardFront(s)}</div>);
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
        const backOS = await renderOffscreen(<div>{CardBack(s)}</div>);
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

      pdf.save(`Staff_ID_Cards_${(schoolData.name || "School").replace(/\s+/g, "")}.pdf`);
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    } finally {
      setTimeout(() => { setBusy(false); setProgress(0); }, 400);
    }
  };

  const downloadSelectedBoth = async () => {
    if (!selectedStaff) return;
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

      const name = `${selectedStaff.first_name || "Staff"}_${selectedStaff.last_name || ""}`.trim();
      pdf.save(`${name}_ID_Card.pdf`);
      setProgress(100);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    } finally {
      setTimeout(() => { setBusy(false); setProgress(0); }, 400);
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 lg:p-6">
      {/* Progress overlay */}
      {busy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-sm w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4f8a8a] mb-4"></div>
            <p className="mt-1 text-[#2e4f4f] font-semibold text-lg">
              {progress < 25 ? "Initializing..." :
                progress < 55 ? "Rendering cards..." :
                  progress < 85 ? "Generating PDF..." :
                    "Finalizing..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-[#4f8a8a] to-[#6aa8a8] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[#3a6b6b] font-medium">{Math.round(progress)}% Complete</p>
            {progress < 95 && <p className="mt-1 text-xs text-[#a3c6c6]">Please wait…</p>}
          </div>
        </div>
      )}

      {/* cap width so layout stays identical on wide screens */}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h1 className="text-base sm:text-lg font-bold">Print Staff ID-Cards</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={fetchStaff}
                  className="bg-[#3a6b6b]/50 hover:bg-[#4f8a8a]/50 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={downloadAllBothSides}
                  className="bg-[#3a6b6b]/50 hover:bg-[#4f8a8a]/50 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2 disabled:opacity-50"
                  disabled={!staff.length}
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid — fixed 2 cols ≥ sm, 1 col on mobile; center items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center">
          {staff.map((s) => (
            <button
              key={s.profile_id}
              className="mx-auto focus:outline-none"
              style={{ width: `${CARD_WIDTH_REM}rem` }}
              onClick={() => setSelectedStaff(s)}
              aria-label={`Open ${s.first_name} ${s.last_name} card`}
            >
              {CardFront(s)}
            </button>
          ))}
          {!staff.length && (
            <div className="col-span-full text-center text-[#3a6b6b] py-8">
              No staff found.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[98vw] sm:max-w-[92vw] lg:w-[980px] max-h-[92vh] overflow-hidden relative">
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-2 right-2 text-[#a3c6c6] hover:text-[#2e4f4f] text-xl leading-none z-10"
              aria-label="Close"
            >
              ×
            </button>

            <div className="p-2 sm:p-4 overflow-y-auto max-h-[92vh]">
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
                <div ref={modalFrontRef}>{CardFront(selectedStaff)}</div>
                <div ref={modalBackRef}>{CardBack(selectedStaff)}</div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={downloadSelectedBoth}
                  className="bg-[#3a6b6b] hover:bg-[#4f8a8a] text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-[#2e4f4f] px-4 py-2 rounded-md"
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

export default StaffIDCardPage;