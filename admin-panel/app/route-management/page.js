'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
    HiOutlineTruck, 
    HiOutlineSave,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineUser,
    HiOutlineIdentification,
    HiOutlineLocationMarker
} from 'react-icons/hi'; 

export default function DriverManagementPage() {
    const [hasMounted, setHasMounted] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Comprehensive Form State
    const initialFormState = {
        name: '',
        phone: '',
        emergencyPhone: '',
        bloodGroup: '',
        address: '',
        aadharNo: '',
        licenseNo: '',
        licenseExpiry: '',
        vehicleNo: '',
        vehicleType: 'Bus',
        capacity: '',
        routeName: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);
    const [stops, setStops] = useState([{ stopName: '', lat: '', lng: '' }]);

    // 1. Session listener
    useEffect(() => {
        setHasMounted(true);
        const unsub = onSnapshot(doc(db, 'config', 'settings'), (docSnap) => {
            if (docSnap.exists()) {
                setActiveSession(docSnap.data().activeSession);
            }
        });
        return () => unsub();
    }, []);

    // 2. Fetch Drivers
    const fetchDrivers = async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            const driversRef = collection(db, 'sessions', activeSession, 'drivers');
            const driverSnap = await getDocs(driversRef);
            const driverList = driverSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDrivers(driverList);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasMounted && activeSession) {
            fetchDrivers();
        }
    }, [activeSession, hasMounted]);

    // Input Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStop = () => setStops([...stops, { stopName: '', lat: '', lng: '' }]);
    
    const handleRemoveStop = (index) => setStops(stops.filter((_, i) => i !== index));
    
    const handleStopChange = (index, field, value) => {
        const newStops = [...stops];
        newStops[index][field] = value;
        setStops(newStops);
    };

    // 3. Save Driver
    const handleSaveDriver = async (e) => {
        e.preventDefault();
        if (!activeSession || isSaving) return;
        
        setIsSaving(true);
        try {
            const driverPayload = {
                ...formData,
                stops: stops.map(stop => ({
                    stopName: stop.stopName,
                    lat: parseFloat(stop.lat) || 0,
                    lng: parseFloat(stop.lng) || 0
                })),
                session: activeSession,
                createdAt: new Date().toISOString()
            };

            const driversRef = collection(db, 'sessions', activeSession, 'drivers');
            await addDoc(driversRef, driverPayload);
            
            setFormData(initialFormState);
            setStops([{ stopName: '', lat: '', lng: '' }]);
            
            alert("Driver added successfully!");
            fetchDrivers(); 
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to add driver.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDriver = async (id) => {
        if (!window.confirm("Are you sure you want to remove this driver and route?")) return;
        try {
            await deleteDoc(doc(db, 'sessions', activeSession, 'drivers', id));
            fetchDrivers();
        } catch (error) {
            console.error("Delete Error:", error);
        }
    };

    if (!hasMounted) return null;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 bg-white rounded-3xl mt-10 shadow-2xl border border-emerald-50 font-sans pb-32">
            {/* Minimal Sticky Top Bar */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-50 mb-8 pb-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
                            <HiOutlineTruck size={24} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-xl text-[#064E3B] tracking-tight">Driver & Route Management</h1>
                            <p className="text-xs text-emerald-600 font-medium">Manage transport personnel and map out stops.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-[#F0FDF4] px-4 py-2 rounded-2xl border border-emerald-100">
                         <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Session: {activeSession || 'Loading...'}</span>
                         <div className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Add Driver Form Container */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm">
                    <form onSubmit={handleSaveDriver} className="space-y-8">
                        
                        {/* Section 1: Personal Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-emerald-700">
                                <HiOutlineUser className="text-lg" />
                                <h3 className="font-bold text-[#064E3B] text-sm tracking-wide">Personal Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input required type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <input required type="tel" name="phone" placeholder="Primary Phone" value={formData.phone} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <input type="tel" name="emergencyPhone" placeholder="Emergency Contact" value={formData.emergencyPhone} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <input type="text" name="bloodGroup" placeholder="Blood Group (e.g., O+)" value={formData.bloodGroup} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <input type="text" name="address" placeholder="Residential Address" value={formData.address} onChange={handleInputChange}
                                    className="w-full md:col-span-2 px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                            </div>
                        </div>

                        <hr className="border-emerald-50" />

                        {/* Section 2: Documents */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-emerald-700">
                                <HiOutlineIdentification className="text-lg" />
                                <h3 className="font-bold text-[#064E3B] text-sm tracking-wide">Verification & Documents</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input required type="text" name="aadharNo" placeholder="Aadhar Card Number" value={formData.aadharNo} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <input required type="text" name="licenseNo" placeholder="Driving License Number" value={formData.licenseNo} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <div className="relative">
                                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">License Expiry</label>
                                    <input required type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-emerald-50" />

                        {/* Section 3: Vehicle Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-emerald-700">
                                <HiOutlineTruck className="text-lg" />
                                <h3 className="font-bold text-[#064E3B] text-sm tracking-wide">Vehicle Assignment</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input required type="text" name="vehicleNo" placeholder="Vehicle No (e.g. RJ-14-1234)" value={formData.vehicleNo} onChange={handleInputChange}
                                    className="w-full md:col-span-2 px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all">
                                    <option value="Bus">Bus</option>
                                    <option value="Van">Van / Minibus</option>
                                    <option value="Car">Car / SUV</option>
                                </select>
                                <input required type="number" name="capacity" placeholder="Seating Capacity" value={formData.capacity} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                            </div>
                        </div>

                        <hr className="border-emerald-50" />

                        {/* Section 4: Route & Stops */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <HiOutlineLocationMarker className="text-lg" />
                                    <h3 className="font-bold text-[#064E3B] text-sm tracking-wide">Route Map</h3>
                                </div>
                                <button type="button" onClick={handleAddStop} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm">
                                    <HiOutlinePlus /> ADD STOP
                                </button>
                            </div>

                            <input required type="text" name="routeName" placeholder="Route Name (e.g. Route A - Malviya Nagar)" value={formData.routeName} onChange={handleInputChange}
                                className="w-full mb-4 px-4 py-3 bg-[#F0FDF4]/50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                            
                            <div className="space-y-3">
                                {stops.map((stop, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-[#F0FDF4]/30 p-4 rounded-2xl border border-emerald-100">
                                        <div className="flex-1 w-full relative">
                                            <HiOutlineLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                                            <input required type="text" placeholder={`Stop ${index + 1} Name`} value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value)}
                                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                        </div>
                                        <input required type="number" step="any" placeholder="Latitude (e.g. 26.9124)" value={stop.lat} onChange={e => handleStopChange(index, 'lat', e.target.value)}
                                            className="w-full md:w-36 px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                        <input required type="number" step="any" placeholder="Longitude (e.g. 75.7873)" value={stop.lng} onChange={e => handleStopChange(index, 'lng', e.target.value)}
                                            className="w-full md:w-36 px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-[#064E3B] outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
                                        
                                        {stops.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveStop(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 bg-white">
                                                <HiOutlineTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button disabled={isSaving || !activeSession} type="submit" 
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                            {isSaving ? 'SAVING DATA...' : <><HiOutlineSave className="text-xl" /> SAVE DRIVER & ROUTE</>}
                        </button>
                    </form>
                </div>

                {/* Driver List */}
                <div className="space-y-4 pt-6">
                    <h3 className="font-extrabold text-[#064E3B] text-lg tracking-tight">Active Fleet ({drivers.length})</h3>
                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-[10px] font-bold text-emerald-700 tracking-[0.2em]">LOADING FLEET DATA</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {drivers.map(driver => (
                                <div key={driver.id} className="bg-white p-6 rounded-3xl border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-extrabold text-[#064E3B] text-base">{driver.name}</h4>
                                            <p className="text-xs font-bold text-emerald-600 mt-0.5">{driver.routeName || 'No Route Name'}</p>
                                        </div>
                                        <button onClick={() => handleDeleteDriver(driver.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50">
                                            <HiOutlineTrash className="text-lg" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-xs bg-[#F0FDF4]/30 p-4 rounded-2xl border border-emerald-50">
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Vehicle</span>
                                            <span className="font-bold text-[#064E3B] mt-0.5 block">{driver.vehicleNo} ({driver.vehicleType})</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Capacity</span>
                                            <span className="font-bold text-[#064E3B] mt-0.5 block">{driver.capacity} Seats</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Contact</span>
                                            <span className="font-bold text-[#064E3B] mt-0.5 block">{driver.phone}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">DL Expiry</span>
                                            <span className="font-bold text-[#064E3B] mt-0.5 block">{driver.licenseExpiry}</span>
                                        </div>
                                    </div>

                                    <div className="bg-[#F0FDF4] p-4 rounded-2xl border border-emerald-100">
                                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest mb-2.5 block">Stops ({driver.stops?.length || 0})</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {driver.stops?.map((stop, i) => (
                                                <span key={i} className="text-[11px] font-bold bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl shadow-xs">
                                                    {stop.stopName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}