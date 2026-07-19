'use client';

import React, { useState, useEffect } from 'react';
import { 
    HiOutlineShieldCheck, 
    HiOutlineUser, 
    HiOutlineCheck,
    HiOutlineSave,
    HiOutlineCog
} from 'react-icons/hi';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Define available roles and features
const ROLES = [
    { id: 'admin', label: 'Administrator', desc: 'Full system access' },
    { id: 'hod', label: 'Head of Dept.', desc: 'Manage department & teachers' },
    { id: 'teacher', label: 'Class Teacher', desc: 'Standard class access' },
    { id: 'assistant', label: 'Assistant', desc: 'Limited view-only access' }
];

const FEATURES = [
    { id: 'can_edit_grades', label: 'Manage Grades' },
    { id: 'can_take_attendance', label: 'Take Attendance' },
    { id: 'can_view_payroll', label: 'View Payroll' },
    { id: 'can_manage_events', label: 'Manage Events' },
    { id: 'can_send_notices', label: 'Send Notices' }
];

export default function TeacherRoleManager() {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [currentRole, setCurrentRole] = useState('teacher');
    const [activeFeatures, setActiveFeatures] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch teachers list on component mount
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'teachers'));
                const teacherList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeachers(teacherList);
            } catch (error) {
                console.error("Error fetching teachers:", error);
            }
        };
        fetchTeachers();
    }, []);

    // Load selected teacher's current role and features
    useEffect(() => {
        if (selectedTeacherId) {
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            if (teacher) {
                setCurrentRole(teacher.role || 'teacher');
                setActiveFeatures(teacher.features || []);
            }
        } else {
            setCurrentRole('teacher');
            setActiveFeatures([]);
        }
    }, [selectedTeacherId, teachers]);

    const handleFeatureToggle = (featureId) => {
        setActiveFeatures(prev => 
            prev.includes(featureId)
                ? prev.filter(f => f !== featureId)
                : [...prev, featureId]
        );
    };

    const handleSavePermissions = async () => {
        if (!selectedTeacherId) return;
        
        setIsSaving(true);
        setMessage('');

        try {
            const teacherRef = doc(db, 'teachers', selectedTeacherId);
            await updateDoc(teacherRef, {
                role: currentRole,
                features: activeFeatures,
                updatedAt: new Date().toISOString()
            });
            
            setMessage('Permissions saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error updating permissions:", error);
            setMessage('Failed to save permissions.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F5FF] relative overflow-hidden p-4 lg:p-10 font-sans selection:bg-indigo-100">
            {/* Background Accents */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-purple-400/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <HiOutlineShieldCheck className="mb-0.5" /> <span>Access Control</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-800 tracking-tighter italic uppercase">
                        Role <span className="text-indigo-600">Manager</span>
                    </h1>
                </div>

                {/* Main Glass Container */}
                <div className="bg-white/40 backdrop-blur-[40px] rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/70 p-8 lg:p-12 relative overflow-hidden">
                    
                    {/* Select Teacher */}
                    <div className="mb-10">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            Select Staff Member
                        </label>
                        <select 
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full lg:w-1/2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">-- Choose a teacher --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name || 'Unnamed Teacher'}</option>
                            ))}
                        </select>
                    </div>

                    {selectedTeacherId && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in-up">
                            {/* Role Selection */}
                            <div>
                                <h3 className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
                                    <HiOutlineUser className="mr-2" /> Assign Primary Role
                                </h3>
                                <div className="space-y-3">
                                    {ROLES.map(role => (
                                        <div 
                                            key={role.id}
                                            onClick={() => setCurrentRole(role.id)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                currentRole === role.id 
                                                ? 'bg-indigo-50 border-indigo-500 shadow-md' 
                                                : 'bg-white/50 border-transparent hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800">{role.label}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
                                                </div>
                                                {currentRole === role.id && <HiOutlineCheck className="text-indigo-600 w-5 h-5" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features Toggle */}
                            <div>
                                <h3 className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
                                    <HiOutlineCog className="mr-2" /> Feature Access
                                </h3>
                                <div className="bg-white/50 rounded-3xl p-6 border border-white/80">
                                    {FEATURES.map(feature => (
                                        <label key={feature.id} className="flex items-center justify-between p-3 cursor-pointer group">
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                {feature.label}
                                            </span>
                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                                                activeFeatures.includes(feature.id) ? 'bg-indigo-500' : 'bg-slate-300'
                                            }`}>
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                                                    activeFeatures.includes(feature.id) ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                            </div>
                                            {/* Hidden checkbox for accessibility */}
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={activeFeatures.includes(feature.id)}
                                                onChange={() => handleFeatureToggle(feature.id)}
                                            />
                                        </label>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="mt-8 flex items-center justify-between">
                                    <span className={`text-xs font-bold ${message.includes('success') ? 'text-green-500' : 'text-rose-500'}`}>
                                        {message}
                                    </span>
                                    <button 
                                        onClick={handleSavePermissions}
                                        disabled={isSaving}
                                        className="flex items-center px-8 py-4 bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        <HiOutlineSave className="w-4 h-4 mr-2" />
                                        {isSaving ? 'Saving...' : 'Save Access'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}