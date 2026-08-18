'use client';

import React, { useState } from 'react';
import { 
  Library, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Copy,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';

export default function LibraryCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([
    {
      id: '1',
      bookTitle: 'संसार पुस्तक है।',
      description: 'No Description',
      bookNumber: '878',
      isbnNumber: '546',
      publisher: '',
      author: '',
      subject: 'Hindi',
      rackNumber: '987',
      qty: 20,
      available: 20,
      bookPrice: '$100.00',
      postDate: '04/30/2026'
    },
    {
      id: '2',
      bookTitle: 'Maths Activity Book Class 1',
      description: 'Maths Activity Book Class 1',
      bookNumber: '765',
      isbnNumber: '87786',
      publisher: 'Yogesh',
      author: 'Hunny',
      subject: 'Maths',
      rackNumber: '23',
      qty: 0,
      available: 0,
      bookPrice: '$299.00',
      postDate: '04/08/2026'
    },
    {
      id: '3',
      bookTitle: 'English Grammar for Beginners',
      description: 'No Description',
      bookNumber: '4376',
      isbnNumber: '563',
      publisher: 's. r. k',
      author: 'jhon',
      subject: '',
      rackNumber: '2',
      qty: 100,
      available: 100,
      bookPrice: '$100.00',
      postDate: '04/03/2026'
    },
    {
      id: '4',
      bookTitle: 'Respiration in Organisms',
      description: 'No Description',
      bookNumber: '123',
      isbnNumber: 'BRT0-890907',
      publisher: 'S.K Publisher',
      author: 'John Wilson',
      subject: '',
      rackNumber: '',
      qty: 50,
      available: 50,
      bookPrice: '$100.00',
      postDate: '04/01/2026'
    },
    {
      id: '5',
      bookTitle: 'Maths Activity Book Class 1',
      description: 'No Description',
      bookNumber: '65563',
      isbnNumber: 'B002',
      publisher: 'NCERT',
      author: 'S. Verma',
      subject: 'Mathematics',
      rackNumber: '234',
      qty: 50,
      available: 49,
      bookPrice: '$100.00',
      postDate: '03/14/2026'
    }
  ]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [formData, setFormData] = useState({
    bookTitle: '',
    description: '',
    bookNumber: '',
    isbnNumber: '',
    publisher: '',
    author: '',
    subject: '',
    rackNumber: '',
    qty: 10,
    available: 10,
    bookPrice: '$100.00'
  });

  // Filter books based on search input
  const filteredBooks = books.filter((b) => 
    b.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.isbnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookNumber.includes(searchQuery)
  );

  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setFormData({
      bookTitle: '',
      description: 'No Description',
      bookNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      isbnNumber: '',
      publisher: '',
      author: '',
      subject: '',
      rackNumber: '',
      qty: 10,
      available: 10,
      bookPrice: '$100.00'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBookId(book.id);
    setFormData({ ...book });
    setIsModalOpen(true);
  };

  const handleDeleteBook = (id) => {
    if (confirm('Are you sure you want to delete this book from the catalog?')) {
      setBooks(books.filter((b) => b.id !== id));
    }
  };

  const handleSaveBook = (e) => {
    e.preventDefault();
    if (!formData.bookTitle.trim()) {
      alert('Please enter a Book Title');
      return;
    }

    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    if (editingBookId) {
      setBooks(books.map((b) => b.id === editingBookId ? { ...formData } : b));
    } else {
      const newBook = {
        ...formData,
        id: Date.now().toString(),
        postDate: today
      };
      setBooks([newBook, ...books]);
    }
    setIsModalOpen(false);
  };

  // ─── EXPORT & UTILITY HANDLERS ───

  // 1. Copy Table Data to Clipboard
  const handleCopyTable = () => {
    const headers = ['Book Title', 'Description', 'Book Number', 'ISBN Number', 'Publisher', 'Author', 'Subject', 'Rack Number', 'Qty', 'Available', 'Book Price', 'Post Date'];
    const rows = filteredBooks.map(b => [
      b.bookTitle, b.description, b.bookNumber, b.isbnNumber, b.publisher, b.author, b.subject, b.rackNumber, b.qty, b.available, b.bookPrice, b.postDate
    ]);
    const textContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    
    navigator.clipboard.writeText(textContent).then(() => {
      alert('Table data copied to clipboard successfully!');
    }).catch(err => {
      alert('Failed to copy table data.');
    });
  };

  // 2. Export CSV / Excel format
  const handleExportCSV = () => {
    const headers = ['Book Title', 'Description', 'Book Number', 'ISBN Number', 'Publisher', 'Author', 'Subject', 'Rack Number', 'Qty', 'Available', 'Book Price', 'Post Date'];
    const rows = filteredBooks.map(b => [
      `"${b.bookTitle}"`,
      `"${b.description}"`,
      `"${b.bookNumber}"`,
      `"${b.isbnNumber}"`,
      `"${b.publisher}"`,
      `"${b.author}"`,
      `"${b.subject}"`,
      `"${b.rackNumber}"`,
      b.qty,
      b.available,
      `"${b.bookPrice}"`,
      `"${b.postDate}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_book_list_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export PDF / Printable Document format
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Library Book List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>Library Book Catalog & Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Description</th>
                <th>Book No</th>
                <th>ISBN</th>
                <th>Publisher</th>
                <th>Author</th>
                <th>Subject</th>
                <th>Rack</th>
                <th>Qty</th>
                <th>Avail</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBooks.map(b => `
                <tr>
                  <td><b>${b.bookTitle}</b></td>
                  <td>${b.description || ''}</td>
                  <td>${b.bookNumber}</td>
                  <td>${b.isbnNumber || ''}</td>
                  <td>${b.publisher || ''}</td>
                  <td>${b.author || ''}</td>
                  <td>${b.subject || ''}</td>
                  <td>${b.rackNumber || ''}</td>
                  <td>${b.qty}</td>
                  <td>${b.available}</td>
                  <td>${b.bookPrice}</td>
                  <td>${b.postDate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // 4. Print Table View
  const handlePrintTable = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <Library className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Book List &amp; Inventory</h1>
            <p className="text-xs text-slate-500">Manage cataloging records, ISBNs, quantities, and rack numbers</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8 flex flex-col gap-5">

        {/* ── Search & Fully Functional Export Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search By Book Title, Author, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center space-x-2 text-slate-600">
            <button 
              onClick={handleCopyTable}
              title="Copy Table" 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportCSV}
              title="Export Excel / CSV" 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>
            <button 
              onClick={handleExportPDF}
              title="Export / View PDF Document" 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600" />
            </button>
            <button 
              onClick={handlePrintTable}
              title="Print Table" 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
            </button>
          </div>

        </div>

        {/* ── Book List Table ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Book Number</th>
                  <th className="py-3.5 px-4">ISBN Number</th>
                  <th className="py-3.5 px-4">Publisher</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Rack Number</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Available</th>
                  <th className="py-3.5 px-4">Book Price</th>
                  <th className="py-3.5 px-4">Post Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="py-12 text-center text-slate-400">
                      No matching books found in database.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{book.bookTitle}</td>
                      <td className="py-3.5 px-4 text-slate-500">{book.description || 'No Description'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{book.bookNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{book.isbnNumber || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-700">{book.publisher || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-700">{book.author || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{book.subject || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{book.rackNumber || '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{book.qty}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${
                          book.available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {book.available}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{book.bookPrice}</td>
                      <td className="py-3.5 px-4 text-slate-500">{book.postDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(book)}
                            title="Edit Book"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            title="Delete Book"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-base text-slate-900">
                {editingBookId ? 'Edit Book Record' : 'Add New Book to Catalog'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBook} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.bookTitle}
                  onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                  placeholder="e.g. Advanced Mathematics"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Number</label>
                <input
                  type="text"
                  value={formData.bookNumber}
                  onChange={(e) => setFormData({ ...formData, bookNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ISBN Number</label>
                <input
                  type="text"
                  value={formData.isbnNumber}
                  onChange={(e) => setFormData({ ...formData, isbnNumber: e.target.value })}
                  placeholder="e.g. 978-81-..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Publisher</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rack Number</label>
                <input
                  type="text"
                  value={formData.rackNumber}
                  onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Quantity</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 0, available: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Price ($)</label>
                <input
                  type="text"
                  value={formData.bookPrice}
                  onChange={(e) => setFormData({ ...formData, bookPrice: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end space-x-3 mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Book</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}