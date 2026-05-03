'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { HiOutlineMail, HiOutlinePhone, HiOutlineTrash, HiOutlineChatAlt } from 'react-icons/hi';

export default function EnquiryPage() {
    const [enquiries, setEnquiries] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEnquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const updateStatus = async (id, status) => {
        await updateDoc(doc(db, 'enquiries', id), { status });
    };

    const deleteEnquiry = async (id) => {
        if (confirm("Delete this enquiry?")) await deleteDoc(doc(db, 'enquiries', id));
    };

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 italic uppercase">General <span className="text-blue-600">Enquiries</span></h1>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-xs uppercase">Total: {enquiries.length}</div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="p-4">Student & Parent</th>
                            <th className="p-4">Grade Seeking</th>
                            <th className="p-4">Contact Detail</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {enquiries.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{item.studentName}</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Parent: {item.parentName}</div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-[10px] font-black uppercase">{item.gradeSeeking}</span>
                                </td>
                                <td className="p-4 space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><HiOutlinePhone className="text-blue-500" /> {item.phone}</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><HiOutlineMail className="text-blue-500" /> {item.email}</div>
                                </td>
                                <td className="p-4">
                                    <select 
                                        value={item.status || 'pending'} 
                                        onChange={(e) => updateStatus(item.id, e.target.value)}
                                        className="text-[10px] font-black uppercase border rounded p-1 bg-white outline-none ring-blue-500 focus:ring-1"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="called">Called</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => deleteEnquiry(item.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                                        <HiOutlineTrash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}