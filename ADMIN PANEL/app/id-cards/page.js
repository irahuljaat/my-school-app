"use client";

import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { HiOutlineIdentification, HiOutlineDownload, HiOutlineSparkles } from "react-icons/hi";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export default function IdCardsExportPage() {
    const [activeSession, setActiveSession] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("ALL");

    useEffect(() => {
        const fetchSettingsAndStudents = async () => {
            try {
                const settingsSnap = await getDoc(doc(db, "config", "settings"));
                if (settingsSnap.exists()) {
                    const session = settingsSnap.data().activeSession;
                    setActiveSession(session);

                    const studentsSnap = await getDocs(collection(db, "sessions", session, "students"));
                    const studentDocs = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
                    const active = studentDocs.filter(s => s.grade !== "PASSED OUT");

                    const uniqueClasses = Array.from(new Set(active.map(s => String(s.grade || "Unassigned").trim()))).sort();
                    setClasses(uniqueClasses);
                }
            } catch (err) {
                console.error("Error loading session config:", err);
            }
        };
        fetchSettingsAndStudents();
    }, []);

    // Helper to convert Base64 Data URL or standard URL into an ArrayBuffer for JSZip
    const convertImageToBuffer = async (urlOrDataUri) => {
        if (!urlOrDataUri || typeof urlOrDataUri !== "string") {
            return null;
        }

        // Handle Base64 Data URLs (e.g., data:image/jpeg;base64,...)
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

        // Fallback for standard http/https URLs if any exist
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

            // Sort structurally: Class-wise first, then Alphabetically by Student Name (A-Z)
            students.sort((a, b) => {
                const gradeA = String(a.grade || "").trim();
                const gradeB = String(b.grade || "").trim();
                if (gradeA !== gradeB) {
                    return gradeA.localeCompare(gradeB, undefined, { numeric: true, sensitivity: 'base' });
                }
                const nameA = String(a.name || "").trim();
                const nameB = String(b.name || "").trim();
                return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
            });

            setStatusText("Processing student records and bundling profile images...");

            const zip = new JSZip();
            const imagesFolder = zip.folder("profile_images");

            const excelRows = [];
            const usedImageNames = new Set();
            let imagesAddedCount = 0;

            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                setStatusText(`Processing student ${i + 1} of ${students.length}: ${student.name || 'Unnamed'}`);

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
                        imagesAddedCount++;
                    }
                }

                excelRows.push({
                    "Class": student.grade || "N/A",
                    "Student Name": student.name || "N/A",
                    "Father's Name": student.fatherName || student.fathersName || "N/A",
                    "Date of Birth (DOB)": student.dob || "N/A",
                    "Address": student.address || "N/A",
                    "Contact No": student.contact || student.phone || student.mobile || "N/A",
                    "Profile Photo Filename": imageFilename || "No Image"
                });
            }

            console.log(`Successfully packed ${imagesAddedCount} images out of ${students.length} students.`);

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

    return (
        <div className="min-h-screen bg-[#F4F6F8] p-6 lg:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-yellow-400 text-gray-900 rounded-2xl shadow-sm">
                                <HiOutlineIdentification size={28} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ID Cards Data & Assets Export</h1>
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Download a structured ZIP bundle containing an alphabetical class-wise Excel sheet and uniquely named profile photo assets.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Class Scope</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none"
                            >
                                <option value="ALL">All Classes (Complete School)</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end pt-4 md:pt-0">
                            <button
                                onClick={handleExport}
                                disabled={loading || !activeSession}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                <HiOutlineDownload size={20} />
                                {loading ? "Processing Export..." : "Download ZIP Package"}
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="p-6 bg-yellow-50/60 rounded-2xl border border-yellow-200 flex items-center gap-4 text-yellow-800 animate-pulse">
                            <HiOutlineSparkles size={24} className="flex-shrink-0 animate-spin" />
                            <div className="text-sm font-bold">{statusText}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}