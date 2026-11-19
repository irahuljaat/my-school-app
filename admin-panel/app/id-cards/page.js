"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
    HiOutlineIdentification,
    HiOutlineDownload,
    HiOutlineSparkles,
    HiOutlinePrinter,
    HiOutlineColorSwatch,
    HiOutlineSearch,
    HiOutlineTemplate,
    HiOutlineUser,
    HiOutlinePhotograph,
    HiOutlinePencilAlt
} from "react-icons/hi";
import * as XLSX from "xlsx";
import JSZip from "jszip";

const TEMPLATES = [
    // Original 6
    { id: "v1", code: "V1", name: "Classic Crest", orientation: "vertical", group: "original" },
    { id: "v2", code: "V2", name: "Modern Split", orientation: "vertical", group: "original" },
    { id: "v3", code: "V3", name: "Editorial Minimal", orientation: "vertical", group: "original" },
    { id: "h1", code: "H1", name: "Executive Side", orientation: "horizontal", group: "original" },
    { id: "h2", code: "H2", name: "Banner Dual-Tone", orientation: "horizontal", group: "original" },
    { id: "h3", code: "H3", name: "Sleek Badge", orientation: "horizontal", group: "original" },

    // New 6 (Multi-Color & Passport Photo)
    { id: "v4", code: "V4", name: "Arc Ribbon Multi", orientation: "vertical", group: "reference" },
    { id: "v5", code: "V5", name: "Crimson Wave Tag", orientation: "vertical", group: "reference" },
    { id: "v6", code: "V6", name: "Duo-Arc Crest", orientation: "vertical", group: "reference" },
    { id: "h4", code: "H4", name: "Wave Flow Card", orientation: "horizontal", group: "reference" },
    { id: "h5", code: "H5", name: "Horizon Ribbon", orientation: "horizontal", group: "reference" },
    { id: "h6", code: "H6", name: "Prism Split Banner", orientation: "horizontal", group: "reference" },
];

const COLOR_PRESETS = [
    { name: "Navy, Gold & Sky", primary: "#142440", accent: "#F59E0B", wave: "#0284C7", bg: "#FFFFFF" },
    { name: "Crimson, Amber & Slate", primary: "#BE123C", accent: "#F59E0B", wave: "#334155", bg: "#F8FAFC" },
    { name: "Violet, Cyan & Indigo", primary: "#6D28D9", accent: "#06B6D4", wave: "#1D4ED8", bg: "#FFFFFF" },
    { name: "Emerald, Lime & Teal", primary: "#047857", accent: "#84CC16", wave: "#0F766E", bg: "#FFFFFF" },
    { name: "Royal Blue, Gold & Rose", primary: "#1E3A8A", accent: "#EAB308", wave: "#E11D48", bg: "#FFFFFF" },
    { name: "Charcoal, Orange & Gold", primary: "#18181B", accent: "#F97316", wave: "#D97706", bg: "#FAFAFA" },
];

export default function IdCardsExportPage() {
    const [activeSession, setActiveSession] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(true);
    const [statusText, setStatusText] = useState("");
    const [allStudents, setAllStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Design & Unlimited Multi-Color State
    const [selectedTemplate, setSelectedTemplate] = useState("v4");
    const [primaryColor, setPrimaryColor] = useState("#142440");
    const [accentColor, setAccentColor] = useState("#F59E0B");
    const [waveColor, setWaveColor] = useState("#0284C7");
    const [cardBgColor, setCardBgColor] = useState("#FFFFFF");

    // School Branding, Logo & Optional Signatures State
    const [schoolName, setSchoolName] = useState("MVG PUBLIC SR. SEC. SCHOOL");
    const [schoolSubtext, setSchoolSubtext] = useState("Shyopur, Pratap Nagar, Sanganer, Jaipur");
    const [schoolLogo, setSchoolLogo] = useState("");

    const [showTeacherSign, setShowTeacherSign] = useState(true);
    const [teacherSignUrl, setTeacherSignUrl] = useState("");

    const [showPrincipalSign, setShowPrincipalSign] = useState(true);
    const [principalSignUrl, setPrincipalSignUrl] = useState("");

    const [previewLimit, setPreviewLimit] = useState(24);

    useEffect(() => {
        const fetchSettingsAndStudents = async () => {
            setFetchingStudents(true);
            try {
                const settingsSnap = await getDoc(doc(db, "config", "settings"));
                if (settingsSnap.exists()) {
                    const data = settingsSnap.data();
                    const session = data.activeSession;
                    setActiveSession(session);
                    if (data.schoolName) setSchoolName(data.schoolName);
                    if (data.schoolAddress) setSchoolSubtext(data.schoolAddress);
                    if (data.schoolLogo || data.logoUrl) {
                        setSchoolLogo(data.schoolLogo || data.logoUrl);
                    }
                    if (data.teacherSignature || data.teacherSignUrl) {
                        setTeacherSignUrl(data.teacherSignature || data.teacherSignUrl);
                    }
                    if (data.principalSignature || data.principalSignUrl) {
                        setPrincipalSignUrl(data.principalSignature || data.principalSignUrl);
                    }

                    const studentsSnap = await getDocs(collection(db, "sessions", session, "students"));
                    const studentDocs = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
                    const active = studentDocs.filter(s => s.grade !== "PASSED OUT");

                    active.sort((a, b) => {
                        const gradeA = String(a.grade || "").trim();
                        const gradeB = String(b.grade || "").trim();
                        if (gradeA !== gradeB) {
                            return gradeA.localeCompare(gradeB, undefined, { numeric: true, sensitivity: "base" });
                        }
                        return String(a.name || "").trim().localeCompare(String(b.name || "").trim(), undefined, { sensitivity: "base" });
                    });

                    setAllStudents(active);

                    const uniqueClasses = Array.from(
                        new Set(active.map(s => String(s.grade || "Unassigned").trim()))
                    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
                    setClasses(uniqueClasses);
                }
            } catch (err) {
                console.error("Error loading session config:", err);
            } finally {
                setFetchingStudents(false);
            }
        };
        fetchSettingsAndStudents();
    }, []);

    const readImageFileAsDataUrl = (file, setter) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setter(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const matchesClass = selectedClass === "ALL" || String(s.grade || "").trim() === selectedClass;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                String(s.name || "").toLowerCase().includes(q) ||
                String(s.fatherName || s.fathersName || "").toLowerCase().includes(q) ||
                String(s.rollNo || s.rollNumber || "").toLowerCase().includes(q);
            return matchesClass && matchesSearch;
        });
    }, [allStudents, selectedClass, searchQuery]);

    // Helper to convert Base64 Data URL or standard URL into an ArrayBuffer for JSZip
    const convertImageToBuffer = async (urlOrDataUri) => {
        if (!urlOrDataUri || typeof urlOrDataUri !== "string") return null;

        if (urlOrDataUri.startsWith("data:")) {
            try {
                const base64Parts = urlOrDataUri.split(",");
                if (base64Parts.length < 2) return null;
                const base64Content = base64Parts[1];
                const binaryString = atob(base64Content);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            } catch (e) {
                console.warn("Failed to parse base64 image data:", e);
                return null;
            }
        }

        if (urlOrDataUri.startsWith("http")) {
            try {
                const response = await fetch(urlOrDataUri, { mode: "cors" });
                if (response.ok) {
                    const blob = await response.blob();
                    return await blob.arrayBuffer();
                }
            } catch (err) {
                console.warn("Failed to fetch web URL image:", urlOrDataUri);
            }
        }

        return null;
    };

    // Preserved ZIP + Excel Export Handler
    const handleExport = async () => {
        if (!activeSession) return;
        setLoading(true);
        setStatusText("Fetching student database...");

        try {
            const studentsSnap = await getDocs(collection(db, "sessions", activeSession, "students"));
            let students = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id }))
                .filter(s => s.grade !== "PASSED OUT");

            if (selectedClass !== "ALL") {
                students = students.filter(s => String(s.grade || "").trim() === selectedClass);
            }

            if (students.length === 0) {
                alert("No students found for the selected filter.");
                setLoading(false);
                setStatusText("");
                return;
            }

            students.sort((a, b) => {
                const gradeA = String(a.grade || "").trim();
                const gradeB = String(b.grade || "").trim();
                if (gradeA !== gradeB) {
                    return gradeA.localeCompare(gradeB, undefined, { numeric: true, sensitivity: "base" });
                }
                const nameA = String(a.name || "").trim();
                const nameB = String(b.name || "").trim();
                return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
            });

            setStatusText("Processing student records and bundling profile images...");

            const zip = new JSZip();
            const imagesFolder = zip.folder("profile_images");

            const excelRows = [];
            const usedImageNames = new Set();

            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                setStatusText(`Processing student ${i + 1} of ${students.length}: ${student.name || "Unnamed"}`);

                let imageFilename = "";
                const photoData = student.imageUrl || student.photoUrl || student.profilePhoto || student.image || student.photo || "";

                if (photoData) {
                    const arrayBufferData = await convertImageToBuffer(photoData);
                    if (arrayBufferData) {
                        let baseName = (student.name || "student")
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, "_");

                        let uniqueName = `${baseName}_${student.id.slice(-5)}.jpg`;
                        let counter = 1;
                        while (usedImageNames.has(uniqueName)) {
                            uniqueName = `${baseName}_${student.id.slice(-5)}_${counter}.jpg`;
                            counter++;
                        }
                        usedImageNames.add(uniqueName);

                        imagesFolder.file(uniqueName, arrayBufferData);
                        imageFilename = `profile_images/${uniqueName}`;
                    }
                }

                excelRows.push({
                    "Class": student.grade || "N/A",
                    "Roll No": student.rollNo || student.rollNumber || student.roll || "N/A",
                    "Student Name": student.name || "N/A",
                    "Father's Name": student.fatherName || student.fathersName || "N/A",
                    "Date of Birth (DOB)": student.dob || "N/A",
                    "Address": student.address || "N/A",
                    "Contact No": student.contact || student.phone || student.mobile || "N/A",
                    "Profile Photo Filename": imageFilename || "No Image"
                });
            }

            setStatusText("Generating Excel Workbook...");
            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students ID Data");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const excelBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const filenameSuffix = selectedClass === "ALL" ? "All_Classes" : `Class_${selectedClass}`;
            zip.file(`Students_ID_Records_${filenameSuffix}.xlsx`, excelBlob);

            setStatusText("Compressing into ZIP archive...");
            const content = await zip.generateAsync({ type: "blob" });

            const downloadUrl = URL.createObjectURL(content);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `Student_ID_Cards_Package_${filenameSuffix}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            setStatusText("Download complete!");
        } catch (err) {
            console.error("Export error:", err);
            alert("An error occurred during export. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const currentTemplateObj = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

    return (
        <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-6 lg:p-8 font-sans">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-cards-grid,
                    #printable-cards-grid * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #printable-cards-grid {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 14px;
                        justify-content: center;
                        padding: 10px;
                    }
                    .id-card-item {
                        break-inside: avoid;
                        page-break-inside: avoid;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header & Existing ZIP Export Section */}
                <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-gray-100 space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-400 text-gray-900 rounded-2xl shadow-sm">
                                <HiOutlineIdentification size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    ID Cards Studio & Assets Export
                                </h1>
                                <p className="text-sm font-medium text-gray-500">
                                    12 designs (6 vertical + 6 horizontal), optional teacher & principal signatures, and Excel + Photo ZIP export.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={filteredStudents.length === 0}
                                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                            >
                                <HiOutlinePrinter size={19} />
                                Print / Save PDF ({filteredStudents.length})
                            </button>

                            <button
                                onClick={handleExport}
                                disabled={loading || !activeSession}
                                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                            >
                                <HiOutlineDownload size={19} />
                                {loading ? "Processing Export..." : "Download ZIP Package"}
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="p-4 bg-yellow-50/80 rounded-2xl border border-yellow-200 flex items-center gap-3 text-yellow-800 animate-pulse">
                            <HiOutlineSparkles size={22} className="flex-shrink-0 animate-spin" />
                            <div className="text-sm font-bold">{statusText}</div>
                        </div>
                    )}
                </div>

                {/* Customization Control Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: 12 Templates, School Logo & Optional Signatures */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                <HiOutlineTemplate size={20} className="text-yellow-500" />
                                <span>Select Design (6 Vertical + 6 Horizontal)</span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                {currentTemplateObj.code} • {currentTemplateObj.orientation}
                            </span>
                        </div>

                        {/* Vertical Templates */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                Vertical Designs (V1–V3 Classic & V4–V6 Multi-Color)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {TEMPLATES.filter(t => t.orientation === "vertical").map(tpl => {
                                    const isActive = selectedTemplate === tpl.id;
                                    return (
                                        <button
                                            key={tpl.id}
                                            onClick={() => setSelectedTemplate(tpl.id)}
                                            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                                isActive
                                                    ? "border-gray-900 bg-gray-50 shadow-sm"
                                                    : "border-gray-100 hover:border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div
                                                className="w-8 h-11 rounded-md border border-gray-200 flex flex-col overflow-hidden shrink-0"
                                                style={{ backgroundColor: cardBgColor }}
                                            >
                                                <div className="h-3 w-full" style={{ backgroundColor: primaryColor }} />
                                                <div
                                                    className="w-4 h-5 rounded-xs mx-auto -mt-1.5 border border-white"
                                                    style={{ backgroundColor: tpl.group === "reference" ? waveColor : accentColor }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase" style={{ color: primaryColor }}>
                                                    {tpl.code} {tpl.group === "reference" ? "• MULTI" : ""}
                                                </div>
                                                <div className="text-xs font-bold text-gray-900 truncate">{tpl.name}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Horizontal Templates */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                Horizontal Designs (H1–H3 Classic & H4–H6 Multi-Color)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {TEMPLATES.filter(t => t.orientation === "horizontal").map(tpl => {
                                    const isActive = selectedTemplate === tpl.id;
                                    return (
                                        <button
                                            key={tpl.id}
                                            onClick={() => setSelectedTemplate(tpl.id)}
                                            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                                isActive
                                                    ? "border-gray-900 bg-gray-50 shadow-sm"
                                                    : "border-gray-100 hover:border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div
                                                className="w-12 h-8 rounded-md border border-gray-200 flex overflow-hidden shrink-0"
                                                style={{ backgroundColor: cardBgColor }}
                                            >
                                                <div className="w-3.5 h-full" style={{ backgroundColor: primaryColor }} />
                                                <div className="flex-1 p-1 flex flex-col justify-center gap-1">
                                                    <div
                                                        className="h-1.5 w-6 rounded"
                                                        style={{ backgroundColor: tpl.group === "reference" ? waveColor : accentColor }}
                                                    />
                                                    <div className="h-1 w-4 rounded bg-gray-200" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase" style={{ color: primaryColor }}>
                                                    {tpl.code} {tpl.group === "reference" ? "• MULTI" : ""}
                                                </div>
                                                <div className="text-xs font-bold text-gray-900 truncate">{tpl.name}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* School Name, Address & Logo */}
                        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">School Name</label>
                                <input
                                    type="text"
                                    value={schoolName}
                                    onChange={e => setSchoolName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Address / Subtext</label>
                                <input
                                    type="text"
                                    value={schoolSubtext}
                                    onChange={e => setSchoolSubtext(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">School Logo</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 cursor-pointer flex items-center justify-center gap-1.5 truncate">
                                        <HiOutlinePhotograph size={15} className="text-yellow-600 shrink-0" />
                                        <span className="truncate">{schoolLogo ? "Change Logo" : "Upload Logo"}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => readImageFileAsDataUrl(e.target.files?.[0], setSchoolLogo)}
                                            className="hidden"
                                        />
                                    </label>
                                    {schoolLogo && (
                                        <button
                                            onClick={() => setSchoolLogo("")}
                                            className="text-[11px] font-bold text-red-600 hover:underline px-1 cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Optional Teacher & Principal Signature Image Upload */}
                        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Teacher Signature (Optional) */}
                            <div
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                    showTeacherSign ? "bg-gray-50 border-gray-200" : "bg-gray-50/50 border-gray-100 opacity-75"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                            <HiOutlinePencilAlt size={15} className="text-yellow-600 shrink-0" />
                                            <span>Teacher Sign</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowTeacherSign(prev => !prev)}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors ${
                                                showTeacherSign
                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                            }`}
                                            title="Toggle Teacher Signature on ID Cards"
                                        >
                                            {showTeacherSign ? "Shown" : "Hidden"}
                                        </button>
                                    </div>

                                    {showTeacherSign ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                                                {teacherSignUrl ? "Change Sign" : "Upload Sign"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => readImageFileAsDataUrl(e.target.files?.[0], setTeacherSignUrl)}
                                                    className="hidden"
                                                />
                                            </label>
                                            {teacherSignUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTeacherSignUrl("")}
                                                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-500 mt-1.5">
                                            Optional — hidden on cards
                                        </p>
                                    )}
                                </div>

                                {showTeacherSign && (
                                    <div className="w-20 h-10 rounded-lg bg-white border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 px-1">
                                        {teacherSignUrl ? (
                                            <img
                                                src={teacherSignUrl}
                                                alt="Teacher Signature"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[9px] font-semibold text-gray-400">Blank Line</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Principal Signature (Optional) */}
                            <div
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                    showPrincipalSign ? "bg-gray-50 border-gray-200" : "bg-gray-50/50 border-gray-100 opacity-75"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                            <HiOutlinePencilAlt size={15} className="text-yellow-600 shrink-0" />
                                            <span>Principal Sign</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPrincipalSign(prev => !prev)}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors ${
                                                showPrincipalSign
                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                            }`}
                                            title="Toggle Principal Signature on ID Cards"
                                        >
                                            {showPrincipalSign ? "Shown" : "Hidden"}
                                        </button>
                                    </div>

                                    {showPrincipalSign ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                                                {principalSignUrl ? "Change Sign" : "Upload Sign"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => readImageFileAsDataUrl(e.target.files?.[0], setPrincipalSignUrl)}
                                                    className="hidden"
                                                />
                                            </label>
                                            {principalSignUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPrincipalSignUrl("")}
                                                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-500 mt-1.5">
                                            Optional — hidden on cards
                                        </p>
                                    )}
                                </div>

                                {showPrincipalSign && (
                                    <div className="w-20 h-10 rounded-lg bg-white border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 px-1">
                                        {principalSignUrl ? (
                                            <img
                                                src={principalSignUrl}
                                                alt="Principal Signature"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[9px] font-semibold text-gray-400">Blank Line</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Unlimited Multi-Color Pickers & Filter Controls */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                <HiOutlineColorSwatch size={20} className="text-yellow-500" />
                                <span>Unlimited Multi-Color Studio</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="w-full text-[11px] font-mono font-bold text-gray-700 bg-transparent uppercase outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <input
                                            type="text"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="w-full text-[11px] font-mono font-bold text-gray-700 bg-transparent uppercase outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Wave / Multi-Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={waveColor}
                                            onChange={e => setWaveColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <input
                                            type="text"
                                            value={waveColor}
                                            onChange={e => setWaveColor(e.target.value)}
                                            className="w-full text-[11px] font-mono font-bold text-gray-700 bg-transparent uppercase outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Card Surface</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={cardBgColor}
                                            onChange={e => setCardBgColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <input
                                            type="text"
                                            value={cardBgColor}
                                            onChange={e => setCardBgColor(e.target.value)}
                                            className="w-full text-[11px] font-mono font-bold text-gray-700 bg-transparent uppercase outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Multi-Color Palettes
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {COLOR_PRESETS.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => {
                                                setPrimaryColor(preset.primary);
                                                setAccentColor(preset.accent);
                                                setWaveColor(preset.wave);
                                                setCardBgColor(preset.bg);
                                            }}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 bg-white text-[11px] font-semibold text-gray-700 transition-all cursor-pointer"
                                            title={preset.name}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                                            <span className="w-2.5 h-2.5 rounded-full -ml-1 border border-white" style={{ backgroundColor: preset.accent }} />
                                            <span className="w-2.5 h-2.5 rounded-full -ml-1 border border-white" style={{ backgroundColor: preset.wave }} />
                                            <span>{preset.name.split(",")[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Class & Search Filter */}
                        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Filter by Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        setPreviewLimit(24);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="ALL">All Classes ({allStudents.length})</option>
                                    {classes.map(cls => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Search Student</label>
                                <div className="relative">
                                    <HiOutlineSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Name, father, or roll no..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Student ID Cards Gallery */}
                <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-gray-100 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Live Student ID Cards Preview
                            </h2>
                            <p className="text-xs font-medium text-gray-500">
                                Showing {Math.min(previewLimit, filteredStudents.length)} of {filteredStudents.length} students • Design:{" "}
                                <span className="font-bold text-gray-800">{currentTemplateObj.code} — {currentTemplateObj.name}</span>
                            </p>
                        </div>

                        {filteredStudents.length > previewLimit && (
                            <button
                                onClick={() => setPreviewLimit(prev => prev + 36)}
                                className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                            >
                                Load More Cards (+36)
                            </button>
                        )}
                    </div>

                    {fetchingStudents ? (
                        <div className="py-16 text-center text-sm font-bold text-gray-400 animate-pulse">
                            Loading student records for ID card generation...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="py-16 text-center text-sm font-bold text-gray-400">
                            No students match the selected class or search query.
                        </div>
                    ) : (
                        <div
                            id="printable-cards-grid"
                            className={`grid gap-6 justify-items-center ${
                                currentTemplateObj.orientation === "vertical"
                                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                            }`}
                        >
                            {filteredStudents.slice(0, previewLimit).map(student => (
                                <StudentIdCard
                                    key={student.id}
                                    student={student}
                                    template={selectedTemplate}
                                    primaryColor={primaryColor}
                                    accentColor={accentColor}
                                    waveColor={waveColor}
                                    cardBgColor={cardBgColor}
                                    schoolName={schoolName}
                                    schoolSubtext={schoolSubtext}
                                    schoolLogo={schoolLogo}
                                    showTeacherSign={showTeacherSign}
                                    teacherSignUrl={teacherSignUrl}
                                    showPrincipalSign={showPrincipalSign}
                                    principalSignUrl={principalSignUrl}
                                    session={activeSession}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
   STUDENT ID CARD COMPONENT (12 DESIGNS: 6 VERTICAL + 6 HORIZONTAL)
   - Fixed fields: Name, Father's Name, Roll No, DOB, Mob No., Address
   - Clean fitted info box & signature line with no grey placeholder text
   ============================================================================ */
function StudentIdCard({
    student,
    template,
    primaryColor,
    accentColor,
    waveColor,
    cardBgColor,
    schoolName,
    schoolSubtext,
    schoolLogo,
    showTeacherSign,
    teacherSignUrl,
    showPrincipalSign,
    principalSignUrl,
    session
}) {
    const photoUrl =
        student.imageUrl ||
        student.photoUrl ||
        student.profilePhoto ||
        student.image ||
        student.photo ||
        "";

    const studentName = student.name || "Student Name";
    const grade = student.grade || "N/A";

    const cardFields = [
        { key: "fatherName", label: "Father's Name", value: student.fatherName || student.fathersName || "N/A" },
        { key: "rollNo", label: "Roll No", value: student.rollNo || student.rollNumber || student.roll || "N/A" },
        { key: "dob", label: "DOB", value: student.dob || "N/A" },
        { key: "contact", label: "Mob No.", value: student.contact || student.phone || student.mobile || "N/A" },
        { key: "address", label: "Address", value: student.address || "Jaipur, Rajasthan" },
    ];

    const SchoolLogoBadge = ({ sizeClass = "w-6 h-6 text-[9px]", ringColor = "#FFFFFF" }) => (
        <div
            className={`rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0 font-black shadow-xs ${sizeClass}`}
            style={{ border: `1.5px solid ${ringColor}`, color: primaryColor }}
        >
            {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
                <span>{schoolName.slice(0, 2).toUpperCase()}</span>
            )}
        </div>
    );

    const PassportPhoto = ({ className = "w-[72px] h-[92px] rounded-lg", borderStyle = {} }) => (
        <div
            className={`overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 ${className}`}
            style={borderStyle}
        >
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover object-top"
                />
            ) : (
                <HiOutlineUser className="w-8 h-8 text-gray-400" />
            )}
        </div>
    );

    const SignatureBlock = ({ label, signUrl, align = "center", textColor = "#374151" }) => (
        <div
            className={`flex flex-col ${
                align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center"
            } min-w-0`}
        >
            <div className="w-16 h-5 flex items-end justify-center overflow-hidden">
                {signUrl && (
                    <img
                        src={signUrl}
                        alt={label}
                        className="max-w-full max-h-full object-contain"
                    />
                )}
            </div>
            <span
                className="text-[7.5px] font-extrabold uppercase tracking-tight leading-none mt-1 pt-0.5 border-t border-gray-300/80 min-w-[54px] text-center"
                style={{ color: textColor }}
            >
                {label}
            </span>
        </div>
    );

    const renderSignaturesRow = (leftColor = primaryColor, rightColor = primaryColor, wrapperClass = "") => {
        if (!showTeacherSign && !showPrincipalSign) return null;
        return (
            <div className={`flex items-end justify-between ${wrapperClass}`}>
                {showTeacherSign ? (
                    <SignatureBlock label="Teacher Sign" signUrl={teacherSignUrl} align="left" textColor={leftColor} />
                ) : (
                    <div />
                )}
                {showPrincipalSign ? (
                    <SignatureBlock label="Principal Sign" signUrl={principalSignUrl} align="right" textColor={rightColor} />
                ) : (
                    <div />
                )}
            </div>
        );
    };

    const renderFieldRows = (spaced = true) => (
        <div className={spaced ? "space-y-1" : "space-y-0.5"}>
            {cardFields.map(item => (
                <div key={item.key} className="flex items-baseline justify-between gap-2 text-[9px] leading-tight">
                    <span className="font-semibold text-gray-600 shrink-0">{item.label}:</span>
                    <span className="font-bold text-gray-900 text-right truncate">{item.value}</span>
                </div>
            ))}
        </div>
    );

    /* ==================== ORIGINAL VERTICAL 1: CLASSIC CREST ==================== */
    if (template === "v1") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div
                    className="pt-3.5 pb-12 px-3 text-center text-white relative"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <SchoolLogoBadge sizeClass="w-5 h-5 text-[8px]" ringColor={accentColor} />
                        <div className="text-[10.5px] font-extrabold tracking-wide uppercase leading-tight truncate">
                            {schoolName}
                        </div>
                    </div>
                    <div className="text-[8px] opacity-85 mt-0.5 truncate">{schoolSubtext}</div>
                    <div
                        className="inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                    >
                        Session {session || "2026-27"}
                    </div>
                </div>

                <div className="-mt-10 flex justify-center z-10">
                    <PassportPhoto
                        className="w-[74px] h-[94px] rounded-lg shadow-md"
                        borderStyle={{ border: `2.5px solid ${accentColor}` }}
                    />
                </div>

                <div className="text-center px-3 mt-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-tight truncate" style={{ color: primaryColor }}>
                        {studentName}
                    </h3>
                    <span
                        className="inline-block text-[9.5px] font-bold px-2.5 py-0.5 rounded-md mt-0.5"
                        style={{ backgroundColor: `${accentColor}25`, color: primaryColor }}
                    >
                        Class: {grade}
                    </span>
                </div>

                <div className="px-4 py-2">
                    {renderFieldRows(true)}
                </div>

                {renderSignaturesRow(primaryColor, primaryColor, "px-3 pb-1.5 pt-1")}

                <div
                    className="h-5 px-3 flex items-center justify-center text-[7.5px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span>Student Identity Card</span>
                </div>
            </div>
        );
    }

    /* ==================== ORIGINAL VERTICAL 2: MODERN SPLIT ==================== */
    if (template === "v2") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div
                    className="w-9 flex flex-col items-center justify-between py-4 text-white shrink-0"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span className="text-[9px] font-bold tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 opacity-85">
                        {session || "2026-27"}
                    </span>
                    <div className="w-1.5 h-16 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-[9px] font-extrabold tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
                        STUDENT
                    </span>
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-start gap-2">
                        <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                        <div className="min-w-0">
                            <div className="text-[10.5px] font-black uppercase leading-tight truncate" style={{ color: primaryColor }}>
                                {schoolName}
                            </div>
                            <div className="text-[8px] text-gray-500 line-clamp-1">{schoolSubtext}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 my-1.5">
                        <PassportPhoto
                            className="w-[68px] h-[88px] rounded-lg shadow-xs"
                            borderStyle={{ border: `2px solid ${primaryColor}` }}
                        />
                        <div className="min-w-0">
                            <span
                                className="text-[9px] font-extrabold px-2 py-0.5 rounded text-white uppercase"
                                style={{ backgroundColor: accentColor }}
                            >
                                Class {grade}
                            </span>
                            <h3 className="text-xs font-extrabold text-gray-900 mt-1.5 leading-snug line-clamp-2">
                                {studentName}
                            </h3>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                        {renderFieldRows(true)}
                    </div>

                    {renderSignaturesRow(primaryColor, primaryColor, "pt-2")}
                </div>
            </div>
        );
    }

    /* ==================== ORIGINAL VERTICAL 3: EDITORIAL MINIMAL ==================== */
    if (template === "v3") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md overflow-hidden flex flex-col justify-between p-3.5 relative"
                style={{ backgroundColor: cardBgColor, border: `2px solid ${primaryColor}` }}
            >
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: `${primaryColor}25` }}>
                    <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={primaryColor} />
                    <div className="min-w-0">
                        <div className="text-[10.5px] font-extrabold uppercase tracking-tight truncate" style={{ color: primaryColor }}>
                            {schoolName}
                        </div>
                        <div className="text-[8px] text-gray-500 truncate">{schoolSubtext}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center my-1.5">
                    <PassportPhoto
                        className="w-[74px] h-[94px] rounded-lg"
                        borderStyle={{ border: `2px solid ${accentColor}` }}
                    />
                    <h3 className="text-sm font-black mt-1.5 text-center line-clamp-1" style={{ color: primaryColor }}>
                        {studentName}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-600 mt-0.5">Class {grade}</span>
                </div>

                <div
                    className="rounded-xl px-2.5 py-2"
                    style={{ backgroundColor: `${primaryColor}0D` }}
                >
                    {renderFieldRows(true)}
                </div>

                {renderSignaturesRow(primaryColor, primaryColor, "pt-2")}
            </div>
        );
    }

    /* ==================== NEW VERTICAL 4: ARC RIBBON MULTI ==================== */
    if (template === "v4") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div className="relative pt-3 pb-10 px-3 text-center text-white overflow-hidden" style={{ backgroundColor: primaryColor }}>
                    <div
                        className="w-36 h-36 rounded-full absolute -left-14 -bottom-24 opacity-90 pointer-events-none"
                        style={{ border: `8px solid ${accentColor}` }}
                    />
                    <div
                        className="w-36 h-36 rounded-full absolute -right-14 -bottom-24 opacity-90 pointer-events-none"
                        style={{ border: `8px solid ${waveColor}` }}
                    />
                    <div className="relative z-10 flex items-center justify-center gap-1.5">
                        <SchoolLogoBadge sizeClass="w-5 h-5 text-[8px]" ringColor={accentColor} />
                        <span className="text-[11px] font-black uppercase tracking-wide truncate">{schoolName}</span>
                    </div>
                    <div
                        className="relative z-10 mt-1 inline-block bg-white/95 px-2 py-0.5 rounded-full text-[7.5px] font-bold truncate max-w-[210px]"
                        style={{ color: primaryColor }}
                    >
                        {schoolSubtext}
                    </div>
                </div>

                <div className="-mt-8 px-3 flex items-center justify-between relative z-10">
                    <div
                        className="py-2 px-1 rounded-full text-white text-[7.5px] font-extrabold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180 shadow-xs"
                        style={{ backgroundColor: waveColor }}
                    >
                        CLASS {grade}
                    </div>
                    <PassportPhoto
                        className="w-[74px] h-[94px] rounded-xl shadow-md"
                        borderStyle={{ border: `3px solid ${accentColor}` }}
                    />
                    <div
                        className="py-1.5 px-1 rounded-full text-white text-[7px] font-extrabold uppercase [writing-mode:vertical-rl] shadow-xs"
                        style={{ backgroundColor: accentColor }}
                    >
                        {session || "26-27"}
                    </div>
                </div>

                <div className="text-center px-3 mt-1">
                    <h3 className="text-sm font-black tracking-tight truncate" style={{ color: primaryColor }}>
                        {studentName}
                    </h3>
                    <div className="h-0.5 w-14 mx-auto mt-0.5 rounded-full" style={{ backgroundColor: accentColor }} />
                </div>

                {/* Fitted Info Box — sized to content with clean spacing */}
                <div
                    className="mx-3 my-1.5 px-3 py-2 rounded-xl border"
                    style={{
                        backgroundColor: `${waveColor}14`,
                        borderColor: `${waveColor}30`
                    }}
                >
                    {renderFieldRows(true)}
                </div>

                <div className="relative px-3 pb-3.5 pt-1">
                    {renderSignaturesRow(primaryColor, waveColor)}
                    <div className="absolute bottom-0 left-0 right-0 h-2 flex">
                        <div className="w-1/2 h-full" style={{ backgroundColor: accentColor }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                </div>
            </div>
        );
    }

    /* ==================== NEW VERTICAL 5: CRIMSON WAVE TAG ==================== */
    if (template === "v5") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div className="pt-3 pb-10 px-3 text-center text-white relative" style={{ backgroundColor: primaryColor }}>
                    <div className="flex items-center justify-center gap-1.5">
                        <SchoolLogoBadge sizeClass="w-5 h-5 text-[8px]" ringColor="#FFFFFF" />
                        <div className="text-[11px] font-black uppercase tracking-tight leading-none truncate">
                            {schoolName}
                        </div>
                    </div>
                    <div className="text-[8px] font-semibold uppercase tracking-wider opacity-90 mt-1 truncate">
                        {schoolSubtext}
                    </div>
                    <div className="h-1.5 w-full absolute bottom-0 left-0" style={{ backgroundColor: accentColor }} />
                </div>

                <div className="-mt-9 flex justify-center items-center gap-2 relative z-10 px-3">
                    <span
                        className="px-2 py-0.5 rounded-r-full text-[8px] font-black text-white shadow-xs"
                        style={{ backgroundColor: waveColor }}
                    >
                        {session || "2026-27"}
                    </span>
                    <PassportPhoto
                        className="w-[74px] h-[94px] rounded-xl shadow-md"
                        borderStyle={{ border: `3px solid ${primaryColor}` }}
                    />
                    <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: accentColor }} />
                </div>

                <div className="text-center px-3 mt-1">
                    <h3 className="text-sm font-black uppercase leading-tight truncate" style={{ color: primaryColor }}>
                        {studentName}
                    </h3>
                    <span
                        className="inline-block text-[9.5px] font-extrabold px-2.5 py-0.5 rounded text-white mt-0.5"
                        style={{ backgroundColor: waveColor }}
                    >
                        Class {grade}
                    </span>
                </div>

                <div
                    className="mx-3 my-1.5 px-3 py-2 rounded-xl border"
                    style={{ backgroundColor: `${waveColor}0C`, borderColor: `${primaryColor}25` }}
                >
                    {renderFieldRows(true)}
                </div>

                {renderSignaturesRow(primaryColor, waveColor, "px-3.5 pb-2.5 pt-1")}
            </div>
        );
    }

    /* ==================== NEW VERTICAL 6: DUO-ARC CREST ==================== */
    if (template === "v6") {
        return (
            <div
                className="id-card-item w-[245px] min-h-[385px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div
                    className="p-3 text-white flex items-center justify-between gap-2"
                    style={{ background: `linear-gradient(135deg, ${primaryColor} 65%, ${waveColor} 65%)` }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                        <div className="min-w-0">
                            <div className="text-[10.5px] font-black uppercase truncate">{schoolName}</div>
                            <div className="text-[7.5px] opacity-85 truncate">{schoolSubtext}</div>
                        </div>
                    </div>
                </div>

                <div className="px-3.5 pt-2 flex items-center gap-3">
                    <PassportPhoto
                        className="w-[74px] h-[94px] rounded-xl shadow-sm"
                        borderStyle={{ border: `2.5px solid ${accentColor}` }}
                    />
                    <div className="min-w-0 flex-1">
                        <span
                            className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: accentColor }}
                        >
                            {session || "2026-27"}
                        </span>
                        <h3 className="text-sm font-black leading-tight mt-1 line-clamp-2" style={{ color: primaryColor }}>
                            {studentName}
                        </h3>
                        <p className="text-[9.5px] font-bold mt-1" style={{ color: waveColor }}>
                            Class: {grade}
                        </p>
                    </div>
                </div>

                <div className="px-3.5 py-1.5">
                    {renderFieldRows(true)}
                </div>

                {renderSignaturesRow(primaryColor, waveColor, "px-3.5 pb-1.5 pt-1")}

                <div
                    className="px-4 py-1.5 text-white flex items-center justify-between text-[7.5px] font-extrabold uppercase"
                    style={{ background: `linear-gradient(90deg, ${waveColor}, ${primaryColor})` }}
                >
                    <span>Student Identity</span>
                    <span style={{ color: accentColor }}>Session {session || "2026-27"}</span>
                </div>
            </div>
        );
    }

    /* ==================== ORIGINAL HORIZONTAL 1: EXECUTIVE SIDE ==================== */
    if (template === "h1") {
        return (
            <div
                className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex"
                style={{ backgroundColor: cardBgColor }}
            >
                <div
                    className="w-[120px] p-2.5 flex flex-col items-center justify-between text-white text-center shrink-0"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="text-[8.5px] font-bold uppercase tracking-wider opacity-90">
                        {session || "2026-27"}
                    </div>

                    <PassportPhoto
                        className="w-[68px] h-[86px] rounded-lg shadow-md"
                        borderStyle={{ border: `2.5px solid ${accentColor}` }}
                    />

                    <div
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                        style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                    >
                        Class {grade}
                    </div>
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-2 border-b pb-1" style={{ borderColor: `${primaryColor}20` }}>
                        <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                        <div className="min-w-0">
                            <div className="text-[11px] font-black uppercase truncate" style={{ color: primaryColor }}>
                                {schoolName}
                            </div>
                            <div className="text-[7.5px] text-gray-500 truncate">{schoolSubtext}</div>
                        </div>
                    </div>

                    <div className="my-1">
                        <h3 className="text-sm font-black uppercase truncate mb-1" style={{ color: primaryColor }}>
                            {studentName}
                        </h3>
                        {renderFieldRows(false)}
                    </div>

                    {renderSignaturesRow(primaryColor, primaryColor, "pt-1")}
                </div>
            </div>
        );
    }

    /* ==================== ORIGINAL HORIZONTAL 2: BANNER DUAL-TONE ==================== */
    if (template === "h2") {
        return (
            <div
                className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between"
                style={{ backgroundColor: cardBgColor }}
            >
                <div
                    className="px-3.5 py-2 text-white flex items-center justify-between gap-2"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                        <div className="min-w-0">
                            <div className="text-[11px] font-black uppercase tracking-tight truncate">{schoolName}</div>
                            <div className="text-[7.5px] opacity-85 truncate">{schoolSubtext}</div>
                        </div>
                    </div>
                    <span
                        className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0"
                        style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                    >
                        {session || "2026-27"}
                    </span>
                </div>

                <div className="px-3.5 py-1.5 flex items-center gap-3">
                    <PassportPhoto
                        className="w-[70px] h-[90px] rounded-lg shadow-xs"
                        borderStyle={{ border: `2px solid ${accentColor}` }}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-black uppercase truncate" style={{ color: primaryColor }}>
                                {studentName}
                            </h3>
                            <span
                                className="text-[8.5px] font-extrabold px-2 py-0.5 rounded shrink-0"
                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            >
                                Class: {grade}
                            </span>
                        </div>
                        {renderFieldRows(false)}
                    </div>
                </div>

                {renderSignaturesRow(primaryColor, primaryColor, "px-3.5 pb-1")}

                <div
                    className="h-3.5 px-4 flex items-center justify-between text-[7px] font-extrabold text-white uppercase tracking-wider"
                    style={{ backgroundColor: accentColor }}
                >
                    <span>Official Student Pass</span>
                    <span>Session {session || "2026-27"}</span>
                </div>
            </div>
        );
    }

    /* ==================== ORIGINAL HORIZONTAL 3: SLEEK BADGE ==================== */
    if (template === "h3") {
        return (
            <div
                className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md overflow-hidden flex flex-col justify-between p-3 relative"
                style={{ backgroundColor: cardBgColor, border: `2px solid ${primaryColor}` }}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                        <div className="min-w-0">
                            <div className="text-[11px] font-black uppercase truncate" style={{ color: primaryColor }}>
                                {schoolName}
                            </div>
                            <div className="text-[7.5px] text-gray-500 truncate">{schoolSubtext}</div>
                        </div>
                    </div>
                    <span
                        className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-lg text-white shrink-0"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Class {grade}
                    </span>
                </div>

                <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 uppercase truncate mb-1">
                            {studentName}
                        </h3>
                        {renderFieldRows(false)}
                    </div>

                    <PassportPhoto
                        className="w-[70px] h-[90px] rounded-xl shadow-xs"
                        borderStyle={{ border: `2.5px solid ${primaryColor}` }}
                    />
                </div>

                <div
                    className="rounded-lg px-2.5 py-1 flex items-end justify-between"
                    style={{ backgroundColor: `${primaryColor}10` }}
                >
                    {showTeacherSign ? (
                        <SignatureBlock label="Teacher Sign" signUrl={teacherSignUrl} align="left" textColor={primaryColor} />
                    ) : (
                        <div />
                    )}
                    <span className="text-[7.5px] font-bold self-center" style={{ color: primaryColor }}>
                        {session || "2026-27"}
                    </span>
                    {showPrincipalSign ? (
                        <SignatureBlock label="Principal Sign" signUrl={principalSignUrl} align="right" textColor={primaryColor} />
                    ) : (
                        <div />
                    )}
                </div>
            </div>
        );
    }

    /* ==================== NEW HORIZONTAL 4: WAVE FLOW CARD ==================== */
    if (template === "h4") {
        return (
            <div
                className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div className="h-4 w-full flex overflow-hidden shrink-0">
                    <div className="w-2/3 h-full rounded-br-full" style={{ backgroundColor: waveColor }} />
                    <div className="w-1/2 h-full -ml-6 rounded-bl-full" style={{ backgroundColor: primaryColor }} />
                </div>

                <div className="px-3.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <SchoolLogoBadge sizeClass="w-5 h-5 text-[7.5px]" ringColor={primaryColor} />
                        <span className="text-[10px] font-extrabold uppercase truncate" style={{ color: primaryColor }}>
                            {schoolName}
                        </span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 shrink-0">{session || "2026-27"}</span>
                </div>

                <div className="px-3.5 flex items-center gap-3 py-1">
                    <PassportPhoto
                        className="w-[70px] h-[90px] rounded-xl shadow-xs"
                        borderStyle={{ border: `2.5px solid ${primaryColor}` }}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-sm font-black truncate" style={{ color: primaryColor }}>
                                {studentName}
                            </h3>
                            <span className="text-[8.5px] font-extrabold shrink-0" style={{ color: waveColor }}>
                                Class {grade}
                            </span>
                        </div>
                        {renderFieldRows(false)}
                    </div>
                </div>

                {renderSignaturesRow(primaryColor, waveColor, "px-3.5 pb-1")}

                <div className="h-3.5 w-full flex overflow-hidden shrink-0">
                    <div className="w-1/2 h-full rounded-tr-full" style={{ backgroundColor: waveColor }} />
                    <div className="w-1/4 h-full -ml-3" style={{ backgroundColor: accentColor }} />
                    <div className="w-1/3 h-full rounded-tl-full" style={{ backgroundColor: primaryColor }} />
                </div>
            </div>
        );
    }

    /* ==================== NEW HORIZONTAL 5: HORIZON RIBBON ==================== */
    if (template === "h5") {
        return (
            <div
                className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex relative"
                style={{ backgroundColor: cardBgColor }}
            >
                <div className="w-3 flex flex-col shrink-0">
                    <div className="h-1/2 w-full" style={{ backgroundColor: primaryColor }} />
                    <div className="h-1/4 w-full" style={{ backgroundColor: accentColor }} />
                    <div className="h-1/4 w-full" style={{ backgroundColor: waveColor }} />
                </div>

                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={waveColor} />
                            <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase truncate" style={{ color: primaryColor }}>
                                    {schoolName}
                                </div>
                                <div className="text-[7.5px] text-gray-500 truncate">{schoolSubtext}</div>
                            </div>
                        </div>
                        <span
                            className="px-2 py-0.5 rounded-full text-[8px] font-extrabold text-white shrink-0"
                            style={{ backgroundColor: waveColor }}
                        >
                            Class {grade}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 my-1">
                        <PassportPhoto
                            className="w-[70px] h-[90px] rounded-xl shadow-xs"
                            borderStyle={{ border: `2px solid ${accentColor}` }}
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black truncate mb-1" style={{ color: primaryColor }}>
                                {studentName}
                            </h3>
                            {renderFieldRows(false)}
                        </div>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                        {showTeacherSign ? (
                            <SignatureBlock label="Teacher Sign" signUrl={teacherSignUrl} align="left" textColor={primaryColor} />
                        ) : (
                            <div />
                        )}
                        <span className="text-[7.5px] font-extrabold self-center" style={{ color: waveColor }}>
                            {session || "2026-27"}
                        </span>
                        {showPrincipalSign ? (
                            <SignatureBlock label="Principal Sign" signUrl={principalSignUrl} align="right" textColor={primaryColor} />
                        ) : (
                            <div />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ==================== NEW HORIZONTAL 6: PRISM SPLIT BANNER ==================== */
    return (
        <div
            className="id-card-item w-[375px] min-h-[235px] rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between"
            style={{ backgroundColor: cardBgColor }}
        >
            <div
                className="px-3.5 py-2 text-white flex items-center justify-between gap-2"
                style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${waveColor} 100%)` }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <SchoolLogoBadge sizeClass="w-6 h-6 text-[8px]" ringColor={accentColor} />
                    <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase truncate">{schoolName}</div>
                        <div className="text-[7.5px] opacity-90 truncate">{schoolSubtext}</div>
                    </div>
                </div>
                <span
                    className="px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase shrink-0"
                    style={{ backgroundColor: accentColor, color: "#111827" }}
                >
                    Class {grade}
                </span>
            </div>

            <div className="px-3.5 py-1.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black uppercase truncate mb-1" style={{ color: primaryColor }}>
                        {studentName}
                    </h3>
                    <div
                        className="rounded-xl px-2.5 py-1.5 border"
                        style={{ backgroundColor: `${waveColor}12`, borderColor: `${waveColor}28` }}
                    >
                        {renderFieldRows(false)}
                    </div>
                </div>

                <PassportPhoto
                    className="w-[70px] h-[90px] rounded-xl shadow-xs"
                    borderStyle={{ border: `2.5px solid ${accentColor}` }}
                />
            </div>

            {renderSignaturesRow(primaryColor, waveColor, "px-3.5 pb-1")}

            <div
                className="px-4 py-1 flex items-center justify-between text-[7.5px] font-extrabold text-white"
                style={{ backgroundColor: primaryColor }}
            >
                <span>SESSION: {session || "2026-27"}</span>
                <span style={{ color: accentColor }}>STUDENT IDENTITY CARD</span>
            </div>
        </div>
    );
}