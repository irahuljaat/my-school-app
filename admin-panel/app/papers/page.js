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
const FALLBACK_SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Sanskrit'];

const STEPS = [
  { id: 1, label: 'Setup', hint: 'Class, books & syllabus', icon: GraduationCap },
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

// ─── Gemini API helpers ───────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-3.5-flash';

const getGeminiErrorMessage = (data, fallback = 'Gemini returned an unknown error.') => {
  if (data?.error?.message) {
    const status = data.error.status ? ` (${data.error.status})` : '';
    return `${data.error.message}${status}`;
  }
  if (data?.promptFeedback?.blockReason) {
    return `Gemini blocked the request: ${data.promptFeedback.blockReason}`;
  }
  if (!Array.isArray(data?.candidates) || data.candidates.length === 0) {
    return fallback;
  }
  const candidate = data.candidates[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    return `Gemini stopped generation: ${candidate.finishReason}`;
  }
  return fallback;
};

const extractGeminiText = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Gemini returned an empty response.');
  }
  if (data.error) {
    throw new Error(getGeminiErrorMessage(data));
  }
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  if (!candidates.length) {
    throw new Error(getGeminiErrorMessage(data, 'Gemini returned no candidates.'));
  }
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new Error(getGeminiErrorMessage(data, 'Gemini returned no content parts.'));
  }
  const resultText = parts
    .filter(part => typeof part?.text === 'string')
    .map(part => part.text)
    .join('\n')
    .trim();
  if (!resultText) {
    throw new Error(getGeminiErrorMessage(data, 'Gemini returned an empty text response.'));
  }
  return resultText;
};

const parseGeminiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Gemini returned empty JSON text.');
  }
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const firstObject = cleaned.indexOf('{');
    const lastObject = cleaned.lastIndexOf('}');
    const firstArray = cleaned.indexOf('[');
    const lastArray = cleaned.lastIndexOf(']');
    const candidates = [];
    if (firstObject >= 0 && lastObject > firstObject) {
      candidates.push(cleaned.slice(firstObject, lastObject + 1));
    }
    if (firstArray >= 0 && lastArray > firstArray) {
      candidates.push(cleaned.slice(firstArray, lastArray + 1));
    }
    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch (_) {}
    }
    throw new Error(`Gemini returned invalid JSON: ${firstError.message}`);
  }
};

const callGeminiGenerateContent = async ({
  apiKey,
  parts,
  responseMimeType = 'text/plain'
}) => {
  if (!apiKey?.trim()) {
    throw new Error('Missing Gemini API Key. Add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType }
      })
    }
  );
  let data;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error(`Gemini returned a non-JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok || data?.error) {
    throw new Error(getGeminiErrorMessage(data, `Gemini request failed with HTTP ${response.status}.`));
  }
  return data;
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

  // Dynamic Subjects & Books state[cite: 2]
  const [availableSubjects, setAvailableSubjects] = useState(FALLBACK_SUBJECTS);
  const [books, setBooks]                   = useState([{ id: 'default_book', name: 'Textbook 1', selected: true }]);
  const [newBookName, setNewBookName]       = useState('');

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

  // Fetch active session and dynamic subjects when class changes[cite: 2]
  useEffect(() => {
    fetchActiveSessionAndPapers();
  }, [isOnlineQuiz, filterClass]);

  useEffect(() => {
    fetchSubjectsForClass(selectedClass);
  }, [activeSession, selectedClass]);

  const fetchSubjectsForClass = async (cls) => {
    try {
      const settingsSnap = await getDoc(doc(db, 'config', 'settings'));
      const session = (settingsSnap.exists() && settingsSnap.data().activeSession)
        ? settingsSnap.data().activeSession
        : activeSession;
      setActiveSession(session);

      // Fetch assignedSubjects from sessions -> {activeSession} -> subjects -> {cls}[cite: 2]
      const subjDocRef = doc(db, 'sessions', session, 'subjects', cls);
      const subjSnap = await getDoc(subjDocRef);
      if (subjSnap.exists() && Array.isArray(subjSnap.data().assignedSubjects) && subjSnap.data().assignedSubjects.length > 0) {
        const fetchedSubjs = subjSnap.data().assignedSubjects;
        setAvailableSubjects(fetchedSubjs);
        if (!fetchedSubjs.includes(selectedSubject)) {
          setSelectedSubject(fetchedSubjs[0]);
        }
      } else {
        setAvailableSubjects(FALLBACK_SUBJECTS);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAvailableSubjects(FALLBACK_SUBJECTS);
    }
  };

  const startNewPaper = () => {
    setView('generator');
    setCurrentStep(1);
    setQuizVisibleInApp(false);
  };

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
        for (const subj of availableSubjects) {
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

  // ── Multi-Book Management Functions ────────────────────────────────────────
  const handleAddBook = () => {
    if (!newBookName.trim()) return;
    const newBook = {
      id: `book_${Date.now()}`,
      name: newBookName.trim(),
      selected: true
    };
    setBooks(prev => [...prev, newBook]);
    setNewBookName('');
  };

  const toggleBookSelection = (bookId) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, selected: !b.selected } : b));
  };

  const toggleSelectAllBooks = (selectState) => {
    setBooks(prev => prev.map(b => ({ ...b, selected: selectState })));
  };

  const deleteBook = (bookId) => {
    if (books.length <= 1) {
      setError('You must have at least one book.');
      return;
    }
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  // ── PDF handling ───────────────────────────────────────────────────────────
  const handleMultipleFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const pdfFiles = files.filter(
      file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    if (!pdfFiles.length) {
      setError('Please select PDF files only.');
      return;
    }
    setError(null);
    Promise.all(
      pdfFiles.map(
        file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = String(reader.result || '');
              const commaIndex = result.indexOf(',');
              if (commaIndex === -1) {
                reject(new Error(`Could not read ${file.name}.`));
                return;
              }
              resolve({ name: file.name, data: result.slice(commaIndex + 1) });
            };
            reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
            reader.readAsDataURL(file);
          })
      )
    )
      .then(results => {
        setPdfBase64List(results.map(r => r.data));
        setUploadedFileNames(results.map(r => r.name));
        setChapters([]);
        setExtractedText('');
      })
      .catch(err => {
        setError(`File read error: ${err.message}`);
        setPdfBase64List([]);
        setUploadedFileNames([]);
      });
  };

  // ── Extract syllabus from PDFs ─────────────────────────────────────────────
  const handleExtractAndSaveSyllabus = async () => {
    if (!apiKey) {
      setError('Missing Gemini API Key.');
      return;
    }
    if (!pdfBase64List.length) {
      setError('Upload at least one PDF.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const promptText = `Extract all chapters, sub-topics, and useful raw text from the provided PDF files.
Return ONLY valid JSON in exactly this structure:
{
  "chapters": [
    {
      "chapterNo": 1,
      "title": "Chapter title",
      "topics": ["Topic 1", "Topic 2"]
    }
  ],
  "extractedText": "full useful extracted syllabus text"
}
Return JSON only.`;

      const parts = [];
      pdfBase64List.forEach(base64 => {
        if (!base64 || typeof base64 !== 'string') return;
        parts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } });
      });
      parts.push({ text: promptText });

      const data = await callGeminiGenerateContent({ apiKey, parts, responseMimeType: 'application/json' });
      const rawText = extractGeminiText(data);
      const result = parseGeminiJson(rawText);

      const rawChapters = Array.isArray(result.chapters) ? result.chapters : [];
      const formatted = rawChapters.map((ch, i) => ({
        chapterNo: ch.chapterNo ?? i + 1,
        title: String(ch.title || `Chapter ${i + 1}`),
        topics: Array.isArray(ch.topics) ? ch.topics.map(t => String(t)).filter(Boolean) : [],
        id: `ch_${i}`,
        selected: true
      }));

      const normalizedExtractedText = typeof result.extractedText === 'string' ? result.extractedText.trim() : '';
      setChapters(formatted);
      setExtractedText(normalizedExtractedText || formatted.map(c => `Chapter ${c.chapterNo}: ${c.title}\n${c.topics.join(', ')}`).join('\n\n'));

      const docId = `${selectedClass}_${selectedSubject}`;
      await setDoc(doc(db, 'sessions', activeSession, 'syllabus', docId), {
        chapters: formatted,
        books,
        extractedText: normalizedExtractedText,
        updatedAt: new Date().toISOString()
      });

      alert(`Saved ${formatted.length} chapter(s) to Firebase!`);
    } catch (err) {
      setError(`Extraction error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchSyllabusFromFirebase = async () => {
    setIsProcessing(true); setError(null);
    try {
      const docId = `${selectedClass}_${selectedSubject}`;
      const snap = await getDoc(doc(db, 'sessions', activeSession, 'syllabus', docId));
      if (snap.exists()) {
        const data = snap.data();
        const loaded = (data.chapters || []).map(ch => ({ ...ch, selected: true }));
        setChapters(loaded);
        if (data.books && Array.isArray(data.books)) {
          setBooks(data.books);
        }
        setExtractedText(data.extractedText || loaded.map(c => `Chapter ${c.chapterNo}: ${c.title}\n${(c.topics || []).join(', ')}`).join('\n\n'));
        alert(`Loaded ${loaded.length} chapters for Class ${selectedClass} · ${selectedSubject}`);
      } else {
        setError(`No syllabus found for Class ${selectedClass} - ${selectedSubject}.`);
      }
    } catch (err) { setError('Firebase error: ' + err.message); }
    finally { setIsProcessing(false); }
  };

  const toggleSelectAllChapters = s => setChapters(p => p.map(ch => ({ ...ch, selected: s })));
  const toggleSingleChapter = id => setChapters(p => p.map(ch => ch.id === id ? { ...ch, selected: !ch.selected } : ch));

  // ── AI Question Generation ───────────────────────────────────────────────
  const handleTriggerAI = async () => {
    if (!apiKey) return setError('Gemini API Key missing.');
    const selectedChapters = chapters.filter(c => c.selected);
    const selectedBooksList = books.filter(b => b.selected);

    if (!selectedChapters.length) return setError('Select at least one chapter.');
    if (!selectedBooksList.length) return setError('Select at least one book to generate paper from.');
    if (!extractedText && !selectedChapters.length) return setError('No syllabus content found.');
    setIsProcessing(true); setError(null);

    const bp = isOnlineQuiz
      ? { ...blueprint, trueFalse:{count:0,marksPerQuestion:1}, tickCorrect:{count:0,marksPerQuestion:1},
          matchFollowing:{count:0,marksPerQuestion:4}, veryShort:{count:0,marksPerQuestion:2},
          short:{count:0,marksPerQuestion:3}, long:{count:0,marksPerQuestion:5}, diagramBased:{count:0,marksPerQuestion:4} }
      : blueprint;

    const promptText = `
Generate an exam paper strictly from these SELECTED BOOKS: ${JSON.stringify(selectedBooksList.map(b => b.name))}
And SELECTED CHAPTERS:
${JSON.stringify(selectedChapters, null, 2)}

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
- Diagram Based: ${bp.diagramBased.count} questions (${bp.diagramBased.marksPerQuestion} marks each)` : ''}

IMPORTANT: For every question add "chapterSource" and "bookSource".
Use LaTeX for math: $formula$.

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
  "chapterSource": "Chapter 1",
  "bookSource": "Textbook 1"
}]`;

    try {
      const data = await callGeminiGenerateContent({ apiKey, parts: [{ text: promptText }], responseMimeType: 'application/json' });
      const rawText = extractGeminiText(data);
      const parsed = parseGeminiJson(rawText);

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini returned valid JSON, but it was not a question array.');
      }

      setQuestions(parsed);
      setCurrentStep(4);
    } catch (err) {
      setError(`Generation error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
        booksUsed:   books.filter(b => b.selected).map(b => b.name),
        totalQuestions: questions.length,
        createdAt:   new Date().toISOString(),
      };

      const docRef = await addDoc(papersRef, paperPayload);
      alert(`✅ Exam paper / Quiz saved successfully!`);
      fetchActiveSessionAndPapers();
      setView('dashboard');
      setCurrentStep(1);
    } catch (err) { alert('Save error: ' + err.message); }
  };

  const toggleQuizVisibility = async (paper) => {
    try {
      const session = paper.session || activeSession;
      const paperDocRef = doc(db, 'sessions', session, 'paper-creation', 'online_quiz', paper.class, paper.subject, 'papers', paper.id);
      await updateDoc(paperDocRef, { visibleInApp: !paper.visibleInApp });
      fetchActiveSessionAndPapers();
    } catch (err) { alert('Error updating visibility: ' + err.message); }
  };

  const loadStudentAttempts = async (paper) => {
    setLoadingAttempts(true);
    try {
      const session = paper.session || activeSession;
      const resultsRef = collection(db, 'sessions', session, 'paper-creation', 'online_quiz', paper.class, paper.subject, 'papers', paper.id, 'student_results');
      const snap = await getDocs(query(resultsRef, orderBy('score', 'desc')));
      setStudentAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      <header className="no-print sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/70 px-5 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
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
                <p className="text-[11px] text-slate-500 mt-1">Subjects dynamically retrieved from <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">sessions / {activeSession} / subjects / &#123;class&#125;</code>[cite: 2]</p>
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
                        <th className="p-4 md:p-6">Books Used</th>
                        <th className="p-4 md:p-6">Max Marks</th>
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
                          <td className="p-4 md:p-6 text-slate-500 font-medium">
                            {paper.booksUsed ? paper.booksUsed.join(', ') : 'All Books'}
                          </td>
                          <td className="p-4 md:p-6 font-mono font-bold text-slate-700">{paper.maxMarks||50}</td>
                          <td className="p-4 md:p-6 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={()=>{setSelectedPaperForView(paper); setPreviewMode('paper');}}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full text-xs font-bold flex items-center gap-1 transition-all">
                                <Eye className="w-3.5 h-3.5"/> View/Print
                              </button>
                              {isOnlineQuiz && (
                                <>
                                  <button onClick={()=>toggleQuizVisibility(paper)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 ${paper.visibleInApp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {paper.visibleInApp ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                                    {paper.visibleInApp ? 'Visible' : 'Hidden'}
                                  </button>
                                  <button onClick={()=>{ setQuizPaper(paper); setQuizMode('play'); setQuizAnswers({}); setQuizSubmitted(false); setCurrentQIdx(0); }}
                                    className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>
                                    Take Quiz
                                  </button>
                                  <button onClick={()=>{ setQuizPaper(paper); setQuizMode('results'); loadStudentAttempts(paper); }}
                                    className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                                    Results
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 text-white`} style={{ backgroundColor: isActive || isDone ? colors.primary : '#cbd5e1' }}>
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

            <div className="rounded-[28px] border border-slate-100 shadow-sm p-6 md:p-8 bg-white flex-1 flex flex-col min-w-0">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0"/><span>{error}</span>
                </div>
              )}

              {/* STEP 1: Setup, Dynamic Subjects & Multi-Book Support[cite: 2] */}
              {currentStep===1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/70 p-6 rounded-[28px] border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Class</label>
                      <select className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
                        {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject (from DB)[cite: 2]</label>
                      <select className="w-full px-5 py-3 border border-slate-200 rounded-full bg-white text-xs font-semibold focus:outline-none focus:ring-2" value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}>
                        {availableSubjects.map(s=><option key={s} value={s}>{s}</option>)}
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
                  </div>

                  {/* Multi-Book Management Option[cite: 2] */}
                  <div className="border border-slate-200 rounded-[24px] p-5 bg-white space-y-4 shadow-sm">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Subject Books Management[cite: 2]</h4>
                        <p className="text-[11px] text-slate-500">Add multiple books for this subject and select which book(s) to include in the paper[cite: 2].</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button onClick={()=>toggleSelectAllBooks(true)} className="px-3 py-1.5 bg-slate-100 rounded-full font-bold text-slate-600">Select All</button>
                        <button onClick={()=>toggleSelectAllBooks(false)} className="px-3 py-1.5 bg-slate-100 rounded-full font-bold text-slate-600">Deselect All</button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add new book name (e.g. Part 2, Grammar Book)..." 
                        value={newBookName} 
                        onChange={e=>setNewBookName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2"
                      />
                      <button onClick={handleAddBook} style={{ backgroundColor: colors.primary }} className="px-5 py-2 text-white rounded-full text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5"/> Add Book
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2">
                      {books.map(b=>(
                        <div key={b.id} className={`flex items-center justify-between p-3 border rounded-2xl text-xs ${b.selected ? 'border-slate-300 bg-slate-50 font-bold' : 'border-slate-100 bg-white opacity-60'}`}>
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input type="checkbox" checked={b.selected} onChange={()=>toggleBookSelection(b.id)} className="sr-only"/>
                            {b.selected ? <CheckSquare2 className="w-4 h-4" style={{ color: colors.primary }}/> : <Square className="w-4 h-4 text-slate-300"/>}
                            <span className="text-slate-800">{b.name}</span>
                          </label>
                          <button onClick={()=>deleteBook(b.id)} className="text-slate-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="group border-2 border-dashed border-slate-200 rounded-[28px] p-6 text-center bg-slate-50/50 relative flex flex-col items-center justify-center hover:border-slate-300 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2" style={{ color: colors.primary }}><Upload className="w-5 h-5"/></div>
                      <p className="text-xs font-bold text-slate-700">Upload Chapter PDFs</p>
                      <input type="file" accept="application/pdf" multiple onChange={handleMultipleFilesUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                    <div className="border border-slate-100 rounded-[28px] p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2" style={{ color: colors.primary }}><Database className="w-5 h-5"/></div>
                      <p className="text-xs font-bold text-slate-800">Fetch Saved Syllabus</p>
                      <button onClick={handleFetchSyllabusFromFirebase} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                        className="mt-3 px-5 py-3 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Database className="w-3.5 h-3.5"/>} Fetch Chapters
                      </button>
                    </div>
                  </div>

                  {uploadedFileNames.length>0 && (
                    <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-[28px] text-xs space-y-3">
                      <p className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Selected {uploadedFileNames.length} File(s)</p>
                      <button onClick={handleExtractAndSaveSyllabus} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                        className="w-full mt-2 py-3 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Process &amp; Save Chapters
                      </button>
                    </div>
                  )}

                  {chapters.length>0 && (
                    <div className="border border-slate-100 rounded-[28px] p-6 bg-white space-y-4 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Chapters</h4>
                        <div className="flex gap-2">
                          <button onClick={()=>toggleSelectAllChapters(true)} className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold">Select All</button>
                          <button onClick={()=>toggleSelectAllChapters(false)} className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold">Deselect All</button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {chapters.map(ch=>(
                          <label key={ch.id} className={`flex items-start gap-3 p-4 border rounded-2xl text-xs cursor-pointer ${ch.selected?'border-slate-300 bg-slate-50 font-bold':'border-slate-100 bg-white opacity-60'}`}>
                            <input type="checkbox" checked={!!ch.selected} onChange={()=>toggleSingleChapter(ch.id)} className="sr-only"/>
                            {ch.selected ? <CheckSquare2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.primary }}/> : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5"/>}
                            <div>
                              <span className="text-slate-800">Ch {ch.chapterNo}: {ch.title}</span>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Configuration</h3>
                      <h4 className="text-xs font-bold text-slate-800">Blueprint Settings</h4>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-bold text-xs ${blueprintTotals.marks===maxMarks?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {blueprintTotals.marks} / {maxMarks} marks
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(BLUEPRINT_META).map(([key,meta])=>{
                      const Icon = meta.icon;
                      return (
                        <div key={key} className="p-4 border rounded-[22px] flex items-center justify-between text-xs bg-slate-50/60 border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm" style={{ color: colors.primary }}><Icon className="w-4 h-4"/></div>
                            <span className="font-bold text-slate-700 truncate">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center mb-1">Count</label>
                              <input type="number" className="w-16 px-3 py-2 border border-slate-200 rounded-full text-xs font-semibold bg-white text-center"
                                value={blueprint[key].count} onChange={e=>setBlueprint({...blueprint,[key]:{...blueprint[key],count:parseInt(e.target.value)||0}})}/>
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center mb-1">Marks/Q</label>
                              <input type="number" className="w-16 px-3 py-2 border border-slate-200 rounded-full text-xs font-semibold bg-white text-center"
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
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-5">
                  <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center" style={{ color: colors.primary }}>
                    <Sparkles className="w-8 h-8"/>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 max-w-sm">
                    Ready to draft questions from selected books ({books.filter(b=>b.selected).map(b=>b.name).join(', ')}) and chapters.
                  </p>
                  <button onClick={handleTriggerAI} disabled={isProcessing} style={{ backgroundColor: colors.primary }}
                    className="px-8 py-4 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-2">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                    {isProcessing ? 'Generating…' : 'Generate Questions'}
                  </button>
                </div>
              )}

              {/* STEP 4 */}
              {currentStep===4 && (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                  {questions.map((q,idx)=>(
                    <div key={idx} className="p-5 border border-slate-100 rounded-[24px] bg-slate-50/50 space-y-2 text-xs shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700">{q.type}</span>
                          {q.bookSource && <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-700">📚 {q.bookSource}</span>}
                          {q.chapterSource && <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">{q.chapterSource}</span>}
                        </div>
                        <span className="text-xs font-black" style={{ color: colors.primary }}>{q.marks} Marks</span>
                      </div>
                      <div className="font-bold text-slate-800 pt-1">Q{idx+1}. {renderMathText(q.question)}</div>
                      {q.options && renderDynamicOptions(q.options, q.correctAnswer, true)}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 5 */}
              {currentStep===5 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-5">
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Database className="w-8 h-8"/>
                  </div>
                  <button onClick={handleSavePaperToFirestore} style={{ backgroundColor: colors.primary }}
                    className="px-8 py-4 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-2">
                    <Database className="w-4 h-4"/> Save Paper to Firestore
                  </button>
                </div>
              )}

              {/* Nav footer */}
              <div className="border-t border-slate-100 pt-6 mt-auto flex justify-between items-center">
                <button onClick={()=>setCurrentStep(p=>Math.max(p-1,1))} disabled={currentStep===1}
                  className="px-5 py-3 border border-slate-200 rounded-full text-xs font-bold text-slate-600">
                  <ArrowLeft className="w-3.5 h-3.5"/> Previous
                </button>
                <button onClick={()=>setCurrentStep(p=>Math.min(p+1,5))} disabled={currentStep===5} style={{ backgroundColor: colors.primary }}
                  className="px-6 py-3 text-white rounded-full text-xs font-bold shadow-md">
                  Next <ArrowRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Preview Modal */}
      {selectedPaperForView && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="font-bold text-sm text-slate-800">{selectedPaperForView.title}</h3>
              <div className="flex items-center gap-3">
                <button onClick={()=>window.print()} style={{ backgroundColor: colors.primary }} className="px-5 py-2.5 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <Printer className="w-3.5 h-3.5"/> Print
                </button>
                <button onClick={()=>setSelectedPaperForView(null)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-4 h-4"/></button>
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
    </div>
  );
}

function QuizPlayScreen({ quizPaper, mcqQs, currentQIdx, setCurrentQIdx, quizAnswers, setQuizAnswers, quizSubmitted, setQuizSubmitted, renderMathText, colors, onExit, onViewResults }) {
  return <div />;
}
function ResultsScreen({ quizPaper, studentAttempts, loadingAttempts, renderMathText, colors, onBack }) {
  return <div />;
}
function PrintablePaper({ paper, renderMathText, renderDynamicOptions, showAnswers }) {
  return (
    <div className="p-4 font-serif text-black bg-white">
      <div className="print-header text-center relative space-y-0.5">
        <h1 className="font-bold text-lg uppercase tracking-wide leading-tight">{SCHOOL_CONFIG.name}</h1>
        <h2 className="font-bold text-xs mt-0.5">{paper.title}</h2>
        {paper.booksUsed && <p className="text-[10px] text-slate-600">Books: {paper.booksUsed.join(', ')}</p>}
      </div>
      <div className="space-y-2 mt-4">
        {paper.questions?.map((q,i)=>(
          <div key={i} className="text-xs space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>Q{i+1}. {renderMathText(q.question)}</span>
              <span>[{q.marks} Marks]</span>
            </div>
            {q.options && renderDynamicOptions(q.options, null, false)}
          </div>
        ))}
      </div>
    </div>
  );
}