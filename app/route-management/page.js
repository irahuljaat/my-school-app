'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
    HiOutlineTruck, 
    HiOutlineSave,
    HiOutlinePlus,
    HiOutlineTrash,
    HiLocationMarker,
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
        <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-32 p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <HiOutlineTruck className="text-xl" />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl tracking-tight">Driver & Route Management</h1>
                            <p className="text-sm text-slate-500">Manage transport personnel and map out stops.</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                        Session: {activeSession || 'Loading...'}
                    </span>
                </div>

                {/* Add Driver Form */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <form onSubmit={handleSaveDriver} className="space-y-8">
                        
                        {/* Section 1: Personal Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <HiOutlineUser className="text-lg" />
                                <h3 className="font-bold text-slate-800">Personal Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input required type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <input required type="tel" name="phone" placeholder="Primary Phone" value={formData.phone} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <input type="tel" name="emergencyPhone" placeholder="Emergency Contact" value={formData.emergencyPhone} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <input type="text" name="bloodGroup" placeholder="Blood Group (e.g., O+)" value={formData.bloodGroup} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <input type="text" name="address" placeholder="Residential Address" value={formData.address} onChange={handleInputChange}
                                    className="w-full md:col-span-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section 2: Documents */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <HiOutlineIdentification className="text-lg" />
                                <h3 className="font-bold text-slate-800">Verification & Documents</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input required type="text" name="aadharNo" placeholder="Aadhar Card Number" value={formData.aadharNo} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <input required type="text" name="licenseNo" placeholder="Driving License Number" value={formData.licenseNo} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <div className="relative">
                                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase">License Expiry</label>
                                    <input required type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-700" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section 3: Vehicle Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <HiOutlineTruck className="text-lg" />
                                <h3 className="font-bold text-slate-800">Vehicle Assignment</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input required type="text" name="vehicleNo" placeholder="Vehicle No (e.g. RJ-14-1234)" value={formData.vehicleNo} onChange={handleInputChange}
                                    className="w-full md:col-span-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-700">
                                    <option value="Bus">Bus</option>
                                    <option value="Van">Van / Minibus</option>
                                    <option value="Car">Car / SUV</option>
                                </select>
                                <input required type="number" name="capacity" placeholder="Seating Capacity" value={formData.capacity} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section 4: Route & Stops */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <HiOutlineLocationMarker className="text-lg" />
                                    <h3 className="font-bold text-slate-800">Route Map</h3>
                                </div>
                                <button type="button" onClick={handleAddStop} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                    <HiOutlinePlus /> ADD STOP
                                </button>
                            </div>

                            <input required type="text" name="routeName" placeholder="Route Name (e.g. Route A - Malviya Nagar)" value={formData.routeName} onChange={handleInputChange}
                                className="w-full mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                            
                            <div className="space-y-3">
                                {stops.map((stop, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex-1 w-full relative">
                                            <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input required type="text" placeholder={`Stop ${index + 1} Name`} value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white" />
                                        </div>
                                        <input required type="number" step="any" placeholder="Latitude (e.g. 26.9124)" value={stop.lat} onChange={e => handleStopChange(index, 'lat', e.target.value)}
                                            className="w-full md:w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white" />
                                        <input required type="number" step="any" placeholder="Longitude (e.g. 75.7873)" value={stop.lng} onChange={e => handleStopChange(index, 'lng', e.target.value)}
                                            className="w-full md:w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white" />
                                        
                                        {stops.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveStop(index)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
                                                <HiOutlineTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button disabled={isSaving || !activeSession} type="submit" 
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50">
                            {isSaving ? 'SAVING DATA...' : <><HiOutlineSave className="text-xl" /> SAVE DRIVER & ROUTE</>}
                        </button>
                    </form>
                </div>

                {/* Driver List */}
                <div className="space-y-4 pt-6">
                    <h3 className="font-semibold text-slate-800 text-lg">Active Fleet ({drivers.length})</h3>
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Loading fleet data...</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {drivers.map(driver => (
                                <div key={driver.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{driver.name}</h4>
                                            <p className="text-sm font-medium text-indigo-600">{driver.routeName || 'No Route Name'}</p>
                                        </div>
                                        <button onClick={() => handleDeleteDriver(driver.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                            <HiOutlineTrash className="text-xl" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
                                        <div>
                                            <span className="text-slate-400 text-xs block">Vehicle</span>
                                            <span className="font-medium">{driver.vehicleNo} ({driver.vehicleType})</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-xs block">Capacity</span>
                                            <span className="font-medium">{driver.capacity} Seats</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-xs block">Contact</span>
                                            <span className="font-medium">{driver.phone}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-xs block">DL Expiry</span>
                                            <span className="font-medium text-slate-700">{driver.licenseExpiry}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Stops ({driver.stops?.length || 0})</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {driver.stops?.map((stop, i) => (
                                                <span key={i} className="text-[11px] font-medium bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
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