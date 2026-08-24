'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Copy,
  FileSpreadsheet,
  FileText,
  Printer,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { HiBookOpen, HiSearch, HiUsers, HiCollection } from 'react-icons/hi';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { useColors } from '../../components/ColorComponent';

export default function LibraryMemberIssuePage() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState('list'); // 'list', 'issue', or 'issuedBooks'
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  
  // Real Firestore Data States
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState('2026-27');

  // Issue Form States
  const [availableBooks, setAvailableBooks] = useState([
    { id: 'b1', title: 'Environmental science', bookNumber: '98057' },
    { id: 'b2', title: 'English Reader', bookNumber: '4344' },
    { id: 'b3', title: 'Mathematics', bookNumber: '9864' },
    { id: 'b4', title: 'Hindi Vyakaran', bookNumber: '3465' }
  ]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [dueReturnDate, setDueReturnDate] = useState('08/15/2026');

  const printRef = useRef(null);

  // Fetch Active Session and Real Student Data from Firestore
  useEffect(() => {
    async function fetchRealStudentsFromSession() {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'config', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        
        let currentActiveSession = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          currentActiveSession = settingsSnap.data().activeSession;
        }
        setActiveSession(currentActiveSession);

        const studentsCollectionRef = collection(db, 'sessions', currentActiveSession, 'students');
        const studentSnapshot = await getDocs(studentsCollectionRef);
        
        const studentData = studentSnapshot.docs.map((docSnap, index) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            memberId: data.memberId || data.rollNo || data.id || String(index + 1),
            libraryCardNo: data.libraryCardNo || data.libraryCard || `LIB-${data.admissionNo || index + 101}`,
            admissionNo: data.admissionNo || data.rollNo || data.scholarNo || 'N/A',
            name: data.name || data.studentName || data.fullName || 'Unknown Student',
            className: data.className || data.class || data.studentClass || 'N/A',
            memberType: data.memberType || 'Student',
            phone: data.phone || data.mobile || data.contactNumber || data.guardianPhone || 'N/A',
            gender: data.gender || data.sex || 'N/A',
            sessionYear: currentActiveSession,
            avatar: data.avatar || data.photoUrl || data.image || '',
            issuedBooks: data.issuedBooks || []
          };
        });

        setMembers(studentData);
      } catch (err) {
        console.error('Error fetching real session students:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealStudentsFromSession();
  }, []);

  // Filter members by search query and class filter
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.admissionNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.libraryCardNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.phone).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = selectedClassFilter ? m.className === selectedClassFilter : true;

    return matchesSearch && matchesClass;
  });

  const handleOpenIssueScreen = (member) => {
    setSelectedMember(member);
    setViewMode('issue');
  };

  // Aggregate all currently issued books across all students for the "Issued Books" view
  const allIssuedBooksList = members.flatMap(m => 
    (m.issuedBooks || []).map(b => ({
      ...b,
      studentName: m.name,
      admissionNo: m.admissionNo,
      className: m.className,
      libraryCardNo: m.libraryCardNo,
      studentId: m.id
    }))
  );

  // ── CSV Export ──
  const handleExportCSV = () => {
    const headers = ['Member ID', 'Library Card No', 'Admission No', 'Name', 'Class', 'Member Type', 'Phone'];
    const rows = filteredMembers.map(m => [
      m.memberId,
      m.libraryCardNo,
      m.admissionNo,
      `"${m.name}"`,
      m.className,
      m.memberType,
      m.phone
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_members_${activeSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Copy Table Data ──
  const handleCopyTable = () => {
    const text = filteredMembers.map(m => `${m.memberId}\t${m.libraryCardNo}\t${m.admissionNo}\t${m.name}\t${m.className}\t${m.memberType}\t${m.phone}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table data copied to clipboard!');
  };

  // ── PDF Export in New Tab with Print ──
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for PDF export');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Library Members Report - ${activeSession}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; color: #4f46e5; margin-bottom: 5px; }
            p { text-align: center; color: #666; font-size: 12px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Library Members Directory</h2>
          <p>Active Academic Session: ${activeSession}</p>
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Library Card No.</th>
                <th>Admission No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Member Type</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMembers.map(m => `
                <tr>
                  <td>${m.memberId}</td>
                  <td>${m.libraryCardNo}</td>
                  <td>${m.admissionNo}</td>
                  <td><b>${m.name}</b></td>
                  <td>${m.className}</td>
                  <td>${m.memberType}</td>
                  <td>${m.phone}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  // ── Issue Book Submit ──
  const handleIssueBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookId) {
      alert('Please select a book to issue.');
      return;
    }
    const bookObj = availableBooks.find(b => b.id === selectedBookId);
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    const newIssuedItem = {
      id: Date.now().toString(),
      bookTitle: bookObj ? bookObj.title : 'General Book',
      bookNumber: bookObj ? bookObj.bookNumber : '12345',
      issueDate: today,
      dueReturnDate: dueReturnDate,
      returnDate: null
    };

    try {
      const studentDocRef = doc(db, 'sessions', activeSession, 'students', selectedMember.id);
      await updateDoc(studentDocRef, {
        issuedBooks: arrayUnion(newIssuedItem)
      });

      const updatedIssuedBooks = [newIssuedItem, ...(selectedMember.issuedBooks || [])];
      const updatedMember = { ...selectedMember, issuedBooks: updatedIssuedBooks };
      setSelectedMember(updatedMember);
      setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
      setSelectedBookId('');
      alert('Book issued and recorded successfully in student profile!');
    } catch (err) {
      console.error('Error issuing book:', err);
      alert('Failed to issue book. Please check connection.');
    }
  };

  // ── Return Book Handler ──
  const handleReturnBook = async (studentId, issuedId) => {
    const targetMember = members.find(m => m.id === studentId) || selectedMember;
    if (!targetMember) return;

    const updatedIssuedBooks = (targetMember.issuedBooks || []).map(item => {
      if (item.id === issuedId) {
        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        return { ...item, returnDate: today };
      }
      return item;
    });

    try {
      const studentDocRef = doc(db, 'sessions', activeSession, 'students', targetMember.id);
      await updateDoc(studentDocRef, {
        issuedBooks: updatedIssuedBooks
      });

      const updatedMember = { ...targetMember, issuedBooks: updatedIssuedBooks };
      if (selectedMember && selectedMember.id === targetMember.id) {
        setSelectedMember(updatedMember);
      }
      setMembers(members.map(m => m.id === targetMember.id ? updatedMember : m));
      alert('Book marked as returned!');
    } catch (err) {
      console.error('Error returning book:', err);
      alert('Failed to update return date.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans relative overflow-hidden text-slate-800" style={{ backgroundColor: colors.background }} ref={printRef}>

      {/* Decorative Background Blur Elements */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none -mr-32 -mt-32"
        style={{ backgroundColor: colors.primary }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none -ml-32 -mb-32"
        style={{ backgroundColor: colors.primary }}
      />

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 lg:px-8 py-5 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs shrink-0 print:hidden z-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl shadow-xs" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
            <HiUsers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {viewMode === 'list' ? 'Library Members' : viewMode === 'issue' ? 'Book Issue & Return Hub' : 'All Issued Books Registry'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
              Active Academic Session: <span className="font-bold" style={{ color: colors.primary }}>{activeSession}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {viewMode === 'list' && (
            <button 
              onClick={() => setViewMode('issuedBooks')}
              className="flex items-center space-x-2 text-white font-bold px-6 py-3 rounded-full text-xs transition-all active:scale-[0.99] cursor-pointer shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Issued Books</span>
            </button>
          )}

          {viewMode !== 'list' && (
            <button 
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-full text-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Members List</span>
            </button>
          )}
        </div>
      </header>

      {/* ── SCREEN 1: MEMBERS LIST TABLE ── */}
      {viewMode === 'list' && (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8 flex flex-col gap-6 z-10">
          
          {/* Search, Class Filter & Export Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm print:hidden">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              {/* Search Box */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search By Name, Admission No, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': colors.primary }}
                />
              </div>

              {/* Class Filter */}
              <div className="relative w-full sm:w-56">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 transition-all cursor-pointer"
                  style={{ '--tw-ring-color': colors.primary }}
                >
                  <option value="">All Classes</option>
                  <option value="">Class 1</option>
                  <option value="">All Classes</option>
                  {Array.from(new Set(members.map(m => m.className))).filter(c => c && c !== 'N/A').map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-2 text-slate-600 self-end md:self-auto">
              <button onClick={handleCopyTable} title="Copy" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"><Copy className="w-4 h-4" /></button>
              <button onClick={handleExportCSV} title="Excel / CSV" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
              <button onClick={handleExportPDF} title="PDF Export & Print" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
              <button onClick={handlePrint} title="Print" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"><Printer className="w-4 h-4" style={{ color: colors.primary }} /></button>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/80">
                    <th className="py-4 px-6">Member ID</th>
                    <th className="py-4 px-6">Library Card No.</th>
                    <th className="py-4 px-6">Admission No</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6">Member Type</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400 font-medium">Fetching real student records from session {activeSession}...</td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400 font-medium">No real student records found in Firestore for session {activeSession}.</td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-semibold text-slate-700">{m.memberId}</td>
                        <td className="py-4 px-6 font-mono font-medium" style={{ color: colors.primary }}>{m.libraryCardNo}</td>
                        <td className="py-4 px-6 font-mono text-slate-600">{m.admissionNo}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{m.name}</td>
                        <td className="py-4 px-6 font-medium text-slate-600">{m.className}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                            {m.memberType}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{m.phone}</td>
                        <td className="py-4 px-6 text-right print:hidden">
                          <button
                            onClick={() => handleOpenIssueScreen(m)}
                            title="Issue Book"
                            className="p-3 text-white rounded-full transition-all active:scale-[0.99] cursor-pointer shadow-sm inline-flex items-center space-x-1"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <HiBookOpen className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}

      {/* ── SCREEN 2: ALL ISSUED BOOKS REGISTRY VIEW ── */}
      {viewMode === 'issuedBooks' && (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8 flex flex-col gap-6 z-10">
          <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Active & Past Book Issues Across Students</h3>
                <p className="text-xs text-slate-400 mt-0.5">Showing book name, assigned student details, issue date, and last receive due dates.</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                Total Records: {allIssuedBooksList.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/80">
                    <th className="py-4 px-6">Book Name</th>
                    <th className="py-4 px-6">Book Number</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6">Issue Date</th>
                    <th className="py-4 px-6">Last Receive Due Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {allIssuedBooksList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400 font-medium">No books have been issued to any student yet.</td>
                    </tr>
                  ) : (
                    allIssuedBooksList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{item.bookTitle}</td>
                        <td className="py-4 px-6 font-mono text-slate-600">{item.bookNumber}</td>
                        <td className="py-4 px-6 font-bold" style={{ color: colors.primary }}>{item.studentName}</td>
                        <td className="py-4 px-6 font-medium text-slate-600">{item.className}</td>
                        <td className="py-4 px-6 text-slate-600">{item.issueDate}</td>
                        <td className="py-4 px-6 font-semibold text-slate-700">{item.dueReturnDate}</td>
                        <td className="py-4 px-6">
                          {item.returnDate ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Returned ({item.returnDate})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-600 font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Not Returned</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {!item.returnDate ? (
                            <button
                              onClick={() => handleReturnBook(item.studentId, item.id)}
                              title="Return Book"
                              className="px-4 py-2 rounded-full font-bold transition-all active:scale-[0.99] cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                              style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="text-[10px] uppercase tracking-wider">Return</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ── SCREEN 3: ISSUE & RETURN DETAIL PAGE FOR A SINGLE STUDENT ── */}
      {viewMode === 'issue' && selectedMember && (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
          
          {/* Left Column: Member Profile Card */}
          <div className="lg:col-span-4 rounded-[28px] border border-slate-100 bg-white p-6 md:p-8 shadow-sm flex flex-col items-center text-center h-fit">
            <div className="w-28 h-28 rounded-2xl overflow-hidden mb-6 border-2 shadow-sm flex items-center justify-center" style={{ backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }}>
              {selectedMember.avatar ? (
                <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
              ) : (
                <HiUsers className="w-12 h-12" style={{ color: colors.primary }} />
              )}
            </div>
            
            <h2 className="text-lg font-bold text-slate-900">{selectedMember.name}</h2>
            <div className="w-full mt-6 divide-y divide-slate-100 text-xs text-left">
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Member ID</span><span className="font-mono font-semibold text-slate-800">{selectedMember.memberId}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Library Card No.</span><span className="font-mono font-semibold" style={{ color: colors.primary }}>{selectedMember.libraryCardNo}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Admission No</span><span className="font-mono font-semibold text-slate-800">{selectedMember.admissionNo}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Class</span><span className="font-semibold text-slate-800">{selectedMember.className}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Gender</span><span className="text-slate-800 font-medium">{selectedMember.gender}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Member Type</span><span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: colors.primary }}>{selectedMember.memberType}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Mobile Number</span><span className="text-slate-800 font-medium">{selectedMember.phone}</span></div>
              <div className="flex justify-between py-3"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Session Year</span><span className="text-slate-800 font-medium">{activeSession}</span></div>
            </div>

            <div className="w-full mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
              <div className="font-mono tracking-widest text-slate-700 text-sm font-bold">||||| |||| |||||</div>
              <span className="text-[10px] text-slate-400 font-mono">{selectedMember.libraryCardNo}</span>
            </div>
          </div>

          {/* Right Column: Issue Book Form & Book Issued History Table from Map/Array */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Issue Book Form Card */}
            <div className="rounded-[28px] border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 pb-3 border-b border-slate-100">Issue Book</h3>
              <form onSubmit={handleIssueBookSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Books *</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 transition-all cursor-pointer"
                    style={{ '--tw-ring-color': colors.primary }}
                    required
                  >
                    <option value="">Select Book</option>
                    {availableBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title} (No: {b.bookNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Due Return Date *</label>
                  <input
                    type="text"
                    value={dueReturnDate}
                    onChange={(e) => setDueReturnDate(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': colors.primary }}
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end mt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-8 py-3 text-white font-bold rounded-full text-xs transition-all active:scale-[0.99] shadow-sm cursor-pointer"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Issue</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Book Issued History Table */}
            <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Book Issued History (Student Map)</h3>
                <span className="text-xs font-bold text-slate-500">Total issued: {(selectedMember.issuedBooks || []).length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/80">
                      <th className="py-4 px-6">Book Title</th>
                      <th className="py-4 px-6">Book Number</th>
                      <th className="py-4 px-6">Issue Date</th>
                      <th className="py-4 px-6">Due Return Date</th>
                      <th className="py-4 px-6">Return Date</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(!selectedMember.issuedBooks || selectedMember.issuedBooks.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No books currently issued to this student.</td>
                      </tr>
                    ) : (
                      selectedMember.issuedBooks.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">{item.bookTitle}</td>
                          <td className="py-4 px-6 font-mono text-slate-600">{item.bookNumber}</td>
                          <td className="py-4 px-6 text-slate-600">{item.issueDate}</td>
                          <td className="py-4 px-6 text-slate-600">{item.dueReturnDate}</td>
                          <td className="py-4 px-6">
                            {item.returnDate ? (
                              <span className="text-emerald-600 font-bold">{item.returnDate}</span>
                            ) : (
                              <span className="text-amber-600 font-bold">Not Returned</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {!item.returnDate ? (
                              <button
                                onClick={() => handleReturnBook(selectedMember.id, item.id)}
                                title="Return Book"
                                className="px-4 py-2 rounded-full font-bold transition-all active:scale-[0.99] cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-wider">Return</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </main>
      )}

    </div>
  );
}