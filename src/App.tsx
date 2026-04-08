/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ClipboardCheck, 
  User, 
  Calendar, 
  Activity, 
  BarChart3, 
  AlertCircle,
  Info,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  FileJson,
  FileDown,
  Stethoscope,
  Clock,
  MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// --- Types ---

interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  profession: string;
  painLocation: string;
  painSince: string;
  painTriggers: string;
  painRelievers: string;
}

interface DescriptorOption {
  label: string;
  score: number;
}

interface Group {
  id: number;
  title: string;
  options: DescriptorOption[];
}

interface AssessmentData {
  patientInfo: PatientInfo;
  answers: Record<string, any>;
  metadata: {
    totalScore: number;
    timestamp: string;
    formattedDateTime: string;
    version: string;
  };
}

// --- Data ---

const DESCRIPTOR_GROUPS: Group[] = [
  { id: 1, title: '1 (temporal)', options: [{label: 'flickering', score: 1}, {label: 'quivering', score: 2}, {label: 'pulsing', score: 3}, {label: 'throbbing', score: 4}, {label: 'beating', score: 5}, {label: 'pounding', score: 6}] },
  { id: 2, title: '2 (spatial)', options: [{label: 'jumping', score: 1}, {label: 'flashing', score: 2}, {label: 'shooting', score: 3}] },
  { id: 3, title: '3 (punctate pressure)', options: [{label: 'pricking', score: 1}, {label: 'boring', score: 2}, {label: 'drilling', score: 3}, {label: 'stabbing', score: 4}, {label: 'lancinating', score: 5}] },
  { id: 4, title: '4 (incisive pressure)', options: [{label: 'sharp', score: 1}, {label: 'cutting', score: 2}, {label: 'lacerating', score: 3}] },
  { id: 5, title: '5 (constrictive pressure)', options: [{label: 'pinching', score: 1}, {label: 'pressing', score: 2}, {label: 'gnawing', score: 3}, {label: 'cramping', score: 4}, {label: 'crushing', score: 5}] },
  { id: 6, title: '6 (traction pressure)', options: [{label: 'tugging', score: 1}, {label: 'pulling', score: 2}, {label: 'wrenching', score: 3}] },
  { id: 7, title: '7 (thermal)', options: [{label: 'hot', score: 1}, {label: 'burning', score: 2}, {label: 'scalding', score: 3}, {label: 'searing', score: 4}] },
  { id: 8, title: '8 (brightness)', options: [{label: 'tingling', score: 1}, {label: 'itchy', score: 2}, {label: 'smarting', score: 3}, {label: 'stinging', score: 4}] },
  { id: 9, title: '9 (dullness)', options: [{label: 'dull', score: 1}, {label: 'sore', score: 2}, {label: 'hurting', score: 3}, {label: 'aching', score: 4}, {label: 'heavy', score: 5}] },
  { id: 10, title: '10 (sensory miscellaneous)', options: [{label: 'tender', score: 1}, {label: 'taut', score: 2}, {label: 'rasping', score: 3}, {label: 'splitting', score: 4}] },
  { id: 11, title: '11 (tension)', options: [{label: 'tiring', score: 1}, {label: 'exhausting', score: 2}] },
  { id: 12, title: '12 (autonomic)', options: [{label: 'sickening', score: 1}, {label: 'suffocating', score: 2}] },
  { id: 13, title: '13 (fear)', options: [{label: 'fearful', score: 1}, {label: 'frightful', score: 2}, {label: 'terrifying', score: 3}] },
  { id: 14, title: '14 (punishment)', options: [{label: 'punishing', score: 1}, {label: 'gruelling', score: 2}, {label: 'cruel', score: 3}, {label: 'vicious', score: 4}, {label: 'killing', score: 5}] },
  { id: 15, title: '15 (affective-evaluative-sensory)', options: [{label: 'wretched', score: 1}, {label: 'blinding', score: 2}] },
  { id: 16, title: '16 (evaluative)', options: [{label: 'annoying', score: 1}, {label: 'troublesome', score: 2}, {label: 'miserable', score: 3}, {label: 'intense', score: 4}, {label: 'unbearable', score: 5}] },
  { id: 17, title: '17 (sensory: miscellaneous)', options: [{label: 'spreading', score: 1}, {label: 'radiating', score: 2}, {label: 'penetrating', score: 3}, {label: 'piercing', score: 4}] },
  { id: 18, title: '18 (sensory: miscellaneous)', options: [{label: 'tight', score: 1}, {label: 'numb', score: 2}, {label: 'drawing', score: 3}, {label: 'squeezing', score: 4}, {label: 'tearing', score: 5}] },
  { id: 19, title: '19 (sensory)', options: [{label: 'cool', score: 1}, {label: 'cold', score: 2}, {label: 'freezing', score: 3}] },
  { id: 20, title: '20 (affective-evaluative)', options: [{label: 'nagging', score: 1}, {label: 'nauseating', score: 2}, {label: 'agonizing', score: 3}, {label: 'dreadful', score: 4}, {label: 'torturing', score: 5}] },
];

const PATTERN_OPTIONS = [
  { label: 'Continuous, Steady, Constant', score: 1 },
  { label: 'Rhythmic, Periodic, Intermittent', score: 2 },
  { label: 'Brief, Momentary, Transient', score: 3 },
];

const INTENSITY_OPTIONS = [
  { label: 'Mild', score: 1 },
  { label: 'Discomforting', score: 2 },
  { label: 'Distressing', score: 3 },
  { label: 'Horrible', score: 4 },
  { label: 'Excruciating', score: 5 },
];

const INTENSITY_QUESTIONS = [
  { id: 'current', text: 'Which word describes your pain right now?' },
  { id: 'worst', text: 'Which word describes it at its worst?' },
  { id: 'least', text: 'Which word describes it when it is least?' },
  { id: 'toothache', text: 'Which word describes the worst toothache you ever had?' },
  { id: 'headache', text: 'Which word describes the worst headache you ever had?' },
  { id: 'stomachache', text: 'Which word describes the worst stomach ache you ever had?' },
];

const FACTORS = [
  'Liquor', 'Stimulants (e.g. coffee)', 'Eating', 'Heat', 'Cold', 'Damp', 'Weather changes', 
  'Massage or use of a vibrator', 'Pressure', 'No movement', 'Movement', 'Sleep or rest', 
  'Lying down', 'Distraction (TV, reading etc.)', 'Urination or defecation', 'Tension', 
  'Bright lights', 'Loud noises', 'Going to work', 'Intercourse', 'Mild exercise', 'Fatigue'
];

// --- Components ---

export default function App() {
  const [step, setStep] = useState(0); // 0: Info, 1: Descriptors, 2: Pattern, 3: Factors, 4: Intensity, 5: Results
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    profession: '',
    painLocation: '',
    painSince: '',
    painTriggers: '',
    painRelievers: ''
  });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showDetailedResponses, setShowDetailedResponses] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelAppendInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setStep(0);
    setPatientInfo({
      name: '',
      age: '',
      gender: '',
      profession: '',
      painLocation: '',
      painSince: '',
      painTriggers: '',
      painRelievers: ''
    });
    setAnswers({});
    setShowDetailedResponses(false);
  };

  const totalScore = useMemo(() => {
    let score = 0;
    // Descriptor groups
    DESCRIPTOR_GROUPS.forEach(group => {
      const selected = answers[`group_${group.id}`];
      if (selected) {
        const option = group.options.find(o => o.label === selected);
        if (option) score += option.score;
      }
    });
    // Pattern
    const pattern = answers['pattern'];
    if (pattern) {
      const opt = PATTERN_OPTIONS.find(o => o.label === pattern);
      if (opt) score += opt.score;
    }
    // Intensity
    INTENSITY_QUESTIONS.forEach(q => {
      const intensity = answers[`intensity_${q.id}`];
      if (intensity) {
        const opt = INTENSITY_OPTIONS.find(o => o.label === intensity);
        if (opt) score += opt.score;
      }
    });
    return score;
  }, [answers]);

  const isInfoComplete = patientInfo.name && patientInfo.age;

  // --- JSON Handlers ---

  const handleSaveJson = () => {
    const now = new Date();
    const formattedDateTime = now.toLocaleString();

    const data: AssessmentData = {
      patientInfo,
      answers,
      metadata: {
        totalScore,
        timestamp: now.toISOString(),
        formattedDateTime,
        version: '1.0'
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `McGill_Pain_${patientInfo.name.replace(/\s+/g, '_') || 'Patient'}_${now.toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as AssessmentData;
        
        if (data.patientInfo && data.answers) {
          setPatientInfo(data.patientInfo);
          setAnswers(data.answers);
          setStep(totalSteps - 1);
        } else {
          alert('Invalid JSON format.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getAssessmentRow = () => {
    const row: any = {
      'Date': new Date().toLocaleString(),
      'Name': patientInfo.name,
      'Age': patientInfo.age,
      'Gender': patientInfo.gender,
      'Profession': patientInfo.profession,
      'Location': patientInfo.painLocation,
      'Since': patientInfo.painSince,
      'Total Score': totalScore,
    };

    DESCRIPTOR_GROUPS.forEach(g => {
      row[`Group ${g.id}`] = answers[`group_${g.id}`] || 'None';
    });

    return row;
  };

  const handleExportExcel = () => {
    const row = getAssessmentRow();
    const worksheet = XLSX.utils.json_to_sheet([row]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assessments");
    XLSX.writeFile(workbook, `McGill_Pain_${patientInfo.name.replace(/\s+/g, '_') || 'Patient'}.xlsx`);
  };

  const handleAppendExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const existingData = XLSX.utils.sheet_to_json(worksheet);
        const newRow = getAssessmentRow();
        const updatedData = [...existingData, newRow];
        
        const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, firstSheetName);
        
        XLSX.writeFile(newWorkbook, file.name);
      } catch (err) {
        alert('Error processing Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelAppendInputRef.current) excelAppendInputRef.current.value = '';
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('McGill Pain Questionnaire Report', margin, y);
      y += 15;

      doc.setFontSize(12);
      doc.text('Patient Information', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${patientInfo.name}`, margin, y); y += 5;
      doc.text(`Age: ${patientInfo.age}`, margin, y); y += 5;
      doc.text(`Profession: ${patientInfo.profession || 'N/A'}`, margin, y); y += 5;
      doc.text(`Location: ${patientInfo.painLocation || 'N/A'}`, margin, y); y += 5;
      doc.text(`Since: ${patientInfo.painSince || 'N/A'}`, margin, y); y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text(`Total Pain Rating Index (Score): ${totalScore}`, margin, y);
      y += 15;

      doc.text('Pain Descriptors', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      DESCRIPTOR_GROUPS.forEach(g => {
        const val = answers[`group_${g.id}`];
        if (val) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${g.title}: ${val}`, margin, y);
          y += 5;
        }
      });

      doc.save(`McGill_Report_${patientInfo.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 print:max-w-none print:p-0">
        
        <header className="mb-12 text-center print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-600 text-white mb-6 shadow-xl">
            <Activity size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">McGill Pain Questionnaire</h1>
          <p className="text-stone-500 max-w-md mx-auto italic serif">
            A comprehensive tool for evaluating significant pain intensity and quality.
          </p>
        </header>

        {step > 0 && step < totalSteps - 1 && (
          <div className="mb-12 print:hidden">
            <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">
              <span>Progress</span>
              <span>{Math.round(((step) / (totalSteps - 2)) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-rose-600"
                initial={{ width: 0 }}
                animate={{ width: `${((step) / (totalSteps - 2)) * 100}%` }}
                transition={{ duration: 0.5, ease: "circOut" }}
              />
            </div>
          </div>
        )}

        <main className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <AnimatePresence mode="wait">
            
            {step === 0 && (
              <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <User className="text-stone-400" size={24} />
                    <h2 className="text-2xl font-semibold">Patient Information</h2>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleLoadJson} accept=".json" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all">
                      <Upload size={16} /> Load JSON
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Full Name</label>
                    <input type="text" value={patientInfo.name} onChange={e => setPatientInfo(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter patient's name" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Age</label>
                    <input type="text" value={patientInfo.age} onChange={e => setPatientInfo(prev => ({ ...prev, age: e.target.value }))} placeholder="e.g. 45" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Profession (Optional)</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                      <input type="text" value={patientInfo.profession} onChange={e => setPatientInfo(prev => ({ ...prev, profession: e.target.value }))} placeholder="e.g. Teacher" className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Location of Pain</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                      <input type="text" value={patientInfo.painLocation} onChange={e => setPatientInfo(prev => ({ ...prev, painLocation: e.target.value }))} placeholder="e.g. Lower Back" className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Pain Since (Optional)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                      <input type="text" value={patientInfo.painSince} onChange={e => setPatientInfo(prev => ({ ...prev, painSince: e.target.value }))} placeholder="e.g. 2 weeks ago" className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-stone-500">Triggers (Optional)</label>
                    <input type="text" value={patientInfo.painTriggers} onChange={e => setPatientInfo(prev => ({ ...prev, painTriggers: e.target.value }))} placeholder="e.g. Standing too long" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all" />
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button onClick={handleNext} disabled={!isInfoComplete} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg ${isInfoComplete ? 'bg-rose-600 text-white hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>
                    Start Assessment <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="descriptors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2">What Does Your Pain Feel Like?</h2>
                  <p className="text-stone-500 text-sm">Select ONLY the words that best describe your present pain. Use only a single word in each appropriate category.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {DESCRIPTOR_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-2">{group.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleAnswer(`group_${group.id}`, answers[`group_${group.id}`] === opt.label ? null : opt.label)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${answers[`group_${group.id}`] === opt.label ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'}`}
                          >
                            {opt.label} ({opt.score})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-16 pt-8 border-t border-stone-100 flex justify-between items-center">
                  <button onClick={handleBack} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-stone-600 hover:bg-stone-50 transition-all"><ChevronLeft size={20} /> Back</button>
                  <button onClick={handleNext} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg">Next Section <ChevronRight size={20} /></button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="pattern" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2">How Does Your Pain Change with Time?</h2>
                  <p className="text-stone-500 text-sm">Which word or words would you use to describe the pattern of your pain?</p>
                </div>
                <div className="space-y-4">
                  {PATTERN_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer('pattern', opt.label)}
                      className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${answers['pattern'] === opt.label ? 'bg-rose-50 border-rose-600 text-rose-900' : 'bg-white border-stone-100 hover:border-stone-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">{opt.label}</span>
                        <span className="text-xs font-mono text-stone-400">{opt.score} Point</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-16 pt-8 border-t border-stone-100 flex justify-between items-center">
                  <button onClick={handleBack} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-stone-600 hover:bg-stone-50 transition-all"><ChevronLeft size={20} /> Back</button>
                  <button onClick={handleNext} disabled={!answers['pattern']} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg ${answers['pattern'] ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}>Next Section <ChevronRight size={20} /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="factors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2">Factors Affecting Pain</h2>
                  <p className="text-stone-500 text-sm">Do the following items increase or decrease your pain?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FACTORS.map((factor) => (
                    <div key={factor} className="p-4 rounded-xl border border-stone-100 bg-stone-50 flex items-center justify-between">
                      <span className="text-sm font-medium">{factor}</span>
                      <div className="flex gap-1">
                        {['Decrease', 'No Change', 'Increase'].map((state) => (
                          <button
                            key={state}
                            onClick={() => handleAnswer(`factor_${factor}`, state)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter transition-all ${answers[`factor_${factor}`] === state ? 'bg-rose-600 text-white' : 'bg-white text-stone-400 border border-stone-200'}`}
                          >
                            {state === 'No Change' ? 'NC' : state[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-16 pt-8 border-t border-stone-100 flex justify-between items-center">
                  <button onClick={handleBack} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-stone-600 hover:bg-stone-50 transition-all"><ChevronLeft size={20} /> Back</button>
                  <button onClick={handleNext} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg">Next Section <ChevronRight size={20} /></button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="intensity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2">How Strong is Your Pain?</h2>
                  <p className="text-stone-500 text-sm">Select the word that best describes the intensity for each situation.</p>
                </div>
                <div className="space-y-8">
                  {INTENSITY_QUESTIONS.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <p className="text-lg font-medium">{q.text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {INTENSITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleAnswer(`intensity_${q.id}`, opt.label)}
                            className={`px-3 py-3 rounded-xl text-xs font-medium transition-all border ${answers[`intensity_${q.id}`] === opt.label ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'}`}
                          >
                            <div className="mb-1 opacity-60">Score {opt.score}</div>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-16 pt-8 border-t border-stone-100 flex justify-between items-center">
                  <button onClick={handleBack} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-stone-600 hover:bg-stone-50 transition-all"><ChevronLeft size={20} /> Back</button>
                  <button onClick={handleNext} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg">View Results <ChevronRight size={20} /></button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-12 print:p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 print:hidden">
                  <div className="text-center md:text-left">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-600 text-white mb-6 shadow-2xl">
                      <BarChart3 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Assessment Results</h2>
                    <p className="text-stone-500">Based on the McGill Pain Questionnaire</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md">
                      <FileDown size={18} /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button onClick={handleSaveJson} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm">
                      <Download size={18} /> Save JSON
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md">
                      <Download size={18} /> Excel
                    </button>
                    <div className="relative">
                      <input 
                        type="file" 
                        ref={excelAppendInputRef} 
                        onChange={handleAppendExcel} 
                        accept=".xlsx" 
                        className="hidden" 
                      />
                      <button
                        onClick={() => excelAppendInputRef.current?.click()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all shadow-sm"
                      >
                        <Upload size={18} />
                        Append Excel
                      </button>
                    </div>
                    <button onClick={() => setShowDetailedResponses(!showDetailedResponses)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm">
                      {showDetailedResponses ? <EyeOff size={18} /> : <Eye size={18} />} {showDetailedResponses ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-6 mb-10 border border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-4 print:bg-white">
                  <div><p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Patient Name</p><p className="font-semibold">{patientInfo.name}</p></div>
                  <div><p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Age</p><p className="font-semibold">{patientInfo.age}</p></div>
                  <div><p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Profession</p><p className="font-semibold">{patientInfo.profession || 'N/A'}</p></div>
                  <div><p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">Location</p><p className="font-semibold truncate">{patientInfo.painLocation || 'N/A'}</p></div>
                </div>

                <div className="rounded-3xl p-8 mb-10 border-2 text-center shadow-sm bg-rose-50 border-rose-200">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Pain Rating Index (PRI)</p>
                  <div className="text-7xl font-black mb-4 text-rose-600">{totalScore}</div>
                  <p className="text-stone-500 text-sm italic">Max Score: 78 • Higher score indicates greater pain intensity.</p>
                </div>

                {showDetailedResponses && (
                  <div className="space-y-8 mb-12">
                    <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200">
                      <h3 className="text-xl font-bold mb-6">Selected Descriptors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DESCRIPTOR_GROUPS.map(g => {
                          const val = answers[`group_${g.id}`];
                          if (!val) return null;
                          return (
                            <div key={g.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-stone-100">
                              <span className="text-xs font-mono text-stone-400">{g.title}</span>
                              <span className="font-bold text-rose-600">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 p-6 rounded-2xl bg-stone-100 text-stone-600 text-xs leading-relaxed mb-12 print:bg-white print:border">
                  <AlertCircle className="flex-shrink-0 text-stone-400" size={20} />
                  <p><strong>Disclaimer:</strong> This tool is for informational purposes only and does not constitute a medical diagnosis. The McGill Pain Questionnaire is a clinical tool. Please consult with a healthcare professional for a formal evaluation and treatment plan.</p>
                </div>

                <div className="flex justify-center print:hidden">
                  <button onClick={resetForm} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm">
                    <RotateCcw size={20} /> Start New Assessment
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <footer className="mt-12 text-center text-stone-400 text-xs">
          <p>© {new Date().getFullYear()} McGill Pain Assessment Tool • Professional Grade Evaluation</p>
        </footer>
      </div>
    </div>
  );
}
