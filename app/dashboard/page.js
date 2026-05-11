"use client";

import React, { useState, useEffect } from "react";
import {
  HiOutlineAcademicCap,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiExclamationCircle,
  HiPlusCircle,
  HiOutlineCake,
  HiSparkles,
} from "react-icons/hi";

import { db } from "../firebase/config";

import {
  collection,
  onSnapshot,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const CLASS_PROMOTION_MAP = {
  Nursery: "LKG",
  LKG: "UKG",
  UKG: "1",
  1: "2",
  2: "3",
  3: "4",
  4: "5",
  5: "6",
  6: "7",
  7: "8",
  8: "9",
  9: "10",
  10: "11",
  11: "12",
  12: "PASSED OUT",
};

export default function ProfessionalDashboard() {
  const [currentSession, setCurrentSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isMigrating, setIsMigrating] = useState(false);

  const [targetMigrationSession, setTargetMigrationSession] =
    useState("");

  const [showNewSessionModal, setShowNewSessionModal] =
    useState(false);

  const [newSessionName, setNewSessionName] = useState("");

  const [stats, setStats] = useState({
    totalStudents: 0,
    currentYearCollection: 0,
    pendingPreviousDues: 0,
  });

  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

  // CONFIG
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "config", "settings"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          setCurrentSession(data.activeSession);
          setAllSessions(data.sessions || []);
        }

        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // FETCH DATA
  useEffect(() => {
    if (!currentSession) return;

    const sRef = collection(
      db,
      "sessions",
      currentSession,
      "students"
    );

    const fRef = collection(
      db,
      "sessions",
      currentSession,
      "feePayments"
    );

    const unsubS = onSnapshot(sRef, (snap) => {
      const studentData = snap.docs.map((d) => d.data());

      const active = studentData.filter(
        (s) => s.grade !== "PASSED OUT"
      ).length;

      const prevDues = studentData.reduce(
        (sum, s) =>
          sum + Number(s.previouslyDue || s.previousDue || 0),
        0
      );

      setStats((prev) => ({
        ...prev,
        totalStudents: active,
        pendingPreviousDues: prevDues,
      }));

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const bdays = studentData
        .filter((s) => s.dob && s.dob !== "N/A")
        .map((s) => {
          const birthDate = new Date(s.dob);

          const nextBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );

          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }

          return {
            ...s,
            nextBirthday,
          };
        })
        .sort((a, b) => a.nextBirthday - b.nextBirthday)
        .slice(0, 6);

      setUpcomingBirthdays(bdays);
    });

    const unsubF = onSnapshot(fRef, (snap) => {
      const total = snap.docs.reduce(
        (sum, d) => sum + (Number(d.data().amount) || 0),
        0
      );

      setStats((prev) => ({
        ...prev,
        currentYearCollection: total,
      }));
    });

    return () => {
      unsubS();
      unsubF();
    };
  }, [currentSession]);

  // CREATE SESSION
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      await updateDoc(doc(db, "config", "settings"), {
        sessions: arrayUnion(newSessionName.trim()),
      });

      setNewSessionName("");
      setShowNewSessionModal(false);
    } catch (e) {
      alert(e.message);
    }
  };

  // MIGRATION
  const handleMigrateAndPromote = async () => {
    if (!targetMigrationSession) return;

    if (
      !window.confirm(
        `PROMOTE ALL STUDENTS TO ${targetMigrationSession}?`
      )
    )
      return;

    setIsMigrating(true);

    try {
      const batch = writeBatch(db);

      const timestamp = Date.now();

      const feeStructSnap = await getDocs(
        collection(
          db,
          "sessions",
          currentSession,
          "studentFeeStructures"
        )
      );

      const classFees = {};

      feeStructSnap.forEach((doc) => {
        classFees[doc.id] = Number(
          doc.data().totalFee || 0
        );
      });

      const paymentSnap = await getDocs(
        collection(
          db,
          "sessions",
          currentSession,
          "feePayments"
        )
      );

      const studentPayments = {};

      paymentSnap.forEach((doc) => {
        const p = doc.data();

        if (!studentPayments[p.studentId]) {
          studentPayments[p.studentId] = 0;
        }

        studentPayments[p.studentId] +=
          Number(p.amount) + Number(p.relaxation || 0);
      });

      const sSnap = await getDocs(
        collection(
          db,
          "sessions",
          currentSession,
          "students"
        )
      );

      sSnap.docs.forEach((d) => {
        const data = d.data();

        const nextGrade =
          CLASS_PROMOTION_MAP[String(data.grade)] ||
          data.grade;

        const balanceToCarry =
          (classFees[data.grade] || 0) +
          Number(data.previouslyDue || 0) -
          (studentPayments[d.id] || 0);

        const srNo =
          data.scholarNo || data.ScholarNo || "NA";

        const newStudentId = `S${srNo}_${nextGrade}_${timestamp}`;

        batch.set(
          doc(
            db,
            "sessions",
            targetMigrationSession,
            "students",
            newStudentId
          ),
          {
            ...data,
            id: newStudentId,
            grade: nextGrade,
            migratedFrom: currentSession,
            previouslyDue:
              balanceToCarry > 0 ? balanceToCarry : 0,
            paidAmount: 0,
          }
        );
      });

      await batch.commit();

      await updateDoc(doc(db, "config", "settings"), {
        activeSession: targetMigrationSession,
      });

      alert("Success");
    } catch (e) {
      alert(e.message);
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center">
        <div className="text-[#8D93AE] font-bold animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF] p-8 relative overflow-hidden">
      {/* BACKGROUND GLOWS */}
      <div className="absolute top-[-200px] left-[10%] w-[500px] h-[500px] bg-purple-300/30 blur-[140px] rounded-full" />

      <div className="absolute bottom-[-200px] right-[5%] w-[500px] h-[500px] bg-cyan-200/30 blur-[140px] rounded-full" />

      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-pink-200/20 blur-[120px] rounded-full" />

      {/* FLOATING LIGHTS */}
      <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.9)] animate-pulse" />

      <div className="absolute bottom-32 left-24 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_25px_8px_rgba(168,85,247,0.8)] animate-pulse" />

      <div className="relative z-10 space-y-7">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#7B6DFF] to-[#9C8DFF] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(123,109,255,0.45)] border border-white/30">
                <div className="absolute inset-0 rounded-[24px] bg-purple-300/40 blur-xl scale-125" />

                <HiOutlineShieldCheck
                  size={30}
                  className="relative z-10"
                />
              </div>

              <div>
                <h1 className="text-[32px] font-[800] text-[#1E2235] tracking-tight">
                  Welcome back, Admin
                </h1>

                <p className="text-[#8D93AE] font-medium mt-1">
                  Here's what's happening in your school
                  today.
                </p>
              </div>
            </div>
          </div>

          {/* SESSION */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative overflow-hidden rounded-[24px] border border-white/40 bg-white/45 backdrop-blur-[24px] shadow-[0_8px_32px_rgba(31,38,135,0.08)] px-5 py-4 min-w-[260px]">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-200/30 blur-3xl rounded-full" />

              <p className="text-[11px] uppercase tracking-[3px] text-[#8D93AE] font-bold mb-1">
                Active Session
              </p>

              <select
                value={currentSession}
                onChange={(e) =>
                  updateDoc(doc(db, "config", "settings"), {
                    activeSession: e.target.value,
                  })
                }
                className="bg-transparent outline-none text-[#1E2235] font-[800] text-lg cursor-pointer"
              >
                {allSessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setShowNewSessionModal(true)
              }
              className="h-[60px] px-8 rounded-[22px] bg-gradient-to-r from-[#7B6DFF] to-[#9C8DFF] text-white font-bold shadow-[0_15px_40px_rgba(123,109,255,0.45)] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3"
            >
              <HiPlusCircle size={22} />
              Initialize Session
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={HiOutlineAcademicCap}
            label="Total Students"
            value={stats.totalStudents}
            sub="Actively Enrolled"
            gradient="from-[#7B6DFF] to-[#9C8DFF]"
          />

          <StatCard
            icon={HiOutlineCurrencyRupee}
            label="Total Collection"
            value={`₹ ${stats.currentYearCollection.toLocaleString()}`}
            sub="Current Session"
            gradient="from-[#3DD598] to-[#8AF1C1]"
          />

          <StatCard
            icon={HiExclamationCircle}
            label="Historical Dues"
            value={`₹ ${stats.pendingPreviousDues.toLocaleString()}`}
            sub="Pending Arrears"
            gradient="from-[#FF8A65] to-[#FFB199]"
          />
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* MIGRATION */}
          <div className="xl:col-span-2 relative overflow-hidden rounded-[32px] border border-white/40 bg-white/45 backdrop-blur-[24px] shadow-[0_8px_32px_rgba(31,38,135,0.08)] p-7">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-200/40 blur-3xl rounded-full opacity-70" />

            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-100/40 blur-3xl rounded-full opacity-70" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#7B6DFF] to-[#9C8DFF] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(123,109,255,0.45)] border border-white/30">
                  <div className="absolute inset-0 rounded-[22px] bg-purple-300/40 blur-xl scale-125" />

                  <HiOutlineTrendingUp
                    className="relative z-10"
                    size={30}
                  />
                </div>

                <div>
                  <h2 className="text-[24px] font-[800] text-[#1E2235] tracking-tight">
                    Promotion & Migration Engine
                  </h2>

                  <p className="text-[#8D93AE] font-medium mt-1">
                    Smart academic promotion system for
                    next year migration.
                  </p>
                </div>
              </div>

              {/* INFO CARD */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(99,102,241,0.08)] p-6 mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 blur-3xl rounded-full" />

                <div className="flex items-start gap-4 relative z-10">
                  <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#7B6DFF] to-[#9C8DFF] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(123,109,255,0.45)]">
                    <HiSparkles size={26} />
                  </div>

                  <div>
                    <h3 className="text-[#1E2235] text-lg font-[800] mb-2">
                      Smart Auto Promotion
                    </h3>

                    <p className="text-[#8D93AE] leading-relaxed font-medium">
                      Automatically upgrades students,
                      calculates remaining balances and
                      carries forward pending dues into
                      the next academic year without
                      changing any functionality.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={targetMigrationSession}
                  onChange={(e) =>
                    setTargetMigrationSession(
                      e.target.value
                    )
                  }
                  className="flex-1 h-[60px] rounded-[22px] border border-white/40 bg-white/40 backdrop-blur-xl shadow-inner shadow-white/20 px-5 outline-none text-[#1f2333] font-semibold"
                >
                  <option value="">
                    Select Target Session...
                  </option>

                  {allSessions
                    .filter((s) => s !== currentSession)
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleMigrateAndPromote}
                  disabled={
                    isMigrating ||
                    !targetMigrationSession
                  }
                  className="h-[60px] px-8 rounded-[22px] bg-gradient-to-r from-[#7B6DFF] to-[#9C8DFF] text-white font-bold shadow-[0_15px_40px_rgba(123,109,255,0.45)] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40"
                >
                  {isMigrating
                    ? "Migrating..."
                    : "Run Migration"}
                </button>
              </div>
            </div>
          </div>

          {/* BIRTHDAYS */}
          <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/45 backdrop-blur-[24px] shadow-[0_8px_32px_rgba(31,38,135,0.08)] p-6">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-pink-200/40 blur-3xl rounded-full opacity-70" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-[24px] font-[800] text-[#1E2235] tracking-tight">
                  Birthdays
                </h2>

                <p className="text-[#8D93AE] font-medium mt-1">
                  Upcoming student birthdays
                </p>
              </div>

              <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-br from-pink-400 to-orange-300 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,105,135,0.4)]">
                <HiOutlineCake size={28} />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {upcomingBirthdays.map((s, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-[24px] border border-white/40 bg-white/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(99,102,241,0.08)] p-4"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-pink-200/30 blur-3xl rounded-full" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B6DFF] to-[#9C8DFF] text-white flex items-center justify-center font-bold shadow-[0_10px_25px_rgba(123,109,255,0.4)] shrink-0">
                        {s.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-[800] text-[#1E2235] truncate">
                          {s.name}
                        </p>

                        <p className="text-[#8D93AE] text-sm font-medium">
                          Class {s.grade}
                        </p>
                      </div>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-white/70 backdrop-blur-xl text-[#7B6DFF] text-xs font-bold border border-white/40 shadow-sm">
                      {new Date(
                        s.nextBirthday
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[38px] border border-white/40 bg-white/45 backdrop-blur-[30px] shadow-[0_20px_80px_rgba(0,0,0,0.18)] p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-purple-300/30 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <div className="relative w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#7B6DFF] to-[#9C8DFF] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(123,109,255,0.45)] mb-6">
                <HiPlusCircle size={30} />
              </div>

              <h2 className="text-[30px] font-[800] text-[#1E2235] tracking-tight mb-2">
                New Academic Session
              </h2>

              <p className="text-[#8D93AE] font-medium mb-6">
                Create a new school academic year.
              </p>

              <input
                value={newSessionName}
                onChange={(e) =>
                  setNewSessionName(e.target.value)
                }
                placeholder="e.g. 2027-28"
                className="w-full h-[62px] rounded-[22px] border border-white/40 bg-white/40 backdrop-blur-xl shadow-inner shadow-white/20 px-5 outline-none text-[#1f2333] font-semibold text-lg mb-5"
              />

              <div className="space-y-3">
                <button
                  onClick={handleCreateSession}
                  className="w-full h-[60px] rounded-[22px] bg-gradient-to-r from-[#7B6DFF] to-[#9C8DFF] text-white font-bold shadow-[0_15px_40px_rgba(123,109,255,0.45)] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Initialize Now
                </button>

                <button
                  onClick={() =>
                    setShowNewSessionModal(false)
                  }
                  className="w-full h-[54px] rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-xl text-[#8D93AE] font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/45 backdrop-blur-[24px] shadow-[0_8px_32px_rgba(31,38,135,0.08)] p-6">
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-200/40 blur-3xl rounded-full opacity-70" />

      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-100/40 blur-3xl rounded-full opacity-70" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-[#8D93AE] font-semibold mb-2">
              {label}
            </p>

            <h2 className="text-[40px] leading-none font-[800] tracking-tight text-[#1E2235] mb-2">
              {value}
            </h2>

            <p className="text-[#22C55E] font-bold text-sm">
              ↑ {sub}
            </p>
          </div>

          <div
            className={`relative w-16 h-16 rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-[0_10px_30px_rgba(123,109,255,0.45)] border border-white/30`}
          >
            <div className="absolute inset-0 rounded-[22px] bg-white/20 blur-lg scale-125" />

            <Icon
              className="relative z-10"
              size={30}
            />
          </div>
        </div>

        {/* GLOW LINE */}
        <div className="h-[6px] rounded-full bg-white/40 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} w-[75%] shadow-[0_0_20px_rgba(123,109,255,0.7)]`}
          />
        </div>
      </div>
    </div>
  );
}