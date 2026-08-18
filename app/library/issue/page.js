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
  Filter
} from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

export default function LibraryMemberIssuePage() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'issue'
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
        // 1. Get activeSession from config > settings
        const settingsRef = doc(db, 'config', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        
        let currentActiveSession = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          currentActiveSession = settingsSnap.data().activeSession;
        }
        setActiveSession(currentActiveSession);

        // 2. Fetch real students from sessions > {activeSession} > students
        const studentsCollectionRef = collection(db, 'sessions', currentActiveSession, 'students');
        const studentSnapshot = await getDocs(studentsCollectionRef);
        
        const studentData = studentSnapshot.docs.map((docSnap, index) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            // Strictly fetch real data fields from student document with clean fallbacks only if unassigned
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
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Library Members Directory</h2>
          <p>Active Academic Session: ${activeSession}</p>
          <div style="text-align: right; margin-bottom: 10px;" class="no-print">
            <button onclick="window.print()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
          </div>
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

  // ── Issue Book Submit (Saves to Firestore issuedBooks map array) ──
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
  const handleReturnBook = async (issuedId) => {
    const updatedIssuedBooks = (selectedMember.issuedBooks || []).map(item => {
      if (item.id === issuedId) {
        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        return { ...item, returnDate: today };
      }
      return item;
    });

    try {
      const studentDocRef = doc(db, 'sessions', activeSession, 'students', selectedMember.id);
      await updateDoc(studentDocRef, {
        issuedBooks: updatedIssuedBooks
      });

      const updatedMember = { ...selectedMember, issuedBooks: updatedIssuedBooks };
      setSelectedMember(updatedMember);
      setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
      alert('Book marked as returned!');
    } catch (err) {
      console.error('Error returning book:', err);
      alert('Failed to update return date.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans" ref={printRef}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {viewMode === 'list' ? 'Library Members' : 'Book Issue & Return Hub'}
            </h1>
            <p className="text-xs text-slate-500">Active Academic Session: <span className="font-semibold text-indigo-600">{activeSession}</span></p>
          </div>
        </div>

        {viewMode === 'issue' && (
          <button 
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Members List</span>
          </button>
        )}
      </header>

      {/* ── SCREEN 1: MEMBERS LIST TABLE ── */}
      {viewMode === 'list' && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8 flex flex-col gap-5">
          
          {/* Search, Class Filter & Export Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search By Name, Admission No, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Class Filter */}
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {Array.from(new Set(members.map(m => m.className))).filter(c => c && c !== 'N/A').map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-2 text-slate-600 self-end md:self-auto">
              <button onClick={handleCopyTable} title="Copy" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Copy className="w-4 h-4" /></button>
              <button onClick={handleExportCSV} title="Excel / CSV" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
              <button onClick={handleExportPDF} title="PDF Export & Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
              <button onClick={handlePrint} title="Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Printer className="w-4 h-4 text-indigo-600" /></button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="py-3.5 px-4">Member ID</th>
                    <th className="py-3.5 px-4">Library Card No.</th>
                    <th className="py-3.5 px-4">Admission No</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Member Type</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">Fetching real student records from session {activeSession}...</td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">No real student records found in Firestore for session {activeSession}.</td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{m.memberId}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">{m.libraryCardNo}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{m.admissionNo}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{m.className}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                            {m.memberType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{m.phone}</td>
                        <td className="py-3.5 px-4 text-right print:hidden">
                          <button
                            onClick={() => handleOpenIssueScreen(m)}
                            title="Issue Book"
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
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

      {/* ── SCREEN 2: ISSUE & RETURN DETAIL PAGE ── */}
      {viewMode === 'issue' && selectedMember && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Member Profile Card */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center h-fit">
            <div className="w-28 h-28 rounded-2xl bg-indigo-100 overflow-hidden mb-4 border-2 border-indigo-200 shadow-sm flex items-center justify-center">
              {selectedMember.avatar ? (
                <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-12 h-12 text-indigo-400" />
              )}
            </div>
            
            <h2 className="text-lg font-bold text-slate-900">{selectedMember.name}</h2>
            <div className="w-full mt-6 divide-y divide-slate-100 text-xs text-left">
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Member ID</span><span className="font-mono font-semibold text-slate-800">{selectedMember.memberId}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Library Card No.</span><span className="font-mono font-semibold text-indigo-600">{selectedMember.libraryCardNo}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Admission No</span><span className="font-mono font-semibold text-slate-800">{selectedMember.admissionNo}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Class</span><span className="font-semibold text-slate-800">{selectedMember.className}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Gender</span><span className="text-slate-800">{selectedMember.gender}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Member Type</span><span className="text-indigo-700 font-semibold">{selectedMember.memberType}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Mobile Number</span><span className="text-slate-800">{selectedMember.phone}</span></div>
              <div className="flex justify-between py-2.5"><span className="text-slate-500 font-medium">Session Year</span><span className="text-slate-800">{activeSession}</span></div>
            </div>

            <div className="w-full mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
              <div className="font-mono tracking-widest text-slate-700 text-sm font-bold">||||| |||| |||||</div>
              <span className="text-[10px] text-slate-400 font-mono">{selectedMember.libraryCardNo}</span>
            </div>
          </div>

          {/* Right Column: Issue Book Form & Book Issued History Table from Map/Array */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Issue Book Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 mb-4 pb-2 border-b border-slate-100">Issue Book</h3>
              <form onSubmit={handleIssueBookSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Books *</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Book</option>
                    {availableBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title} (No: {b.bookNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Return Date *</label>
                  <input
                    type="text"
                    value={dueReturnDate}
                    onChange={(e) => setDueReturnDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end mt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Issue</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Book Issued History Table (Mapped from student's real issuedBooks array map) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Book Issued History (Student Map)</h3>
                <span className="text-xs text-slate-400">Total issued: {(selectedMember.issuedBooks || []).length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Book Number</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Return Date</th>
                      <th className="py-3 px-4">Return Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(!selectedMember.issuedBooks || selectedMember.issuedBooks.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">No books currently issued to this student.</td>
                      </tr>
                    ) : (
                      selectedMember.issuedBooks.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.bookTitle}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{item.bookNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{item.issueDate}</td>
                          <td className="py-3 px-4 text-slate-600">{item.dueReturnDate}</td>
                          <td className="py-3 px-4">
                            {item.returnDate ? (
                              <span className="text-emerald-600 font-semibold">{item.returnDate}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Not Returned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!item.returnDate ? (
                              <button
                                onClick={() => handleReturnBook(item.id)}
                                title="Return Book"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Return</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Completed</span>
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