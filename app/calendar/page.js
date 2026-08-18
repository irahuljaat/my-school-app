'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
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
  Upload,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function AnnualCalendarPage() {
  const [activeSession, setActiveSession] = useState('2026-27');
  const [loading, setLoading] = useState(true);

  // ── Calendar Events State ──
  const [events, setEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Holiday');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const fileInputRef = useRef(null);

  // Helper to format ISO date (YYYY-MM-DD) to DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    // If already in DD-MM-YYYY or not standard yyyy-mm-dd format
    if (!dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to format DD-MM-YYYY back to YYYY-MM-DD for HTML date inputs if needed
  const formatDateToYYYYMMDD = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

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

        // Fetch Events (sessions > {activeSession} > events)
        const eventsRef = collection(db, 'sessions', currentActiveSession, 'events');
        const eventsSnap = await getDocs(eventsRef);
        setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (err) {
        console.error('Error fetching calendar events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Filtered list
  const filteredEvents = events.filter(e => 
    String(e.title || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
    String(e.eventType || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
    String(e.date || '').toLowerCase().includes(eventSearch.toLowerCase())
  );

  // ── Cloudinary Upload Helper ──
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'school_preset');

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
    return data.secure_url;
  };

  // ── EXPORT & UTILITY FUNCTIONS ──
  const handleCopyTable = (data) => {
    const text = data.map(e => `${e.title}\t${e.eventType || 'Holiday'}\t${e.date}${e.endDate ? ` to ${e.endDate}` : ''}\t${e.img || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table data copied to clipboard!');
  };

  const handleExportCSV = (data) => {
    const headers = ['Title', 'Type', 'Date', 'End Date', 'Image URL'];
    const rows = data.map(e => [
      `"${e.title}"`, 
      `"${e.eventType || 'Holiday'}"`, 
      `"${e.date}"`, 
      `"${e.endDate || ''}"`, 
      `"${e.img || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `events_${activeSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (titleText, headers, rowsHtml) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for PDF / Print export');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleText} - ${activeSession}</title>
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
          <h2>${titleText}</h2>
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

  // ── HANDLERS: Event Save ──
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) { 
      alert('Please fill in Event Title and Date'); 
      return; 
    }

    try {
      setUploadingImage(true);
      let imageUrl = imagePreview;

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const formattedDate = formatDateToDDMMYYYY(date);
      const formattedEndDate = endDate ? formatDateToDDMMYYYY(endDate) : formattedDate;

      const payload = {
        title: title.trim(),
        eventType,
        date: formattedDate,
        endDate: formattedEndDate,
        img: imageUrl || 'https://example.com/image.jpg',
        timestamp: serverTimestamp()
      };

      if (editingEventId) {
        const docRef = doc(db, 'sessions', activeSession, 'events', editingEventId);
        await updateDoc(docRef, payload);
        setEvents(events.map(ev => ev.id === editingEventId ? { id: editingEventId, ...payload, timestamp: new Date() } : ev));
        setEditingEventId(null);
        alert('Event updated successfully!');
      } else {
        const colRef = collection(db, 'sessions', activeSession, 'events');
        const docRef = await addDoc(colRef, payload);
        setEvents([{ id: docRef.id, ...payload, timestamp: new Date() }, ...events]);
        alert('Event added successfully!');
      }

      // Reset form
      setTitle('');
      setDate('');
      setEndDate('');
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || '');
    setEventType(ev.eventType || 'Holiday');
    setDate(formatDateToYYYYMMDD(ev.date) || '');
    setEndDate(formatDateToYYYYMMDD(ev.endDate) || '');
    setImagePreview(ev.img || '');
    setImageFile(null);
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'sessions', activeSession, 'events', id));
      setEvents(events.filter(ev => ev.id !== id));
      if (editingEventId === id) setEditingEventId(null);
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'Holiday': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Vacation': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Exams': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'School Event': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Activity': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* Header */}
      <header className="flex flex-col bg-white border-b border-slate-200 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Annual Calendar Events</h1>
              <p className="text-xs text-slate-500">Active Academic Session: <span className="font-semibold text-indigo-600">{activeSession}</span> (sessions &gt; {activeSession} &gt; events)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900">
                {editingEventId ? 'Edit Event' : 'Add Event'}
              </h2>
              {editingEventId && (
                <button 
                  onClick={() => { setEditingEventId(null); setTitle(''); setDate(''); setEndDate(''); setImagePreview(''); setImageFile(null); }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Final Exams 2026 / Diwali Vacations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type *</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="Holiday">Holiday</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Activity">Activity</option>
                  <option value="Event">Event</option>
                  <option value="School Event">School Event</option>
                  <option value="Exams">Exams</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date (DD-MM-YYYY) *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Image Upload for Cloudinary */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Banner / Image</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Choose Image</span>
                  </button>
                  {imagePreview && (
                    <span className="text-xs text-emerald-600 font-medium truncate max-w-[150px]">Image selected</span>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{uploadingImage ? 'Uploading & Saving...' : editingEventId ? 'Update Event' : 'Save Event'}</span>
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
                  placeholder="Search Title, Type..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Export & Print Toolbar */}
              <div className="flex items-center space-x-2 text-slate-600 self-end sm:self-auto">
                <button onClick={() => handleCopyTable(filteredEvents)} title="Copy Table" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Copy className="w-4 h-4" /></button>
                <button onClick={() => handleExportCSV(filteredEvents)} title="Export CSV" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /></button>
                <button onClick={() => handleExportPDF('Annual Events List', ['Title', 'Type', 'Date', 'Image'], filteredEvents.map(e => `<tr><td><b>${e.title}</b></td><td>${e.eventType || 'Holiday'}</td><td>${e.date}</td><td><a href="${e.img}" target="_blank">View Image</a></td></tr>`).join(''))} title="PDF Export & Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><FileText className="w-4 h-4 text-rose-600" /></button>
                <button onClick={() => handleExportPDF('Annual Events List', ['Title', 'Type', 'Date', 'Image'], filteredEvents.map(e => `<tr><td><b>${e.title}</b></td><td>${e.eventType || 'Holiday'}</td><td>${e.date}</td><td><a href="${e.img}" target="_blank">View Image</a></td></tr>`).join(''))} title="Print" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"><Printer className="w-4 h-4 text-indigo-600" /></button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Events Collection (sessions &gt; {activeSession} &gt; events)</h3>
                <span className="text-xs text-slate-400">Total entries: {filteredEvents.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50">
                      <th className="py-3.5 px-4">Image</th>
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr><td colSpan="5" className="py-12 text-center text-slate-400">Loading events...</td></tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr><td colSpan="5" className="py-12 text-center text-slate-400">No events found in Firestore.</td></tr>
                    ) : (
                      filteredEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            {ev.img ? (
                              <img src={ev.img} alt={ev.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><ImageIcon className="w-4 h-4" /></div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{ev.title}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${getTypeBadgeColor(ev.eventType || 'Holiday')}`}>
                              {ev.eventType || 'Holiday'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {ev.date}
                            {ev.endDate && ev.endDate !== ev.date && <span className="text-slate-400"> → {ev.endDate}</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right print:hidden flex items-center justify-end space-x-1.5">
                            <button onClick={() => handleEditEvent(ev)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
      </main>

    </div>
  );
}