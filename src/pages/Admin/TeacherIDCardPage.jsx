import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Barcode from "react-barcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const TeacherIDCardPage = () => {
    const API = import.meta.env.VITE_SERVER_URL;
    const [teachers, setTeachers] = useState([]);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [progress, setProgress] = useState(0);
    const [printingSingle, setPrintingSingle] = useState(false);
    const [singleProgress, setSingleProgress] = useState(0);
    const [selectedTeacherCard, setSelectedTeacherCard] = useState(null);
    const [schoolName, setSchoolName] = useState("SCHOOL NAME");

    const fetchSchoolName = async () => {
    try {
        const token = Cookies.get("access_token");
        const res = await axios.get(`${API}classes/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const classes = res.data?.data?.results || [];
        if (classes.length > 0 && classes[0].school) {
            setSchoolName(classes[0].school);
        }
    } catch (error) {
        console.error("Error fetching school name:", error);
    }
};


    const fetchAllTeachers = async () => {
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API}api/auth/users/list_profiles/teacher/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const teachers = res.data.data?.results || [];
            setTeachers(teachers);
        } catch (error) {
            console.error("Error loading teachers", error);
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

            doc.save("teacher-id-cards.pdf");
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Error generating PDF. Please try again.");
        } finally {
            setLoadingPDF(false);
            setProgress(0);
        }
    };

    const printSingleCard = async (teacher) => {
        setPrintingSingle(true);
        setSingleProgress(0);
        try {
            const card = document.getElementById(`card-${teacher.profile_id}`);
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
            const fileName = `teacher-id-card-${teacher.first_name}-${teacher.last_name}.pdf`;
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
        fetchAllTeachers();
        fetchSchoolName();
    }, []);

    return (
        <div className="p-6 bg-blue-50 min-h-screen">
            {/* Loading Overlay */}
            {loadingPDF && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-500"></div>
                        <p className="mt-4 text-gray-700 font-medium">Generating PDF...</p>
                        <div className="w-64 bg-gray-200 rounded-full h-3 mt-3">
                            <div
                                className="bg-red-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{Math.round(progress)}% Complete</p>
                        <p className="mt-1 text-xs text-gray-500">Processing in batches for optimal speed</p>
                    </div>
                </div>
            )}

            {/* Modal for Selected Card */}
            {selectedTeacherCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                        <div className="flex flex-col items-center gap-4">
                            {/* Modal Front Side */}
                            <div className="w-[300px] h-[175px] relative bg-white rounded-lg overflow-hidden shadow border border-red-800">
                                <div className="bg-red-800 px-4 py-1 text-white flex items-center justify-between">
                                    <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{schoolName}</span>
                                </div>
                                <div className="flex p-2 gap-3">
                                    <img
                                        src={selectedTeacherCard.profile_picture ? `${API}${selectedTeacherCard.profile_picture}` : "/default-avatar.png"}
                                        alt="teacher"
                                        className="w-[60px] h-[70px] rounded border object-cover"
                                    />
                                    <div className="text-[11px] text-gray-700 space-y-[2px]">
                                        <h2 className="text-sm font-bold text-red-800">TEACHER ID CARD</h2>
                                        <p><strong>Name:</strong> {selectedTeacherCard.first_name} {selectedTeacherCard.last_name}</p>
                                        <p><strong>ID:</strong> {selectedTeacherCard.profile_id}</p>
                                        <p><strong>Department:</strong> {selectedTeacherCard.department_name}</p>
                                        <p><strong>Issued:</strong> {issuedDate}</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-[280px] h-[45px] flex justify-center items-end overflow-hidden mb-3">
                                    <div className="relative w-[280px] top-[135px] px-7">
                                        <Barcode
                                            value={JSON.stringify({
                                                name: `${selectedTeacherCard.first_name} ${selectedTeacherCard.last_name}`,
                                                teacher_id: selectedTeacherCard.profile_id,
                                                department: selectedTeacherCard.department_name,
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
                            <div className="w-[300px] h-[175px] bg-white rounded-lg overflow-hidden shadow border border-red-800 text-[10px] text-gray-700 relative">
                                <div className="bg-red-800 px-4 py-1 text-white flex items-center justify-between">
                                    <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                    <span className="text-sm font-semibold">{schoolName}</span>
                                </div>
                                <div className="px-3 pt-2 pb-1 text-center leading-snug text-[10px] mt-5">
                                    This card confirms {selectedTeacherCard.first_name} {selectedTeacherCard.last_name} is a teacher of {schoolName}.
                                    It must be carried at all times during school activities. Report loss to admin.
                                </div>

                                <div className="absolute bottom-1 left-0 w-full px-3 flex justify-between text-[9px] text-red-800">
                                    <span>📞 {selectedTeacherCard.phone || '+92-000-0000000'}</span>
                                    <span>🌐 {selectedTeacherCard.email || 'school@example.com'}</span>
                                    <span>📍 {selectedTeacherCard.address || 'Kotli, AJK'}</span>
                                </div>
                            </div>

                            {/* Modal Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => printSingleCard(selectedTeacherCard)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                >
                                    Print Card
                                </button>
                                <button
                                    onClick={() => setSelectedTeacherCard(null)}
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
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-500"></div>
                        <p className="mt-4 text-gray-700 font-medium">Preparing Card for Print...</p>
                        <div className="w-64 bg-gray-200 rounded-full h-3 mt-3">
                            <div
                                className="bg-red-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${singleProgress}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{Math.round(singleProgress)}% Complete</p>
                    </div>
                </div>
            )}

            {/* Header and Filter Controls */}
            <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-t-md shadow">
                <h1 className="text-xl font-bold">Generate Teacher ID Cards</h1>
                <div className="flex gap-3">
                    {teachers.length > 0 && (
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
                {teachers.map((t) => (
                    <div
                        key={t.profile_id}
                        id={`card-${t.profile_id}`}
                        className="card-container flex flex-col items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedTeacherCard(t)}
                    >
                        {/* FRONT SIDE */}
                        <div className="w-[300px] h-[175px] relative bg-white rounded-lg overflow-hidden shadow border border-red-800 print:block">
                            <div className="bg-red-800 px-4 py-1 text-white flex items-center justify-between">
                                <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                <span className="text-sm font-semibold">{schoolName}</span>
                            </div>
                            <div className="flex p-2 gap-3">
                                <img
                                    src={t.profile_picture ? `${API}${t.profile_picture}` : "/default-avatar.png"}
                                    alt="teacher"
                                    className="w-[60px] h-[70px] rounded border object-cover"
                                />
                                <div className="text-[11px] text-gray-700 space-y-[2px]">
                                    <h2 className="text-sm font-bold text-red-800">TEACHER ID CARD</h2>
                                    <p><strong>Name:</strong> {t.first_name} {t.last_name}</p>
                                    <p><strong>ID:</strong> {t.profile_id}</p>
                                    <p><strong>Email:</strong> {t.email}</p>
                                    <p><strong>Issued:</strong> {issuedDate}</p>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-[280px] h-[45px] flex justify-center items-end overflow-hidden mb-3">
                                <div className="relative w-[280px] top-[135px] px-7">
                                    <Barcode
                                        value={JSON.stringify({
                                            name: `${t.first_name} ${t.last_name}`,
                                            teacher_id: t.profile_id,
                                            department: t.department_name,
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
                        <div className="card-back w-[300px] h-[175px] hidden print:block print:mt-4 bg-white rounded-lg overflow-hidden shadow border border-red-800 text-[10px] text-gray-700 relative">
                            <div className="bg-red-800 px-4 py-1 text-white flex items-center justify-between">
                                <img src="/school-logo.png" alt="Logo" className="w-6 h-6" />
                                <span className="text-sm font-semibold">{schoolName}</span>
                            </div>
                            <div className="px-3 pt-2 pb-1 text-center leading-snug text-[10px] mt-5">
                                This card confirms {t.first_name} {t.last_name} is a teacher of {schoolName}.
                                It must be carried at all times during school activities. Report loss to admin.
                            </div>

                            <div className="absolute bottom-1 left-0 w-full px-3 flex justify-between text-[9px] text-red-800">
                                <span>📞 {t.phone || '+92-000-0000000'}</span>
                                <span>🌐 {t.email || 'school@example.com'}</span>
                                <span>📍 {t.address || 'Kotli, AJK'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherIDCardPage;