'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Copy,
  FileSpreadsheet,
  FileText,
  Printer,
  Home,
  Layers,
  BedDouble
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

export default function HostelManagementPage() {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'hostels' | 'roomTypes'
  const [activeSession, setActiveSession] = useState('2026-27');
  const [loading, setLoading] = useState(true);

  // ── 1. Hostel Rooms State ──
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomHostel, setRoomHostel] = useState('Boys Hostel 101');
  const [roomType, setRoomType] = useState('One Bed');
  const [numberOfBed, setNumberOfBed] = useState('1');
  const [costPerBed, setCostPerBed] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [editingRoomId, setEditingRoomId] = useState(null);

  // ── 2. Hostels State ──
  const [hostels, setHostels] = useState([]);
  const [hostelSearch, setHostelSearch] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [hostelType, setHostelType] = useState('Boys');
  const [hostelAddress, setHostelAddress] = useState('');
  const [hostelIntake, setHostelIntake] = useState('');
  const [hostelDescription, setHostelDescription] = useState('');
  const [editingHostelId, setEditingHostelId] = useState(null);

  // ── 3. Room Types State ──
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeSearch, setRoomTypeSearch] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [editingTypeId, setEditingTypeId] = useState(null);

  const printRef = useRef(null);

  // ── Fetch Active Session and Data from Firestore ──
  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'config', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        
        let currentActiveSession = '2026-27';
        if (settingsSnap.exists() && settingsSnap.data().activeSession) {
          currentActiveSession = settingsSnap.data().activeSession;
        }
        setActiveSession(currentActiveSession);

        // Fetch Hotels (sessions > {activeSession} > hotels)
        const hotelsRef = collection(db, 'sessions', currentActiveSession, 'hotels');
        const hotelsSnap = await getDocs(hotelsRef);
        setHostels(hotelsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Room Types (sessions > {activeSession} > roomTypes)
        const roomTypesRef = collection(db, 'sessions', currentActiveSession, 'roomTypes');
        const roomTypesSnap = await getDocs(roomTypesRef);
        setRoomTypes(roomTypesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Hostel Rooms (sessions > {activeSession} > hostelRooms)
        const roomsRef = collection(db, 'sessions', currentActiveSession, 'hostelRooms');
        const roomsSnap = await getDocs(roomsRef);
        setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (err) {
        console.error('Error fetching hostel management data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Filtered lists
  const filteredRooms = rooms.filter(r => 
    String(r.roomNumber || '').toLowerCase().includes(roomSearch.toLowerCase()) ||
    String(r.hostel || '').toLowerCase().includes(roomSearch.toLowerCase()) ||
    String(r.roomType || '').toLowerCase().includes(roomSearch.toLowerCase())
  );

  const filteredHostels = hostels.filter(h => 
    String(h.hostelName || '').toLowerCase().includes(hostelSearch.toLowerCase()) ||
    String(h.type || '').toLowerCase().includes(hostelSearch.toLowerCase())
  );

  const filteredRoomTypes = roomTypes.filter(t => 
    String(t.typeName || '').toLowerCase().includes(roomTypeSearch.toLowerCase())
  );

  // ── EXPORT & UTILITY FUNCTIONS ──
  const handleCopyTable = (data, type) => {
    let text = '';
    if (type === 'rooms') {
      text = data.map(r => `${r.roomNumber}\t${r.hostel}\t${r.roomType}\t${r.numberOfBed}\t₹${r.costPerBed}\t${r.description || ''}`).join('\n');
    } else if (type === 'hostels') {
      text = data.map(h => `${h.hostelName}\t${h.type}\t${h.address || ''}\t${h.intake || '0'}\t${h.description || ''}`).join('\n');
    } else {
      text = data.map(t => `${t.typeName}\t${t.description || ''}`).join('\n');
    }
    navigator.clipboard.writeText(text);
    alert('Table data copied to clipboard!');
  };

  const handleExportCSV = (data, type) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (type === 'rooms') {
      headers = ['Room Number / Name', 'Hostel', 'Room Type', 'Number Of Bed', 'Cost Per Bed', 'Description'];
      rows = data.map(r => [`"${r.roomNumber}"`, `"${r.hostel}"`, `"${r.roomType}"`, r.numberOfBed, r.costPerBed, `"${r.description || ''}"`]);
      filename = `hostel_rooms_${activeSession}.csv`;
    } else if (type === 'hostels') {
      headers = ['Hostel Name', 'Type', 'Address', 'Intake', 'Description'];
      rows = data.map(h => [`"${h.hostelName}"`, `"${h.type}"`, `"${h.address || ''}"`, h.intake || '0', `"${h.description || ''}"`]);
      filename = `hostel_list_${activeSession}.csv`;
    } else {
      headers = ['Room Type', 'Description'];
      rows = data.map(t => [`"${t.typeName}"`, `"${t.description || ''}"`]);
      filename = `room_types_${activeSession}.csv`;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (title, headers, rowsHtml) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for PDF / Print export');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${activeSession}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; color: #4f46e5; margin-bottom: 5px; }
            p { text-align: center; color: #666; font-size: 12px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>Active Academic Session: ${activeSession}</p>
          <div style="text-align: right; margin-bottom: 10px;" class="no-print">
            <button onclick="window.print()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ── HANDLERS: Hostel Rooms ──
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomNumber.trim()) { alert('Please enter Room Number / Name'); return; }

    const payload = {
      roomNumber: roomNumber.trim(),
      hostel: roomHostel,
      roomType,
      numberOfBed,
      costPerBed: costPerBed || '0.00',
      description: roomDescription.trim()
    };

    try {
      if (editingRoomId) {
        const docRef = doc(db, 'sessions', activeSession, 'hostelRooms', editingRoomId);
        await updateDoc(docRef, payload);
        setRooms(rooms.map(r => r.id === editingRoomId ? { id: editingRoomId, ...payload } : r));
        setEditingRoomId(null);
        alert('Hostel Room updated successfully!');
      } else {
        const colRef = collection(db, 'sessions', activeSession, 'hostelRooms');
        const docRef = await addDoc(colRef, payload);
        setRooms([{ id: docRef.id, ...payload }, ...rooms]);
        alert('Hostel Room added successfully!');
      }
      setRoomNumber('');
      setCostPerBed('');
      setRoomDescription('');
    } catch (err) {
      console.error('Error saving room:', err);
      alert('Failed to save room.');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setRoomNumber(room.roomNumber);
    setRoomHostel(room.hostel || 'Boys Hostel 101');
    setRoomType(room.roomType || 'One Bed');
    setNumberOfBed(room.numberOfBed || '1');
    setCostPerBed(room.costPerBed || '');
    setRoomDescription(room.description || '');
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await deleteDoc(doc(db, 'sessions', activeSession, 'hostelRooms', id));
      setRooms(rooms.filter(r => r.id !== id));
      if (editingRoomId === id) setEditingRoomId(null);
    } catch (err) {
      console.error('Error deleting room:', err);
    }
  };

  // ── HANDLERS: Hostels ──
  const handleSaveHostel = async (e) => {
    e.preventDefault();
    if (!hostelName.trim()) { alert('Please enter Hostel Name'); return; }

    const payload = {
      hostelName: hostelName.trim(),
      type: hostelType,
      address: hostelAddress.trim(),
      intake: hostelIntake || '0',
      description: hostelDescription.trim()
    };

    try {
      if (editingHostelId) {
        const docRef = doc(db, 'sessions', activeSession, 'hotels', editingHostelId);
        await updateDoc(docRef, payload);
        setHostels(hostels.map(h => h.id === editingHostelId ? { id: editingHostelId, ...payload } : h));
        setEditingHostelId(null);
        alert('Hostel updated successfully!');
      } else {
        const colRef = collection(db, 'sessions', activeSession, 'hotels');
        const docRef = await addDoc(colRef, payload);
        setHostels([{ id: docRef.id, ...payload }, ...hostels]);
        alert('Hostel added successfully!');
      }
      setHostelName('');
      setHostelAddress('');
      setHostelIntake('');
      setHostelDescription('');
    } catch (err) {
      console.error('Error saving hostel:', err);
      alert('Failed to save hostel.');
    }
  };

  const handleEditHostel = (h) => {
    setEditingHostelId(h.id);
    setHostelName(h.hostelName);
    setHostelType(h.type || 'Boys');
    setHostelAddress(h.address || '');
    setHostelIntake(h.intake || '');
    setHostelDescription(h.description || '');
  };

  const handleDeleteHostel = async (id) => {
    if (!window.confirm('Delete this hostel?')) return;
    try {
      await deleteDoc(doc(db, 'sessions', activeSession, 'hotels', id));
      setHostels(hostels.filter(h => h.id !== id));
      if (editingHostelId === id) setEditingHostelId(null);
    } catch (err) {
      console.error('Error deleting hostel:', err);
    }
  };

  // ── HANDLERS: Room Types ──
  const handleSaveRoomType = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) { alert('Please enter Room Type'); return; }

    const payload = {
      typeName: typeName.trim(),
      description: typeDescription.trim()
    };

    try {
      if (editingTypeId) {
        const docRef = doc(db, 'sessions', activeSession, 'roomTypes', editingTypeId);
        await updateDoc(docRef, payload);
        setRoomTypes(roomTypes.map(t => t.id === editingTypeId ? { id: editingTypeId, ...payload } : t));
        setEditingTypeId(null);
        alert('Room Type updated successfully!');
      } else {
        const colRef = collection(db, 'sessions', activeSession, 'roomTypes');
        const docRef = await addDoc(colRef, payload);
        setRoomTypes([{ id: docRef.id, ...payload }, ...roomTypes]);
        alert('Room Type added successfully!');
      }
      setTypeName('');
      setTypeDescription('');
    } catch (err) {
      console.error('Error saving room type:', err);
      alert('Failed to save room type.');
    }
  };

  const handleEditRoomType = (t) => {
    setEditingTypeId(t.id);
    setTypeName(t.typeName || '');
    setTypeDescription(t.description || '');
  };

  const handleDeleteRoomType = async (id) => {
    if (!window.confirm('Delete this room type?')) return;
    try {
      await deleteDoc(doc(db, 'sessions', activeSession, 'roomTypes', id));
      setRoomTypes(roomTypes.filter(t => t.id !== id));
      if (editingTypeId === id) setEditingTypeId(null);
    } catch (err) {
      console.error('Error deleting room type:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans" ref={printRef}>

      {/* Header & Sub-Navigation Tabs */}
      <header className="flex flex-col bg-white border-b border-slate-200 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Hostel Management</h1>
              <p className="text-xs text-slate-500">Active Academic Session: <span className="font-semibold text-indigo-600">{activeSession}</span></p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 space-x-6 border-t border-slate-100 bg-slate-50/50 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`py-3 flex items-center space-x-2 border-b-2 cursor-pointer transition-colors ${activeTab === 'rooms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Hostel Rooms</span>
          </button>
          <button
            onClick={() => setActiveTab('hostels')}
            className={`py-3 flex items-center space-x-2 border-b-2 cursor-pointer transition-colors ${activeTab === 'hostels' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Home className="w-4 h-4" />
            <span>Hostel List</span>
          </button>
          <button
            onClick={() => setActiveTab('roomTypes')}
            className={`py-3 flex items-center space-x-2 border-b-2 cursor-pointer transition-colors ${activeTab === 'roomTypes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Layers className="w-4 h-4" />
            <span>Room Type</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-6 lg:p-8">
        
        {/* ================= TAB 1: HOSTEL ROOMS ================= */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="font-bold text-base text-slate-900">
                  {editingRoomId ? 'Edit Hostel Room' : 'Add Hostel Room'}
                </h2>
                {editingRoomId && (
                  <button 
                    onClick={() => { setEditingRoomId(null); setRoomNumber(''); setCostPerBed(''); setRoomDescription(''); }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRoom} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Number / Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. B5"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hostel *</label>
                  <select
                    value={roomHostel}
                    onChange={(e) => setRoomHostel(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {hostels.length > 0 ? (
                      hostels.map(h => <option key={h.id} value={h.hostelName}>{h.hostelName}</option>)
                    ) : (
                      <>
                        <option value="Boys Hostel 101">Boys Hostel 101</option>
                        <option value="Boys Hostel 102">Boys Hostel 102</option>
                        <option value="Girls Hostel 103">Girls Hostel 103</option>
                        <option value="Girls Hostel 104">Girls Hostel 104</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Type *</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {roomTypes.length > 0 ? (
                      roomTypes.map(t => <option key={t.id} value={t.typeName}>{t.typeName}</option>)
                    ) : (
                      <>
                        <option value="One Bed">One Bed</option>
                        <option value="Two Bed">Two Bed</option>
                        <option value="One Bed AC">One Bed AC</option>
                        <option value="Two Bed AC">Two Bed AC</option>
                        <option value="Dormitory">Dormitory</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Number Of Bed *</label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfBed}
                    onChange={(e) => setNumberOfBed(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Per Bed (₹) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 3000.00"
                    value={costPerBed}
                    onChange={(e) => setCostPerBed(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Optional room notes..."
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingRoomId ? 'Update Room' : 'Save Room'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Table Column */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Room, Hostel..."
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Export & Print Toolbar */}
                <div className="flex items-center space-x-2 text-slate-600 self-end sm:self-auto">
                  <button onClick={() => handleCopyTable(filteredRooms, 'rooms')} title="Copy Table" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => handleExportCSV(filteredRooms, 'rooms')} title="Export CSV" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
                  <button onClick={() => handleExportPDF('Hostel Room List', ['Room Number / Name', 'Hostel', 'Room Type', 'Number Of Bed', 'Cost Per Bed', 'Description'], filteredRooms.map(r => `<tr><td><b>${r.roomNumber}</b></td><td>${r.hostel}</td><td>${r.roomType}</td><td>${r.numberOfBed}</td><td>₹${r.costPerBed}</td><td>${r.description || '-'}</td></tr>`).join(''))} title="PDF Export & Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
                  <button onClick={() => handleExportPDF('Hostel Room List', ['Room Number / Name', 'Hostel', 'Room Type', 'Number Of Bed', 'Cost Per Bed', 'Description'], filteredRooms.map(r => `<tr><td><b>${r.roomNumber}</b></td><td>${r.hostel}</td><td>${r.roomType}</td><td>${r.numberOfBed}</td><td>₹${r.costPerBed}</td><td>${r.description || '-'}</td></tr>`).join(''))} title="Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Printer className="w-4 h-4 text-indigo-600" /></button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Hostel Room List</h3>
                  <span className="text-xs text-slate-400">Total entries: {filteredRooms.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50">
                        <th className="py-3.5 px-4">Room Number / Name</th>
                        <th className="py-3.5 px-4">Hostel</th>
                        <th className="py-3.5 px-4">Room Type</th>
                        <th className="py-3.5 px-4">Number Of Bed</th>
                        <th className="py-3.5 px-4">Cost Per Bed</th>
                        <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loading ? (
                        <tr><td colSpan="6" className="py-12 text-center text-slate-400">Loading hostel rooms...</td></tr>
                      ) : filteredRooms.length === 0 ? (
                        <tr><td colSpan="6" className="py-12 text-center text-slate-400">No rooms found.</td></tr>
                      ) : (
                        filteredRooms.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{r.roomNumber}</td>
                            <td className="py-3.5 px-4 text-slate-700">{r.hostel}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px]">{r.roomType}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{r.numberOfBed}</td>
                            <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">₹{r.costPerBed}</td>
                            <td className="py-3.5 px-4 text-right print:hidden flex items-center justify-end space-x-1.5">
                              <button onClick={() => handleEditRoom(r)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteRoom(r.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: HOSTELS LIST ================= */}
        {activeTab === 'hostels' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="font-bold text-base text-slate-900">
                  {editingHostelId ? 'Edit Hostel' : 'Add Hostel'}
                </h2>
                {editingHostelId && (
                  <button 
                    onClick={() => { setEditingHostelId(null); setHostelName(''); setHostelAddress(''); setHostelIntake(''); setHostelDescription(''); }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveHostel} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hostel Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Boys Hostel 101"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={hostelType}
                    onChange={(e) => setHostelType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Combined">Combined</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. School Campus"
                    value={hostelAddress}
                    onChange={(e) => setHostelAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intake</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 200"
                    value={hostelIntake}
                    onChange={(e) => setHostelIntake(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Optional notes..."
                    value={hostelDescription}
                    onChange={(e) => setHostelDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingHostelId ? 'Update Hostel' : 'Save'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Table Column */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Hostel Name..."
                    value={hostelSearch}
                    onChange={(e) => setHostelSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Export & Print Toolbar */}
                <div className="flex items-center space-x-2 text-slate-600 self-end sm:self-auto">
                  <button onClick={() => handleCopyTable(filteredHostels, 'hostels')} title="Copy Table" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => handleExportCSV(filteredHostels, 'hostels')} title="Export CSV" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
                  <button onClick={() => handleExportPDF('Hostel List', ['Hostel Name', 'Type', 'Address', 'Intake', 'Description'], filteredHostels.map(h => `<tr><td><b>${h.hostelName}</b></td><td>${h.type}</td><td>${h.address || '-'}</td><td>${h.intake || '0'}</td><td>${h.description || '-'}</td></tr>`).join(''))} title="PDF Export & Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
                  <button onClick={() => handleExportPDF('Hostel List', ['Hostel Name', 'Type', 'Address', 'Intake', 'Description'], filteredHostels.map(h => `<tr><td><b>${h.hostelName}</b></td><td>${h.type}</td><td>${h.address || '-'}</td><td>${h.intake || '0'}</td><td>${h.description || '-'}</td></tr>`).join(''))} title="Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Printer className="w-4 h-4 text-indigo-600" /></button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Hostel List</h3>
                  <span className="text-xs text-slate-400">Total entries: {filteredHostels.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50">
                        <th className="py-3.5 px-4">Hostel Name</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Address</th>
                        <th className="py-3.5 px-4">Intake</th>
                        <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loading ? (
                        <tr><td colSpan="5" className="py-12 text-center text-slate-400">Loading hostels...</td></tr>
                      ) : filteredHostels.length === 0 ? (
                        <tr><td colSpan="5" className="py-12 text-center text-slate-400">No hostels found.</td></tr>
                      ) : (
                        filteredHostels.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{h.hostelName}</td>
                            <td className="py-3.5 px-4 text-slate-700">{h.type}</td>
                            <td className="py-3.5 px-4 text-slate-600">{h.address || '-'}</td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{h.intake || '0'}</td>
                            <td className="py-3.5 px-4 text-right print:hidden flex items-center justify-end space-x-1.5">
                              <button onClick={() => handleEditHostel(h)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteHostel(h.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: ROOM TYPES ================= */}
        {activeTab === 'roomTypes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="font-bold text-base text-slate-900">
                  {editingTypeId ? 'Edit Room Type' : 'Add Room Type'}
                </h2>
                {editingTypeId && (
                  <button 
                    onClick={() => { setEditingTypeId(null); setTypeName(''); setTypeDescription(''); }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRoomType} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Type *</label>
                  <input
                    type="text"
                    placeholder="e.g. One Bed"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Optional description..."
                    value={typeDescription}
                    onChange={(e) => setTypeDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingTypeId ? 'Update Room Type' : 'Save'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Table Column */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Room Type..."
                    value={roomTypeSearch}
                    onChange={(e) => setRoomTypeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Export & Print Toolbar */}
                <div className="flex items-center space-x-2 text-slate-600 self-end sm:self-auto">
                  <button onClick={() => handleCopyTable(filteredRoomTypes, 'roomTypes')} title="Copy Table" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => handleExportCSV(filteredRoomTypes, 'roomTypes')} title="Export CSV" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
                  <button onClick={() => handleExportPDF('Room Type List', ['Room Type', 'Description'], filteredRoomTypes.map(t => `<tr><td><b>${t.typeName}</b></td><td>${t.description || '-'}</td></tr>`).join(''))} title="PDF Export & Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
                  <button onClick={() => handleExportPDF('Room Type List', ['Room Type', 'Description'], filteredRoomTypes.map(t => `<tr><td><b>${t.typeName}</b></td><td>${t.description || '-'}</td></tr>`).join(''))} title="Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Printer className="w-4 h-4 text-indigo-600" /></button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Room Type List</h3>
                  <span className="text-xs text-slate-400">Total entries: {filteredRoomTypes.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50">
                        <th className="py-3.5 px-4">Room Type</th>
                        <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loading ? (
                        <tr><td colSpan="2" className="py-12 text-center text-slate-400">Loading room types...</td></tr>
                      ) : filteredRoomTypes.length === 0 ? (
                        <tr><td colSpan="2" className="py-12 text-center text-slate-400">No room types found.</td></tr>
                      ) : (
                        filteredRoomTypes.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{t.typeName}</td>
                            <td className="py-3.5 px-4 text-right print:hidden flex items-center justify-end space-x-1.5">
                              <button onClick={() => handleEditRoomType(t)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteRoomType(t.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}