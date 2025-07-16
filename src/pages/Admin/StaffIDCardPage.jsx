import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Barcode from "react-barcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const StaffIDCardPage = () => {
    const API = import.meta.env.VITE_SERVER_URL;
    const [staff, setStaff] = useState([]);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [progress, setProgress] = useState(0);
    const [printingSingle, setPrintingSingle] = useState(false);
    const [singleProgress, setSingleProgress] = useState(0);
    const [selectedStaffCard, setSelectedStaffCard] = useState(null);
    const [schoolName, setSchoolName] = useState("SCHOOL NAME");

    const fetchSchoolName = async () => {
    try {
        const token = Cookies.get("access_token");
        const res = await axios.get(`${API}classes/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const classData = res.data?.data?.results || [];
        if (classData.length > 0 && classData[0].school) {
            setSchoolName(classData[0].school);
        }
    } catch (error) {
        console.error("Error fetching school name", error);
    }
};


    const fetchAllStaff = async () => {
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API}api/auth/users/list_profiles/staff/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const staff = res.data.data?.results || [];
            setStaff(staff);
        } catch (error) {
            console.error("Error loading staff", error);
        }
    };

    const issuedDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });

    const generatePDF = async () => {
        setLoadingPDF(true);
        setProgress(0);

        try {
            const cards = document.querySelectorAll(".card-container");
            const totalCards = cards.length;

            if (totalCards === 0) {
                alert("No cards to generate!");
                setLoadingPDF(false);
                return;
            }

            const doc = new jsPDF("landscape", "mm", [85.6, 54]);
            const backSides = document.querySelectorAll(".card-back");
            backSides.forEach((back) => back.classList.remove("hidden"));

            const canvasOptions = {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
            };

            let processedCards = 0;

            for (let i = 0; i < totalCards; i++) {
                const card = cards[i];
                const front = card.children[0];
                const back = card.children[1];

                try {
                    setProgress((processedCards / totalCards) * 50);

                    const frontCanvas = await Promise.race([
                        html2canvas(front, canvasOptions),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
                    ]);

                    const backCanvas = await Promise.race([
                        html2canvas(back, canvasOptions),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
                    ]);

                    const frontImg = frontCanvas.toDataURL("image/jpeg", 0.95);
                    const backImg = backCanvas.toDataURL("image/jpeg", 0.95);

                    if (i > 0) doc.addPage();
                    doc.addImage(frontImg, "JPEG", 0, 0, 85.6, 54);
                    doc.addPage();
                    doc.addImage(backImg, "JPEG", 0, 0, 85.6, 54);

                    processedCards++;
                    setProgress(50 + (processedCards / totalCards) * 50);

                    await new Promise((resolve) => setTimeout(resolve, 10));
                } catch (error) {
                    console.error(`Error processing card ${i}:`, error);
                }
            }

            backSides.forEach((back) => back.classList.add("hidden"));

            if (doc.getNumberOfPages() > totalCards * 2) {
                doc.deletePage(doc.getNumberOfPages());
            }

            doc.save("staff-id-cards.pdf");
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Error generating PDF. Please try again.");
        } finally {
            setLoadingPDF(false);
            setProgress(0);
        }
    };

    const printSingleCard = async (staffMember) => {
        setPrintingSingle(true);
        setSingleProgress(0);
        try {
            const card = document.getElementById(`card-${staffMember.profile_id}`);
            const front = card.children[0];
            const back = card.children[1];
            back.classList.remove("hidden");

            const canvasOptions = {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
            };

            setSingleProgress(30);
            const frontCanvas = await html2canvas(front, canvasOptions);

            setSingleProgress(65);
            const backCanvas = await html2canvas(back, canvasOptions);

            const frontImg = frontCanvas.toDataURL("image/jpeg", 0.95);
            const backImg = backCanvas.toDataURL("image/jpeg", 0.95);

            const doc = new jsPDF("landscape", "mm", [85.6, 54]);
            doc.addImage(frontImg, "JPEG", 0, 0, 85.6, 54);
            doc.addPage();
            doc.addImage(backImg, "JPEG", 0, 0, 85.6, 54);

            setSingleProgress(95);
            await new Promise((resolve) => setTimeout(resolve, 500)); // for smooth animation

            // 📌 Save instead of opening new tab
            const fileName = `staff-id-card-${staffMember.first_name}-${staffMember.last_name}.pdf`;
            doc.save(fileName);

            back.classList.add("hidden");
            setSingleProgress(100);
        } catch (error) {
            console.error("Error printing card:", error);
            alert("Error generating card. Please try again.");
        } finally {
            setTimeout(() => {
                setPrintingSingle(false);
                setSingleProgress(0);
            }, 800);
        }
    };

    useEffect(() => {
        fetchAllStaff();
        fetchSchoolName();
    }, []);

    return (
        <div className="p-6 bg-blue-50 min-h-screen">
            {/* Loading Overlay */}
            {loadingPDF && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-yellow-500"></div>
                        <p className="mt-4 text-gray-700 font-medium">Generating PDF...</p>
                        <div className="w-64 bg-gray-200 rounded-full h-3 mt-3">
                            <div
                                className="bg-yellow-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{Math.round(progress)}% Complete</p>
                        <p className="mt-1 text-xs text-gray-500">Processing in batches for optimal speed</p>
                    </div>
                </div>
            )}

            {/* Modal for Selected Card */}
            {selectedStaffCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                        <div className="flex flex-col items-center gap-4">
                            {/* Modal Front Side */}
                            <div className="w-[300px] h-[175px] relative bg-white rounded-lg overflow-hidden shadow border border-yellow-500">
                                <div className="bg-yellow-500 px-4 py-1 text-white flex items-center justify-between">
                                    <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{schoolName}</span>
                                </div>
                                <div className="flex p-2 gap-3">
                                    <img
                                        src={selectedStaffCard.profile_picture ? `${API}${selectedStaffCard.profile_picture}` : "/default-avatar.png"}
                                        alt="staff"
                                        className="w-[60px] h-[70px] rounded border object-cover"
                                    />
                                    <div className="text-[11px] text-gray-700 space-y-[2px]">
                                        <h2 className="text-sm font-bold text-yellow-500">STAFF ID CARD</h2>
                                        <p><strong>Name:</strong> {selectedStaffCard.first_name} {selectedStaffCard.last_name}</p>
                                        <p><strong>ID:</strong> {selectedStaffCard.profile_id}</p>
                                        <p><strong>Position:</strong> {selectedStaffCard.position || 'Staff Member'}</p>
                                        <p><strong>Issued:</strong> {issuedDate}</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-[280px] h-[45px] flex justify-center items-end overflow-hidden mb-3">
                                    <div className="relative w-[280px] top-[135px] px-7">
                                        <Barcode
                                            value={JSON.stringify({
                                                name: `${selectedStaffCard.first_name} ${selectedStaffCard.last_name}`,
                                                staff_id: selectedStaffCard.profile_id,
                                                position: selectedStaffCard.position || 'Staff Member',
                                                issued_on: issuedDate,
                                            })}
                                            format="CODE128"
                                            width={1.5}
                                            height={150}
                                            fontSize={12}
                                            displayValue={false}
                                            margin={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Back Side */}
                            <div className="w-[300px] h-[175px] bg-white rounded-lg overflow-hidden shadow border border-yellow-500 text-[10px] text-gray-700 relative">
                                <div className="bg-yellow-500 px-4 py-1 text-white flex items-center justify-between">
                                    <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{schoolName}</span>
                                </div>
                                <div className="px-3 pt-2 pb-1 text-center leading-snug text-[10px] mt-5">
                                    This card confirms {selectedStaffCard.first_name} {selectedStaffCard.last_name} is a staff member of {schoolName}.
                                    It must be carried at all times during school activities. Report loss to admin.
                                </div>

                                <div className="absolute bottom-1 left-0 w-full px-3 flex justify-between text-[9px] text-yellow-500">
                                    <span>📞 {selectedStaffCard.phone || '+92-000-0000000'}</span>
                                    <span>🌐 {selectedStaffCard.email || 'school@example.com'}</span>
                                    <span>📍 {selectedStaffCard.address || 'Kotli, AJK'}</span>
                                </div>
                            </div>

                            {/* Modal Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => printSingleCard(selectedStaffCard)}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                                >
                                    Print Card
                                </button>
                                <button
                                    onClick={() => setSelectedStaffCard(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {printingSingle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm w-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-yellow-500"></div>
                        <p className="mt-4 text-gray-700 font-medium">Preparing Card for Print...</p>
                        <div className="w-64 bg-gray-200 rounded-full h-3 mt-3">
                            <div
                                className="bg-yellow-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${singleProgress}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{Math.round(singleProgress)}% Complete</p>
                    </div>
                </div>
            )}

            {/* Header and Filter Controls */}
            <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-t-md shadow">
                <h1 className="text-xl font-bold">Generate Staff ID Cards</h1>
                <div className="flex gap-3">
                    {staff.length > 0 && (
                        <button
                            onClick={generatePDF}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors flex items-center gap-2"
                            disabled={loadingPDF}
                        >
                            {loadingPDF ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                "Download PDF"
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {staff.map((s) => (
                    <div
                        key={s.profile_id}
                        id={`card-${s.profile_id}`}
                        className="card-container flex flex-col items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedStaffCard(s)}
                    >
                        {/* FRONT SIDE */}
                        <div className="w-[300px] h-[175px] relative bg-white rounded-lg overflow-hidden shadow border border-yellow-500 print:block">
                            <div className="bg-yellow-500 px-4 py-1 text-white flex items-center justify-between">
                                <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                <span className="text-sm font-semibold">{schoolName}</span>
                            </div>
                            <div className="flex p-2 gap-3">
                                <img
                                    src={s.profile_picture ? `${API}${s.profile_picture}` : "/default-avatar.png"}
                                    alt="staff"
                                    className="w-[60px] h-[70px] rounded border object-cover"
                                />
                                <div className="text-[11px] text-gray-700 space-y-[2px]">
                                    <h2 className="text-sm font-bold text-yellow-500">STAFF ID CARD</h2>
                                    <p><strong>Name:</strong> {s.first_name} {s.last_name}</p>
                                    <p><strong>ID:</strong> {s.profile_id || "N/A"}</p>
                                    <p><strong>Email:</strong> {s.email}</p>
                                    <p><strong>Issued:</strong> {issuedDate}</p>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-[280px] h-[45px] flex justify-center items-end overflow-hidden mb-3">
                                <div className="relative w-[280px] top-[135px] px-7">
                                    <Barcode
                                        value={JSON.stringify({
                                            name: `${s.first_name} ${s.last_name}`,
                                            staff_id: s.profile_id,
                                            position: s.position || 'Staff Member',
                                            issued_on: issuedDate,
                                        })}
                                        format="CODE128"
                                        width={1.5}
                                        height={150}
                                        fontSize={12}
                                        displayValue={false}
                                        margin={0}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BACK SIDE */}
                        <div className="card-back w-[300px] h-[175px] hidden print:block print:mt-4 bg-white rounded-lg overflow-hidden shadow border border-yellow-500 text-[10px] text-gray-700 relative">
                            <div className="bg-yellow-500 px-4 py-1 text-white flex items-center justify-between">
                                <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                <span className="text-sm font-semibold">{schoolName}</span>
                            </div>
                            <div className="px-3 pt-2 pb-1 text-center leading-snug text-[10px] mt-5">
                                This card confirms {s.first_name} {s.last_name} is a staff member of {schoolName}.
                                It must be carried at all times during school activities. Report loss to admin.
                            </div>

                            <div className="absolute bottom-1 left-0 w-full px-3 flex justify-between text-[9px] text-yellow-500">
                                <span>📞 {s.phone || '+92-000-0000000'}</span>
                                <span>🌐 {s.email || 'school@example.com'}</span>
                                <span>📍 {s.address || 'Kotli, AJK'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffIDCardPage;