'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase/config';
import { useColors } from '../components/ColorComponent';
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  BookOpen, Layers, Sparkles, HelpCircle, CheckCircle2, Eye, FileDown,
  Upload, Loader2, AlertCircle, Plus, Printer, X, ToggleLeft, ToggleRight,
  Calculator, FileText, CheckSquare, Image as ImageIcon, Database, Check,
  CheckSquare2, Square, ChevronRight, ArrowLeft, ArrowRight, ClipboardList,
  GraduationCap, Grid3x3, ListChecks, PenLine, Shapes, Trophy, Users,
  ChevronDown, ChevronUp, BarChart2, BookMarked, Tag, Info, KeyRound
} from 'lucide-react';

import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const SCHOOL_CONFIG = {
  name: 'MVG PUBLIC SENIOR SECONDARY SCHOOL',
  subtext: 'Sheopur, Pratap Nagar, Jaipur - 8875646366',
  logoUrl: '/logo.png',
};

const CLASSES = ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'UKG', 'LKG', 'NURSERY'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Sanskrit'];

const STEPS = [
  { id: 1, label: 'Setup', hint: 'Class, syllabus & marks', icon: GraduationCap },
  { id: 2, label: 'Blueprint', hint: 'Question mix', icon: Grid3x3 },
  { id: 3, label: 'Generate', hint: 'AI drafting', icon: Sparkles },
  { id: 4, label: 'Review', hint: 'Check the paper', icon: ListChecks },
  { id: 5, label: 'Publish', hint: 'Save to Firestore', icon: Database },
];

const BLUEPRINT_META = {
  mcq:            { label: 'Multiple Choice (MCQ)',      icon: HelpCircle },
  trueFalse:      { label: 'True / False',               icon: ToggleLeft },
  tickCorrect:    { label: 'Tick the Correct Answer',    icon: CheckSquare },
  matchFollowing: { label: 'Match the Following',        icon: Layers },
  veryShort:      { label: 'Very Short Answer',          icon: PenLine },
  short:          { label: 'Short Answer',               icon: FileText },
  long:           { label: 'Long Answer',                icon: BookOpen },
  diagramBased:   { label: 'Diagram / Geometry Based',   icon: Shapes },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExamPipelinePage() {
  const colors = useColors();
  const [view, setView]                     = useState('dashboard');
  const [currentStep, setCurrentStep]       = useState(1);
  const [activeSession, setActiveSession]   = useState('2026-27');
  const [savedPapers, setSavedPapers]       = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [selectedPaperForView, setSelectedPaperForView] = useState(null);
  const [previewMode, setPreviewMode]       = useState('paper'); // 'paper' | 'answers'
  const [isOnlineQuiz, setIsOnlineQuiz]     = useState(false);
  const [filterClass, setFilterClass]       = useState('ALL');

  // Quiz UI state
  const [quizMode, setQuizMode]             = useState('list');   // 'list' | 'play' | 'results'
  const [quizPaper, setQuizPaper]           = useState(null);
  const [currentQIdx, setCurrentQIdx]       = useState(0);
  const [quizAnswers, setQuizAnswers]       = useState({});
  const [quizSubmitted, setQuizSubmitted]   = useState(false);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Metadata
  const [selectedClass, setSelectedClass]   = useState('10');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [paperTitle, setPaperTitle]         = useState('Unit Assessment Exam');
  const [maxMarks, setMaxMarks]             = useState(50);
  const [timeAllowed, setTimeAllowed]       = useState('2 Hours');
  const [quizVisibleInApp, setQuizVisibleInApp] = useState(false);

  // Syllabus state
  const [pdfBase64List, setPdfBase64List]   = useState([]);
  const [uploadedFileNames, setUploadedFileNames] = useState([]);
  const [chapters, setChapters]             = useState([]);
  const [extractedText, setExtractedText]   = useState('');
  const [isProcessing, setIsProcessing]     = useState(false);
  const [questions, setQuestions]           = useState([]);
  const [error, setError]                   = useState(null);

  const [blueprint, setBlueprint] = useState({
    mcq:            { count: 4, marksPerQuestion: 1 },
    trueFalse:      { count: 3, marksPerQuestion: 1 },
    tickCorrect:    { count: 3, marksPerQuestion: 1 },
    matchFollowing: { count: 1, marksPerQuestion: 4 },
    veryShort:      { count: 4, marksPerQuestion: 2 },
    short:          { count: 3, marksPerQuestion: 3 },
    long:           { count: 2, marksPerQuestion: 5 },
    diagramBased:   { count: 1, marksPerQuestion: 4 },
  });

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  useEffect(() => { fetchActiveSessionAndPapers(); }, [isOnlineQuiz, filterClass]);

  const startNewPaper = () => {
    setView('generator');
    setCurrentStep(1);
    setQuizVisibleInApp(false);
  };

  // ── Fetch papers ───────────────────────────────────────────────────────────
  const fetchActiveSessionAndPapers = async () => {
    setLoadingDashboard(true);
    try {
      const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
      const session = (settingsSnap.exists() && settingsSnap.data().activeSession)
        ? settingsSnap.data().activeSession
        : activeSession;
      setActiveSession(session);

      const rootCol = isOnlineQuiz ? 'online_quiz' : 'exams';
      const classesToFetch = filterClass === 'ALL' ? CLASSES : [filterClass];
      const allPapers = [];

      for (const cls of classesToFetch) {
        for (const subj of SUBJECTS) {
          try {
            const papersRef = collection(
              db, 'sessions', session, 'paper-creation', rootCol, cls, subj, 'papers'
            );
            const q = query(papersRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            snap.forEach(d => {
              allPapers.push({ id: d.id, class: cls, subject: subj, ...d.data() });
            });
          } catch (_) {}
        }
      }

      allPapers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedPapers(allPapers);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // ── PDF handling ───────────────────────────────────────────────────────────
  const handleMultipleFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res({ name: f.name, data: r.result.split(',')[1] });
      r.readAsDataURL(f);
    }))).then(results => {
      setPdfBase64List(results.map(r => r.data));
      setUploadedFileNames(results.map(r => r.name));
    });
  };

  // ── Extract syllabus from PDFs ─────────────────────────────────────────────
  const handleExtractAndSaveSyllabus = async () => {
    if (!apiKey) return setError('Missing Gemini API Key.');
    if (!pdfBase64List.length) return setError('Upload at least one PDF.');
    setIsProcessing(true); setError(null);
    try {
      const promptText = `Extract all chapters, sub-topics, and raw text from the provided PDF.
Return ONLY JSON:
{
  "chapters": [{"chapterNo":1,"title":"...","topics":["..."]}],
  "extractedText": "full raw text..."
}`;
      const parts = pdfBase64List.map(d => ({ inlineData: { mimeType: 'application/pdf', data: d } }));
      parts.push({ text: promptText });
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts }], generationConfig:{ responseMimeType:'application/json' } }) }
      );
      const data = await res.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      const formatted = (result.chapters||[]).map((ch,i)=>({ ...ch, id:`ch_${i}`, selected:true }));
      setChapters(formatted);
      setExtractedText(result.extractedText || '');
      const docId = `${selectedClass}_${selectedSubject}`;
      await setDoc(doc(db,'sessions',activeSession,'syllabus',docId), {
        chapters: formatted, extractedText: result.extractedText||'', updatedAt: new Date().toISOString()
      });
      alert(`Saved ${formatted.length} chapter(s) to Firebase!`);
    } catch (err) { setError('Extraction error: '+err.message); }
    finally { setIsProcessing(false); }
  };

  // ── Fetch syllabus from Firebase and populate extractedText ────────────────
  const handleFetchSyllabusFromFirebase = async () => {
    setIsProcessing(true); setError(null);
    try {
      const docId = `${selectedClass}_${selectedSubject}`;
      const snap = await getDoc(doc(db,'sessions',activeSession,'syllabus',docId));
      if (snap.exists()) {
        const data = snap.data();
        const loaded = (data.chapters||[]).map(ch => ({ ...ch, selected: true }));
        setChapters(loaded);
        setExtractedText(data.extractedText || loaded.map(c =>
          `Chapter ${c.chapterNo}: ${c.title}\n${(c.topics||[]).join(', ')}`
        ).join('\n\n'));
        alert(`Loaded ${loaded.length} chapters for Class ${selectedClass} · ${selectedSubject}`);
      } else {
        setError(`No syllabus found for Class ${selectedClass} - ${selectedSubject}.`);
      }
    } catch (err) { setError('Firebase error: '+err.message); }
    finally { setIsProcessing(false); }
  };

  const toggleSelectAllChapters = s => setChapters(p => p.map(ch => ({ ...ch, selected: s })));
  const toggleSingleChapter = id => setChapters(p => p.map(ch => ch.id===id ? { ...ch, selected:!ch.selected } : ch));

  // ── AI Question Generation ───────────────────────────────────────────────
  const handleTriggerAI = async () => {
    if (!apiKey) return setError('Gemini API Key missing.');
    const selected = chapters.filter(c => c.selected);
    if (!selected.length) return setError('Select at least one chapter.');
    if (!extractedText && !selected.length) return setError('No syllabus content found. Please upload PDFs or fetch from Firebase first.');
    setIsProcessing(true); setError(null);

    const bp = isOnlineQuiz
      ? { ...blueprint, trueFalse:{count:0,marksPerQuestion:1}, tickCorrect:{count:0,marksPerQuestion:1},
          matchFollowing:{count:0,marksPerQuestion:4}, veryShort:{count:0,marksPerQuestion:2},
          short:{count:0,marksPerQuestion:3}, long:{count:0,marksPerQuestion:5}, diagramBased:{count:0,marksPerQuestion:4} }
      : blueprint;

    const promptText = `
Generate an exam paper strictly from these SELECTED CHAPTERS:
${JSON.stringify(selected, null, 2)}

Full syllabus context:
${extractedText.substring(0, 10000)}

Mode: ${isOnlineQuiz ? 'ONLINE QUIZ - MCQ ONLY' : 'PRINTABLE EXAM'}
Subject: ${selectedSubject}

Blueprint:
- MCQ: ${bp.mcq.count} questions (${bp.mcq.marksPerQuestion} mark each)
${!isOnlineQuiz ? `- True/False: ${bp.trueFalse.count} questions (${bp.trueFalse.marksPerQuestion} mark each)
- Tick Correct: ${bp.tickCorrect.count} questions (${bp.tickCorrect.marksPerQuestion} mark each)
- Match Following: ${bp.matchFollowing.count} sets (${bp.matchFollowing.marksPerQuestion} marks)
- Very Short: ${bp.veryShort.count} questions (${bp.veryShort.marksPerQuestion} marks each)
- Short Answer: ${bp.short.count} questions (${bp.short.marksPerQuestion} marks each)
- Long Answer: ${bp.long.count} questions (${bp.long.marksPerQuestion} marks each)
- Diagram Based: ${bp.diagramBased.count} questions (${bp.diagramBased.marksPerQuestion} marks each)` : '(ONLY MCQ questions, no other types)'}

IMPORTANT: For every question add a "chapterSource" field with the chapter title it came from.
Use LaTeX for math: $formula$. For diagrams include SVG in "diagramSvg".

Return ONLY a JSON array:
[{
  "id": 1,
  "type": "MCQ",
  "marks": 1,
  "question": "...",
  "options": ["A","B","C","D"],
  "correctAnswer": "A",
  "explanation": "...",
  "matchPairs": [],
  "diagramSvg": null,
  "chapterSource": "Chapter 1: Real Numbers"
}]`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{ text:promptText }] }], generationConfig:{ responseMimeType:'application/json' } }) }
      );
      const data = await res.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      setQuestions(parsed);
      setCurrentStep(4);
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  // ── Save paper to Firestore ────────────────────────────────────────────────
  const handleSavePaperToFirestore = async () => {
    try {
      const rootCol = isOnlineQuiz ? 'online_quiz' : 'exams';
      const papersRef = collection(
        db, 'sessions', activeSession, 'paper-creation', rootCol, selectedClass, selectedSubject, 'papers'
      );

      const paperPayload = {
        title:       paperTitle,
        class:       selectedClass,
        subject:     selectedSubject,
        session:     activeSession,
        maxMarks,
        timeAllowed,
        isOnlineQuiz,
        visibleInApp: isOnlineQuiz ? quizVisibleInApp : false,
        questions,
        blueprint,
        totalQuestions: questions.length,
        createdAt:   new Date().toISOString(),
      };

      const docRef = await addDoc(papersRef, paperPayload);

      if (isOnlineQuiz) {
        alert(`✅ Quiz saved!\nPath: sessions/${activeSession}/paper-creation/online_quiz/${selectedClass}/${selectedSubject}/papers/${docRef.id}\n\nVisible in App: ${quizVisibleInApp ? 'Yes — students can attempt it now' : 'No — hidden until you enable it'}`);
      } else {
        alert(`✅ Exam paper saved!\nPath: sessions/${activeSession}/paper-creation/exams/${selectedClass}/${selectedSubject}/papers/${docRef.id}`);
      }

      fetchActiveSessionAndPapers();
      setView('dashboard');
      setCurrentStep(1);
    } catch (err) { alert('Save error: ' + err.message); }
  };

  const toggleQuizVisibility = async (paper) => {
    try {
      const session = paper.session || activeSession;
      const paperDocRef = doc(
        db, 'sessions', session, 'paper-creation', 'online_quiz',
        paper.class, paper.subject, 'papers', paper.id
      );
      await updateDoc(paperDocRef, { visibleInApp: !paper.visibleInApp });
      fetchActiveSessionAndPapers();
    } catch (err) {
      alert('Error updating visibility: ' + err.message);
    }
  };

  const loadStudentAttempts = async (paper) => {
    setLoadingAttempts(true);
    try {
      const session = paper.session || activeSession;
      const resultsRef = collection(
        db, 'sessions', session, 'paper-creation', 'online_quiz',
        paper.class, paper.subject, 'papers', paper.id, 'student_results'
      );
      const snap = await getDocs(query(resultsRef, orderBy('score', 'desc')));
      const attempts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudentAttempts(attempts);
    } catch (_) { setStudentAttempts([]); }
    finally { setLoadingAttempts(false); }
  };

  const renderMathText = (text) => {
    if (!text) return null;
    return text.split(/(\$[^$]+\$)/g).map((part, i) =>
      part.startsWith('$') && part.endsWith('$')
        ? <InlineMath key={i} math={part.slice(1,-1)} />
        : <span key={i}>{part}</span>
    );
  };

  const renderDynamicOptions = (options, correctAnswer, showAnswers) => {
    if (!options?.length) return null;
    const maxLen = Math.max(...options.map(o => o.toString().length));
    const grid = maxLen > 30 ? 'grid-cols-1' : maxLen > 12 ? 'grid-cols-2' : 'grid-cols-4';
    return (
      <div className={`grid ${grid} gap-x-4 gap-y-1 pl-4 pt-0.5 text-xs font-serif`}>
        {options.map((opt, idx) => {
          const isCorrect = showAnswers && opt === correctAnswer;
          return (
            <div key={idx} className={`flex items-center gap-1 ${isCorrect ? 'text-emerald-700 font-bold' : ''}`}>
              <span className="font-bold">({String.fromCharCode(97+idx)})</span>
              <span>{renderMathText(opt)}</span>
              {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </div>
          );
        })}
      </div>
    );
  };

  const blueprintTotals = Object.values(blueprint).reduce(
    (acc, b) => ({ questionCount: acc.questionCount+(b.count||0), marks: acc.marks+(b.count||0)*(b.marksPerQuestion||0) }),
    { questionCount:0, marks:0 }
  );

  const papersByClass = savedPapers.reduce((acc, p) => {
    if (!acc[p.class]) acc[p.class] = [];
    acc[p.class].push(p);
    return acc;
  }, {});

  if (quizMode === 'play' && quizPaper) {
    const mcqQs = quizPaper.questions?.filter(q => q.type === 'MCQ') || [];
    return (
      <QuizPlayScreen
        quizPaper={quizPaper} mcqQs={mcqQs} currentQIdx={currentQIdx}
        setCurrentQIdx={setCurrentQIdx} quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers} quizSubmitted={quizSubmitted}
        setQuizSubmitted={setQuizSubmitted} renderMathText={renderMathText}
        colors={colors}
        onExit={() => { setQuizMode('list'); setQuizPaper(null); setQuizAnswers({}); setQuizSubmitted(false); setCurrentQIdx(0); }}
        onViewResults={() => { setQuizMode('results'); loadStudentAttempts(quizPaper); }}
      />
    );
  }

  if (quizMode === 'results' && quizPaper) {
    return (
      <ResultsScreen
        quizPaper={quizPaper} studentAttempts={studentAttempts}
        loadingAttempts={loadingAttempts} renderMathText={renderMathText}
        colors={colors}
        onBack={() => { setQuizMode('list'); setStudentAttempts([]); }}
      />
    );
  }

  return (
    <div style={{ backgroundColor: colors.background }} className="min-h-screen text-slate-900 flex flex-col font-sans relative overflow-hidden">
      {/* Soft background decorative blur elements */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" 
        style={{ backgroundColor: colors.primary }} 
      />
      <div 
        className="absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" 
        style={{ backgroundColor: colors.primary }} 
      />

      <style jsx global>{`
        #print-portal-root { display: none; }
        @media print {
          body > *:not(#print-portal-root) { display: none !important; }
          #print-portal-root { display: block !important; position: static !important; width: 100% !important; }
          @page { size: A4 portrait; margin: 12mm; }
          html,body { height:auto !important; background:#fff !important; margin:0 !important; padding:0 !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .print-question-block { page-break-inside:avoid !important; break-inside:avoid !important; margin-bottom:10px !important; font-size:11px !important; line-height:1.3 !important; }
          .print-header { border-bottom:2px solid #000 !important; padding-bottom:6px !important; margin-bottom:10px !important; }
        }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeSlideIn 0.18s ease-out; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="no-print sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/70 px-5 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden text-white font-bold" style={{ backgroundColor: colors.primary }}>
            <img src={SCHOOL_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={e=>{e.target.style.display='none'}} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">{SCHOOL_CONFIG.name}</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Session <span className="font-bold" style={{ color: colors.primary }}>{activeSession}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold">
            <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out" style={{transform: isOnlineQuiz?'translateX(calc(100% + 8px))':'translateX(0)'}} />
            <button onClick={()=>setIsOnlineQuiz(false)} className={`relative z-10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors`} style={{ color: !isOnlineQuiz ? colors.primary : '#64748b' }}>
              <FileText className="w-3.5 h-3.5" /> Printable
            </button>
            <button onClick={()=>setIsOnlineQuiz(true)} className={`relative z-10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors`} style={{ color: isOnlineQuiz ? colors.primary : '#64748b' }}>
              <CheckSquare className="w-3.5 h-3.5" /> Online Quiz
            </button>
          </div>
          {view==='generator'
            ? <button onClick={()=>setView('dashboard')} className="px-5 py-3 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"><ArrowLeft className="w-3.5 h-3.5"/> Dashboard</button>
            : <button onClick={startNewPaper} style={{ backgroundColor: colors.primary }} className="px-5 py-3 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] hover:opacity-95"><Plus className="w-4 h-4"/> Create New Paper</button>
          }
        </div>
      </header>

      {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
      {view==='dashboard' && (
        <main className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden flex-1 w-full">
          <div className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 bg-white mb-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overview</h2>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{isOnlineQuiz ? 'Online Quizzes' : 'Printable Exam Papers'}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Stored under <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">sessions / {activeSession} / paper-creation / {isOnlineQuiz ? 'online_quiz' : 'exams'} / &#123;class&#125; / &#123;subject&#125; / papers</code></p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
                  className="text-xs border border-slate-200 rounded-full px-5 py-3 bg-white focus:outline-none focus:ring-2">
                  <option value="ALL">All Classes</option>
                  {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
                </select>
                <div className="px-5 py-3 rounded-full bg-white border border-slate-200 shadow-sm text-xs">
                  <span className="font-bold" style={{ color: colors.primary }}>{savedPapers.length}</span>
                  <span className="text-slate-500 ml-1">papers</span>
                </div>
                <button onClick={startNewPaper} style={{ backgroundColor: colors.primary }}
                  className="px-5 py-3 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] hover:opacity-95">
                  <Plus className="w-4 h-4"/> New Paper
                </button>
              </div>
            </div>
          </div>

          {loadingDashboard ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-slate-500 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.primary }}/> Loading…
            </div>
          ) : savedPapers.length===0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[28px] bg-white/60 text-slate-400 text-xs flex flex-col items-center gap-2">
              <ClipboardList className="w-8 h-8 text-slate-300"/>
              No papers found. Click "Create New Paper" to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(papersByClass).map(([cls, papers]) => (
                <div key={cls} className="rounded-[28px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2" style={{ backgroundColor: `${colors.primary}10` }}>
                    <GraduationCap className="w-4 h-4" style={{ color: colors.primary }}/>
                    <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>Class {cls}</h3>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">{papers.length} paper{papers.length!==1?'s':''}</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-4 md:p-6">Title</th>
                        <th className="p-4 md:p-6">Subject</th>
                        <th className="p-4 md:p-6">Max Marks</th>
                        <th className="p-4 md:p-6">Created</th>
                        <th className="p-4 md:p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {papers.map(paper=>(
                        <tr key={paper.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 md:p-6 font-semibold text-slate-800">{paper.title}</td>
                          <td className="p-4 md:p-6">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              <BookMarked className="w-3 h-3"/>{paper.subject}
                            </span>
                          </td>
                          <td className="p-4 md:p-6 font-mono font-bold text-slate-700">{paper.maxMarks||50}</td>
                          <td className="p-4 md:p-6 text-slate-400 text-[11px]">{new Date(paper.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 md:p-6 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={()=>{setSelectedPaperForView(paper); setPreviewMode('paper');}}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-[0.99]">
                                <Eye className="w-3.5 h-3.5"/> {isOnlineQuiz ? 'Preview' : 'View/Print'}
                              </button>
                              {isOnlineQuiz && (
                                <>
                                  <button onClick={()=>toggleQuizVisibility(paper)}
                                    title="Toggle whether students can see & attempt this in the app"
                                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-[0.99] ${paper.visibleInApp ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-600 hover:text-white'}`}>
                                    {paper.visibleInApp ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                                    {paper.visibleInApp ? 'Visible' : 'Hidden'}
                                  </button>
                                  <button onClick={()=>{ setQuizPaper(paper); setQuizMode('play'); setQuizAnswers({}); setQuizSubmitted(false); setCurrentQIdx(0); }}
                                    className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-[0.99] text-white" style={{ backgroundColor: colors.primary }}>
                                    <Sparkles className="w-3.5 h-3.5"/> Take Quiz
                                  </button>
                                  <button onClick={()=>{ setQuizPaper(paper); setQuizMode('results'); loadStudentAttempts(paper); }}
                                    className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-[0.99]">
                                    <Trophy className="w-3.5 h-3.5"/> Results
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── GENERATOR WORKFLOW ─────────────────────────────────────────────── */}
      {view==='generator' && (
        <main className="max-w-[1440px] mx-auto p-6 lg:p-8 font-sans relative overflow-hidden flex-1 w-full flex flex-col">
          <div className="flex flex-col lg:flex-row gap-6 flex-1">
            {/* Stepper */}
            <div className="lg:w-64 shrink-0">
              <div className="rounded-[28px] border border-slate-100 shadow-sm p-4 bg-white lg:sticky lg:top-24">
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                  {STEPS.map(step=>{
                    const Icon = step.icon;
                    const isActive = currentStep===step.id;
                    const isDone = currentStep>step.id;
                    return (
                      <button key={step.id} onClick={()=>setCurrentStep(step.id)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all shrink-0 lg:shrink ${isActive?'bg-slate-50 border border-slate-100':''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all text-white`} style={{ backgroundColor: isActive || isDone ? colors.primary : '#cbd5e1' }}>
                          {isDone ? <Check className="w-4 h-4"/> : <Icon className="w-4 h-4"/>}
                        </div>
                        <div className="hidden sm:block">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isActive?'text-slate-800':'text-slate-400'}`}>{step.label}</p>
                          <p className="text-[11px] text-slate-500 font-semibold">{step.hint}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content panel */}
            <div className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 bg-white flex-1 flex flex-col min-w-0">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs fade-in font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0"/><span>{error}</span>
                </div>
              )}

              {/* STEP 1 */}
              {currentStep===1 && (
                <div className="space-y-6 fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/70 p-6 rounded-[28px] border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Class</label>
                      <select className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
                        {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject</label>
                      <select className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}>
                        {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Paper Title</label>
                      <input className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={paperTitle} onChange={e=>setPaperTitle(e.target.value)}/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Max Marks</label>
                      <input type="number" className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={maxMarks} onChange={e=>setMaxMarks(parseInt(e.target.value)||0)}/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Time Allowed</label>
                      <input className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={timeAllowed} onChange={e=>setTimeAllowed(e.target.value)}/>
                    </div>
                  </div>

                  {isOnlineQuiz && (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2 font-semibold">
                        <Info className="w-4 h-4 shrink-0"/>
                        <span>Online Quiz mode: Only <strong>MCQ</strong> questions will be generated. Other question types are disabled.</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Visible in Student App</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Students can only see & attempt this quiz in the app once it's turned on.</p>
                        </div>
                        <button onClick={()=>setQuizVisibleInApp(v=>!v)} className="shrink-0">
                          {quizVisibleInApp
                            ? <ToggleRight className="w-9 h-9 text-emerald-500"/>
                            : <ToggleLeft className="w-9 h-9 text-slate-300"/>}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="group border-2 border-dashed border-slate-200 rounded-[28px] p-6 text-center bg-slate-50/50 relative flex flex-col items-center justify-center hover:border-slate-300 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2" style={{ color: colors.primary }}><Upload className="w-5 h-5"/></div>
                      <p className="text-xs font-bold text-slate-700">Upload Chapter PDFs</p>
                      <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl/Cmd for multiple files</p>
                      <input type="file" accept="application/pdf" multiple onChange={handleMultipleFilesUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                    <div className="border border-slate-100 rounded-[28px] p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2" style={{ color: colors.primary }}><Database className="w-5 h-5"/></div>
                      <p className="text-xs font-bold text-slate-800">Fetch Saved Syllabus</p>
                      <p className="text-[10px] text-slate-500 mt-1 mb-3">Class {selectedClass} · {selectedSubject}</p>
                      <button onClick={handleFetchSyllabusFromFirebase} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                        className="px-5 py-3 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] disabled:opacity-60 hover:opacity-95">
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Database className="w-3.5 h-3.5"/>} Fetch Chapters
                      </button>
                    </div>
                  </div>

                  {uploadedFileNames.length>0 && (
                    <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-[28px] text-xs space-y-3 fade-in">
                      <p className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Selected {uploadedFileNames.length} File(s)</p>
                      <ul className="space-y-1">{uploadedFileNames.map((n,i)=>(
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600 font-semibold"><FileText className="w-3.5 h-3.5 shrink-0" style={{ color: colors.primary }}/>{n}</li>
                      ))}</ul>
                      <button onClick={handleExtractAndSaveSyllabus} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                        className="w-full mt-2 py-3 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-60 hover:opacity-95">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Process &amp; Save Chapters
                      </button>
                    </div>
                  )}

                  {chapters.length>0 && (
                    <div className="border border-slate-100 rounded-[28px] p-6 bg-white space-y-4 shadow-sm fade-in">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Chapters</h4>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{chapters.filter(c=>c.selected).length}/{chapters.length} selected</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>toggleSelectAllChapters(true)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full text-xs font-bold transition-all active:scale-[0.99]">Select All</button>
                          <button onClick={()=>toggleSelectAllChapters(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full text-xs font-bold transition-all active:scale-[0.99]">Deselect All</button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {chapters.map(ch=>(
                          <label key={ch.id} className={`flex items-start gap-3 p-4 border rounded-2xl text-xs cursor-pointer transition-all ${ch.selected?'border-slate-300 bg-slate-50/80 font-bold':'border-slate-100 bg-white opacity-60'}`}>
                            <input type="checkbox" checked={!!ch.selected} onChange={()=>toggleSingleChapter(ch.id)} className="sr-only"/>
                            {ch.selected ? <CheckSquare2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.primary }}/> : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5"/>}
                            <div>
                              <span className="text-slate-800">Ch {ch.chapterNo}: {ch.title}</span>
                              {ch.topics?.length>0 && <p className="text-[10px] text-slate-400 font-normal mt-0.5">{ch.topics.join(', ')}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {currentStep===2 && (
                <div className="space-y-4 fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Configuration</h3>
                      <h4 className="text-xs font-bold text-slate-800">Blueprint Settings</h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className={`flex items-center gap-1 px-4 py-2 rounded-full font-bold text-xs ${blueprintTotals.marks===maxMarks?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        <Calculator className="w-3.5 h-3.5"/> {blueprintTotals.marks} / {maxMarks} marks
                      </span>
                    </div>
                  </div>
                  {isOnlineQuiz && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2 font-semibold">
                      <Info className="w-4 h-4 shrink-0"/> Quiz mode only uses MCQ count. Other types are ignored.
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(BLUEPRINT_META).map(([key,meta])=>{
                      const Icon = meta.icon;
                      const disabled = isOnlineQuiz && key!=='mcq';
                      return (
                        <div key={key} className={`p-4 border rounded-[22px] flex items-center justify-between text-xs transition-all ${disabled?'bg-slate-50/30 border-slate-100 opacity-40':'bg-slate-50/60 border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm" style={{ color: colors.primary }}><Icon className="w-4 h-4"/></div>
                            <span className="font-bold text-slate-700 truncate">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center mb-1">Count</label>
                              <input type="number" disabled={disabled} className="w-16 px-3 py-2 border border-slate-200 rounded-full text-xs font-semibold bg-white text-center focus:outline-none focus:ring-2 disabled:bg-slate-100"
                                value={blueprint[key].count} onChange={e=>setBlueprint({...blueprint,[key]:{...blueprint[key],count:parseInt(e.target.value)||0}})}/>
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center mb-1">Marks/Q</label>
                              <input type="number" disabled={disabled} className="w-16 px-3 py-2 border border-slate-200 rounded-full text-xs font-semibold bg-white text-center focus:outline-none focus:ring-2 disabled:bg-slate-100"
                                value={blueprint[key].marksPerQuestion} onChange={e=>setBlueprint({...blueprint,[key]:{...blueprint[key],marksPerQuestion:parseInt(e.target.value)||0}})}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep===3 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-5 fade-in">
                  <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center" style={{ color: colors.primary }}>
                    <Sparkles className="w-8 h-8"/>
                  </div>
                  {!extractedText && chapters.length===0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 max-w-sm font-semibold">
                      ⚠️ No syllabus loaded. Go back to Step 1 and upload PDFs or fetch from Firebase.
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-600 max-w-sm">
                    Ready to draft {isOnlineQuiz ? blueprint.mcq.count+' MCQ' : blueprintTotals.questionCount+' questions'} from {chapters.filter(c=>c.selected).length} chapter(s).
                  </p>
                  <button onClick={handleTriggerAI} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                    className="px-8 py-4 text-white rounded-full text-xs font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center gap-2 hover:opacity-95">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                    {isProcessing ? 'Generating…' : 'Generate Questions'}
                  </button>
                </div>
              )}

              {/* STEP 4 */}
              {currentStep===4 && (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 fade-in">
                  {questions.map((q,idx)=>(
                    <div key={idx} className="p-5 border border-slate-100 rounded-[24px] bg-slate-50/50 space-y-2 text-xs hover:border-slate-200 transition-all shadow-sm">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">{q.type}</span>
                          {q.chapterSource && (
                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center gap-1 shadow-sm">
                              <BookMarked className="w-3 h-3" style={{ color: colors.primary }}/>{q.chapterSource}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black" style={{ color: colors.primary }}>{q.marks} {q.marks===1?'Mark':'Marks'}</span>
                      </div>
                      <div className="font-bold text-slate-800 pt-1">Q{idx+1}. {renderMathText(q.question)}</div>
                      {q.diagramSvg && <div className="my-2 p-3 border border-slate-200 rounded-2xl bg-white flex justify-center shadow-sm" dangerouslySetInnerHTML={{__html:q.diagramSvg}}/>}
                      {q.options && renderDynamicOptions(q.options, q.correctAnswer, true)}
                      {q.type==='MATCH_FOLLOWING' && q.matchPairs?.length>0 && (
                        <div className="grid grid-cols-2 gap-2 pl-4 pt-1 font-mono text-[11px]">
                          <div><p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-1">Column A</p>{q.matchPairs.map((p,i)=><p key={i} className="font-semibold text-slate-700">{i+1}. {p.left}</p>)}</div>
                          <div><p className="font-black uppercase tracking-widest text-[9px] text-slate-400 mb-1">Column B</p>{q.matchPairs.map((p,i)=><p key={i} className="font-semibold text-slate-700">({String.fromCharCode(97+i)}) {p.right}</p>)}</div>
                        </div>
                      )}
                      {q.correctAnswer && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/>
                          <div><strong>Answer:</strong> {q.correctAnswer} {q.explanation && <>· <span className="text-emerald-700 font-normal">{q.explanation}</span></>}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 5 */}
              {currentStep===5 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-5 fade-in">
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Database className="w-8 h-8"/>
                  </div>
                  <div className="space-y-3 text-center max-w-sm">
                    <p className="text-xs font-bold text-slate-600">Saving to Firestore:</p>
                    <code className="block bg-slate-50 border border-slate-200 p-4 rounded-[20px] text-[10px] text-left leading-relaxed text-slate-700 font-mono shadow-inner">
                      sessions<br/>
                      &nbsp;&nbsp;└─ {activeSession}<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ paper-creation<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ {isOnlineQuiz ? 'online_quiz' : 'exams'}<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ {selectedClass} <span className="text-slate-400">(class)</span><br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ {selectedSubject}<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ papers &gt; &#123;autoId&#125;
                    </code>
                    {isOnlineQuiz && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        This quiz will be saved as{' '}
                        <strong className={quizVisibleInApp ? 'text-emerald-600' : 'text-slate-600'}>
                          {quizVisibleInApp ? 'Visible' : 'Hidden'}
                        </strong>{' '}
                        in the student app. Student attempts will land under the paper's <code className="bg-slate-100 px-1 rounded text-[10px]">student_results</code> subcollection as students submit them.
                      </p>
                    )}
                  </div>
                  <button onClick={handleSavePaperToFirestore} style={{ backgroundColor: colors.primary }}
                    className="px-8 py-4 text-white rounded-full text-xs font-bold shadow-md transition-all active:scale-[0.99] flex items-center gap-2 hover:opacity-95">
                    <Database className="w-4 h-4"/> Save Paper to Firestore
                  </button>
                </div>
              )}

              {/* Nav footer */}
              <div className="border-t border-slate-100 pt-6 mt-auto flex justify-between items-center">
                <button onClick={()=>setCurrentStep(p=>Math.max(p-1,1))} disabled={currentStep===1}
                  className="px-5 py-3 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1.5 transition-all active:scale-[0.99]">
                  <ArrowLeft className="w-3.5 h-3.5"/> Previous
                </button>
                <button onClick={()=>setCurrentStep(p=>Math.min(p+1,5))} disabled={currentStep===5} style={{ backgroundColor: colors.primary }}
                  className="px-6 py-3 text-white rounded-full text-xs font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-40 flex items-center gap-1.5 hover:opacity-95">
                  Next <ArrowRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── Paper preview modal ── */}
      {selectedPaperForView && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden fade-in border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/80">
              <h3 className="font-bold text-sm text-slate-800 truncate pr-4">{selectedPaperForView.title}</h3>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-slate-100 p-1 rounded-full text-[11px] font-bold border border-slate-200">
                  <button onClick={()=>setPreviewMode('paper')}
                    className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${previewMode==='paper'?'bg-white shadow-sm text-slate-800':'text-slate-500'}`}>
                    <FileText className="w-3.5 h-3.5"/> Question Paper
                  </button>
                  <button onClick={()=>setPreviewMode('answers')}
                    className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${previewMode==='answers'?'bg-white shadow-sm text-slate-800':'text-slate-500'}`}>
                    <KeyRound className="w-3.5 h-3.5"/> Answer Key
                  </button>
                </div>
                <button onClick={()=>window.print()} style={{ backgroundColor: colors.primary }}
                  className="px-5 py-2.5 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] hover:opacity-95">
                  <Printer className="w-3.5 h-3.5"/> Print {previewMode==='answers' ? 'Answer Key' : 'Paper'}
                </button>
                <button onClick={()=>setSelectedPaperForView(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-4 h-4 text-slate-600"/>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 bg-slate-100 p-6">
              <div className="bg-white shadow-sm mx-auto max-w-2xl rounded-2xl p-6">
                <PrintablePaper paper={selectedPaperForView} renderMathText={renderMathText} renderDynamicOptions={renderDynamicOptions} showAnswers={previewMode==='answers'}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPaperForView && typeof document!=='undefined' && createPortal(
        <div id="print-portal-root">
          <PrintablePaper paper={selectedPaperForView} renderMathText={renderMathText} renderDynamicOptions={renderDynamicOptions} showAnswers={previewMode==='answers'}/>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Quiz Play Screen ─────────────────────────────────────────────────────────
function QuizPlayScreen({ quizPaper, mcqQs, currentQIdx, setCurrentQIdx, quizAnswers, setQuizAnswers, quizSubmitted, setQuizSubmitted, renderMathText, colors, onExit, onViewResults }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const q = mcqQs[currentQIdx];
  const totalQ = mcqQs.length;
  const answered = Object.keys(quizAnswers).length;
  const score = mcqQs.reduce((s,q) => quizAnswers[q.id]===q.correctAnswer ? s+(q.marks||1) : s, 0);
  const totalMarks = mcqQs.reduce((s,q)=>s+(q.marks||1),0);
  const percent = Math.round((score/totalMarks)*100);

  if (quizSubmitted) {
    return (
      <div style={{ backgroundColor: colors.background }} className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="rounded-[28px] border border-slate-100 shadow-xl max-w-md w-full p-8 text-center space-y-6 bg-white">
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto shadow-lg text-white" style={{ backgroundColor: colors.primary }}>
            <Trophy className="w-10 h-10"/>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Quiz Complete!</h2>
          <div className="text-5xl font-black tracking-tight" style={{ color: colors.primary }}>{percent}%</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
              <p className="text-2xl font-black text-emerald-600">{mcqQs.filter(q=>quizAnswers[q.id]===q.correctAnswer).length}</p>
              <p className="text-emerald-700 font-bold uppercase tracking-wider text-[9px] mt-1">Correct</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
              <p className="text-2xl font-black text-red-500">{mcqQs.filter(q=>quizAnswers[q.id] && quizAnswers[q.id]!==q.correctAnswer).length}</p>
              <p className="text-red-600 font-bold uppercase tracking-wider text-[9px] mt-1">Wrong</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <p className="text-2xl font-black text-slate-600">{mcqQs.filter(q=>!quizAnswers[q.id]).length}</p>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mt-1">Skipped</p>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700">{score} / {totalMarks} Marks</p>
          <div className="flex flex-col gap-3">
            <button onClick={onViewResults} style={{ backgroundColor: colors.primary }}
              className="w-full py-3 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] hover:opacity-95">
              <Trophy className="w-4 h-4"/> View Full Leaderboard
            </button>
            <button onClick={onExit}
              className="w-full py-3 border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 transition-all active:scale-[0.99]">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.background }} className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-4 h-4 text-slate-500"/></button>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800 truncate">{quizPaper.title}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Class {quizPaper.class} · {quizPaper.subject}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-bold border border-slate-200">{answered}/{totalQ} answered</span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-100">{score} pts</span>
        </div>
      </div>

      <div className="h-1 bg-slate-200">
        <div className="h-full transition-all" style={{width:`${((currentQIdx+1)/totalQ)*100}%`, backgroundColor: colors.primary}}/>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="rounded-[28px] border border-slate-100 shadow-xl max-w-xl w-full p-6 sm:p-8 space-y-6 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Q{currentQIdx+1} of {totalQ}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{q.marks} {q.marks===1?'mark':'marks'}</span>
          </div>

          {q.chapterSource && (
            <p className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 w-fit">
              <BookMarked className="w-3 h-3" style={{ color: colors.primary }}/>{q.chapterSource}
            </p>
          )}

          <p className="text-sm font-bold text-slate-800 leading-relaxed">{renderMathText(q.question)}</p>

          <div className="space-y-3">
            {q.options?.map((opt, idx)=>{
              const isSelected = quizAnswers[q.id]===opt;
              return (
                <button key={idx} onClick={()=>setQuizAnswers(a=>({...a,[q.id]:opt}))}
                  className={`w-full text-left p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 transition-all ${isSelected ? 'border-slate-800 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <span className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0 ${isSelected?'text-white':'border-slate-200 text-slate-400'}`} style={{ backgroundColor: isSelected ? colors.primary : 'transparent', borderColor: isSelected ? colors.primary : undefined }}>
                    {String.fromCharCode(65+idx)}
                  </span>
                  <span className="text-slate-700">{renderMathText(opt)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button onClick={()=>{setCurrentQIdx(i=>Math.max(i-1,0));setShowExplanation(false);}} disabled={currentQIdx===0}
              className="px-5 py-3 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1.5 transition-all active:scale-[0.99]">
              <ArrowLeft className="w-3.5 h-3.5"/> Prev
            </button>
            {currentQIdx < totalQ-1 ? (
              <button onClick={()=>{setCurrentQIdx(i=>i+1);setShowExplanation(false);}} style={{ backgroundColor: colors.primary }}
                className="px-6 py-3 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] hover:opacity-95">
                Next <ArrowRight className="w-3.5 h-3.5"/>
              </button>
            ) : (
              <button onClick={()=>setQuizSubmitted(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99] hover:bg-emerald-700">
                <Check className="w-3.5 h-3.5"/> Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4">
        <div className="max-w-xl mx-auto flex flex-wrap gap-1.5 justify-center">
          {mcqQs.map((q2,i)=>(
            <button key={i} onClick={()=>{setCurrentQIdx(i);setShowExplanation(false);}}
              className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${i===currentQIdx?'text-white shadow-sm':quizAnswers[q2.id]?'bg-emerald-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} style={{ backgroundColor: i===currentQIdx ? colors.primary : undefined }}>
              {i+1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results / Leaderboard Screen ─────────────────────────────────────────────
function ResultsScreen({ quizPaper, studentAttempts, loadingAttempts, renderMathText, colors, onBack }) {
  const [expandedStudent, setExpandedStudent] = useState(null);
  const mcqQs = quizPaper.questions?.filter(q=>q.type==='MCQ') || [];
  const totalMarks = mcqQs.reduce((s,q)=>s+(q.marks||1),0);

  return (
    <div style={{ backgroundColor: colors.background }} className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="w-4 h-4 text-slate-500"/></button>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800">Results — {quizPaper.title}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Class {quizPaper.class} · {quizPaper.subject}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-bold border border-slate-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" style={{ color: colors.primary }}/> {studentAttempts.length} attempts
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
        {studentAttempts.length>0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Avg Score', value: `${Math.round(studentAttempts.reduce((s,a)=>s+a.score,0)/studentAttempts.length)}/${totalMarks}` },
              { label:'Top Score', value: `${Math.max(...studentAttempts.map(a=>a.score))}/${totalMarks}` },
              { label:'Total Students', value: studentAttempts.length },
            ].map(stat=>(
              <div key={stat.label} className="bg-white border border-slate-100 shadow-sm rounded-[24px] p-5 text-center">
                <p className="text-2xl font-black tracking-tight" style={{ color: colors.primary }}>{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-[28px] border border-slate-100 shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500"/>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Leaderboard</h3>
          </div>
          {loadingAttempts ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500 gap-2 font-semibold"><Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }}/> Loading attempts…</div>
          ) : studentAttempts.length===0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">No student attempts yet. Once students take this quiz in the app, results will appear here.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {studentAttempts.map((attempt,idx)=>{
                const pct = Math.round((attempt.score/totalMarks)*100);
                const isExpanded = expandedStudent===attempt.id;
                const medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':null;
                return (
                  <div key={attempt.id}>
                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={()=>setExpandedStudent(isExpanded?null:attempt.id)}>
                      <div className="w-8 text-center">
                        {medal ? <span className="text-lg">{medal}</span> : <span className="text-xs font-black text-slate-400">#{idx+1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{attempt.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Roll {attempt.rollNo} · {attempt.timeTaken}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs shrink-0">
                        <span className="text-emerald-600 font-bold">{attempt.correctCount} ✓</span>
                        <span className="text-red-500 font-bold">{attempt.incorrectCount} ✗</span>
                        <span className="font-black text-slate-800">{attempt.score}/{totalMarks}</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full" style={{width:`${pct}%`, backgroundColor: colors.primary}}/>
                        </div>
                        <span className="font-bold text-slate-700">{pct}%</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 bg-slate-50/50 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-4 mb-3">Answer Breakdown</p>
                        <div className="space-y-2">
                          {mcqQs.map((q,i)=>{
                            const given = attempt.answers?.[q.id];
                            const isCorrect = given===q.correctAnswer;
                            return (
                              <div key={i} className={`p-3.5 rounded-2xl border text-xs font-semibold ${isCorrect?'bg-emerald-50/60 border-emerald-200 text-emerald-900':'bg-red-50/60 border-red-200 text-red-900'}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <span>Q{i+1}: {renderMathText(q.question)}</span>
                                  {isCorrect ? <Check className="w-4 h-4 text-emerald-600 shrink-0"/> : <X className="w-4 h-4 text-red-500 shrink-0"/>}
                                </div>
                                <div className="mt-2 flex gap-4 text-[11px]">
                                  <span>Answered: <strong>{given||'—'}</strong></span>
                                  {!isCorrect && <span>Correct: <strong>{q.correctAnswer}</strong></span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PrintablePaper ────────────────────────────────────────────────────────────
function PrintablePaper({ paper, renderMathText, renderDynamicOptions, showAnswers }) {
  if (!paper) return null;

  if (showAnswers) {
    return (
      <div className="p-4 font-serif text-black bg-white">
        <div className="print-header text-center relative space-y-0.5">
          <img src={SCHOOL_CONFIG.logoUrl} alt="Logo" className="w-12 h-12 object-contain absolute left-0 top-0" onError={e=>{e.target.style.display='none'}}/>
          <h1 className="font-bold text-lg uppercase tracking-wide leading-tight">{SCHOOL_CONFIG.name}</h1>
          <p className="text-[10px] uppercase font-semibold text-slate-700">{SCHOOL_CONFIG.subtext}</p>
          <h2 className="font-bold text-xs mt-0.5">{paper.title} — Answer Key</h2>
          <div className="flex justify-between items-center text-[11px] font-bold pt-1 border-t mt-1">
            <span>Class: {paper.class}</span>
            <span>Subject: {paper.subject}</span>
            <span>Max Marks: {paper.maxMarks||50}</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {paper.questions?.map((q,i)=>(
            <div key={i} className="print-question-block flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-1.5">
              <span className="font-semibold text-slate-800 flex-1">Q{i+1}. {renderMathText(q.question)}</span>
              <span className="font-bold text-emerald-700 whitespace-nowrap">{q.correctAnswer || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-serif text-black bg-white">
      <div className="print-header text-center relative space-y-0.5">
        <img src={SCHOOL_CONFIG.logoUrl} alt="Logo" className="w-12 h-12 object-contain absolute left-0 top-0" onError={e=>{e.target.style.display='none'}}/>
        <h1 className="font-bold text-lg uppercase tracking-wide leading-tight">{SCHOOL_CONFIG.name}</h1>
        <p className="text-[10px] uppercase font-semibold text-slate-700">{SCHOOL_CONFIG.subtext}</p>
        <h2 className="font-bold text-xs mt-0.5">{paper.title}</h2>
        <div className="flex justify-between items-center text-[11px] font-bold pt-1 border-t mt-1">
          <span>Class: {paper.class}</span>
          <span>Subject: {paper.subject}</span>
          <span>Time: {paper.timeAllowed||'2 Hours'}</span>
          <span>Max Marks: {paper.maxMarks||50}</span>
        </div>
      </div>
      <div className="text-[10px] space-y-0.5 border-b pb-1 mb-2">
        <p className="font-bold">General Instructions:</p>
        <p>1. All questions are compulsory.</p>
        <p>2. Figures to the right indicate full marks.</p>
      </div>
      <div className="space-y-2">
        {paper.questions?.map((q,i)=>(
          <div key={i} className="print-question-block text-xs space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>Q{i+1}. {renderMathText(q.question)}</span>
              <span className="whitespace-nowrap pl-2">[{q.marks} {q.marks===1?'Mark':'Marks'}]</span>
            </div>
            {q.diagramSvg && <div className="my-1 flex justify-center" dangerouslySetInnerHTML={{__html:q.diagramSvg}}/>}
            {q.options && renderDynamicOptions(q.options, null, false)}
            {q.type==='MATCH_FOLLOWING' && q.matchPairs?.length>0 && (
              <div className="grid grid-cols-2 gap-2 pl-4 pt-0.5 font-mono text-[10px]">
                <div><p className="font-bold underline">Column A</p>{q.matchPairs.map((p,j)=><p key={j}>{j+1}. {p.left}</p>)}</div>
                <div><p className="font-bold underline">Column B</p>{q.matchPairs.map((p,j)=><p key={j}>({String.fromCharCode(97+j)}) {p.right}</p>)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}