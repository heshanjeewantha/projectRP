import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  FileCode,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  Key,
  Layers,
  Link2,
  Lock,
  Mail,
  Network,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Table,
  Terminal,
  Zap,
} from 'lucide-react';

const TopicConceptDiagram = ({ topicId, topicName }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('diagram');

  const normalizedId = (topicId || '').toLowerCase().replace(/-/g, '_').trim();

  // ── Render Specific Topic Diagram ──
  const renderDiagram = () => {
    switch (true) {
      case normalizedId.includes('computer_system') || normalizedId.includes('hardware') || normalizedId.includes('architecture'):
        return <RealComputerArchitectureDiagram />;

      case normalizedId.includes('normalization'):
        return <RealNormalizationPipelineDiagram />;

      case normalizedId.includes('dbms') || normalizedId.includes('database') || normalizedId.includes('sql'):
        return <RealRelationalDatabaseDiagram />;

      case normalizedId.includes('flowchart') || normalizedId.includes('algorithm'):
        return <RealFlowchartTraceDiagram />;

      case normalizedId.includes('spreadsheet'):
        return <RealSpreadsheetEngineDiagram />;

      case normalizedId.includes('word_processing') || normalizedId.includes('word'):
        return <RealMailMergeDiagram />;

      case normalizedId.includes('internet') || normalizedId.includes('email'):
        return <RealInternetEmailDiagram />;

      case normalizedId.includes('network'):
        return <RealNetworkingTopologyDiagram />;

      case normalizedId.includes('operating_system') || normalizedId.includes('os'):
        return <RealOperatingSystemDiagram />;

      case normalizedId.includes('data') || normalizedId.includes('logic') || normalizedId.includes('representation'):
        return <RealDataLogicGatesDiagram />;

      case normalizedId.includes('security') || normalizedId.includes('cyber') || normalizedId.includes('ethical'):
        return <RealCyberSecurityDiagram />;

      default:
        return <RealRelationalDatabaseDiagram />;
    }
  };

  return (
    <div className="note-diagram-focus-container p-5 sm:p-7 shadow-2xl my-8 transition-all ring-2 ring-emerald-500/40 border-2 border-emerald-500/60 rounded-3xl">
      {/* Diagram Spotlight Section Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Core Visual Architecture
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 animate-pulse">
                ● SPOTLIGHT DIAGRAM
              </span>
            </div>
            <h4 className="text-base sm:text-xl font-black text-text-main tracking-tight">
              {topicName || 'Topic Concept Model'}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all px-4 py-2 rounded-xl border border-emerald-500/30 cursor-pointer shrink-0"
        >
          <span>{isExpanded ? 'Collapse Diagram' : 'Expand Visual Model'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Collapsible Diagram Canvas */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-6 overflow-hidden"
        >
          <div className="note-diagram-canvas relative rounded-2xl p-5 sm:p-7 shadow-inner overflow-x-auto border-2 border-border">
            {renderDiagram()}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-text-muted px-1 flex-wrap gap-2">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles size={15} />
              Interactive high-yield visual architecture diagram
            </span>
            <span className="font-mono text-[11px] font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              Sri Lanka National O/L ICT Standard
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};



/* ─────────────────────────────────────────────────────────────────────────────
   1. Real Relational Database & Entity-Relationship Schema (DBMS)
   ───────────────────────────────────────────────────────────────────────────── */
const RealRelationalDatabaseDiagram = () => (
  <div className="w-full min-w-[580px] space-y-4 text-xs">
    {/* Table Grid Cards */}
    <div className="grid grid-cols-2 gap-5 relative items-start">
      {/* Table 1: Students (Parent Table) */}
      <div className="diagram-inner-card rounded-2xl overflow-hidden shadow-lg border border-sky-500/40">
        {/* Table Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2.5 flex items-center justify-between text-white font-bold">
          <div className="flex items-center gap-2">
            <Table size={15} />
            <span>Table: STUDENTS</span>
          </div>
          <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded-full border border-white/20">
            Parent Entity (1)
          </span>
        </div>

        {/* Table Columns */}
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Key size={13} className="text-amber-400" /> student_id
            </span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">PK · VARCHAR(10)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-slate-200 font-mono text-[11px]">
            <span>first_name</span>
            <span className="text-text-muted text-[10px]">VARCHAR(50)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-slate-200 font-mono text-[11px]">
            <span>class_grade</span>
            <span className="text-text-muted text-[10px]">VARCHAR(10)</span>
          </div>
        </div>
      </div>

      {/* Table 2: ExamMarks (Child Table) */}
      <div className="diagram-inner-card rounded-2xl overflow-hidden shadow-lg border border-emerald-500/40">
        {/* Table Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 flex items-center justify-between text-white font-bold">
          <div className="flex items-center gap-2">
            <Table size={15} />
            <span>Table: EXAM_MARKS</span>
          </div>
          <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded-full border border-white/20">
            Child Entity (N / ∞)
          </span>
        </div>

        {/* Table Columns */}
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Key size={13} className="text-amber-400" /> mark_id
            </span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">PK · INT</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Link2 size={13} className="text-sky-400" /> student_id
            </span>
            <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded font-bold text-sky-300">FK ➔ Students</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-slate-200 font-mono text-[11px]">
            <span>subject_name</span>
            <span className="text-text-muted text-[10px]">VARCHAR(50)</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-slate-200 font-mono text-[11px]">
            <span>score</span>
            <span className="text-emerald-400 font-bold text-[10px]">INT (0-100)</span>
          </div>
        </div>
      </div>
    </div>

    {/* Relationship Cardinality Callout */}
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GitBranch size={16} className="text-primary" />
        <div>
          <span className="font-bold text-white text-xs">Relational Link: 1 to Many (1 : N)</span>
          <span className="text-text-muted text-[11px] ml-2">One Student can have multiple Exam Marks entries</span>
        </div>
      </div>
      <span className="font-mono text-[10px] bg-primary/20 text-primary px-2.5 py-1 rounded-md font-bold border border-primary/30">
        Referential Integrity Enforced
      </span>
    </div>

    {/* Live SQL Query Snippet */}
    <div className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px]">
      <div className="flex items-center justify-between text-text-muted text-[10px] mb-1">
        <span className="flex items-center gap-1"><FileCode size={12} className="text-primary" /> SQL Relational Join Query:</span>
        <span className="text-emerald-400">DML Query</span>
      </div>
      <code className="text-slate-200">
        <span className="text-purple-400">SELECT</span> Students.first_name, ExamMarks.subject_name, ExamMarks.score<br />
        <span className="text-purple-400">FROM</span> Students <span className="text-purple-400">INNER JOIN</span> ExamMarks <span className="text-purple-400">ON</span> Students.student_id = ExamMarks.student_id;
      </code>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   2. Real Database Normalization (1NF ➔ 2NF ➔ 3NF) Pipeline
   ───────────────────────────────────────────────────────────────────────────── */
const RealNormalizationPipelineDiagram = () => (
  <div className="w-full min-w-[600px] space-y-4 text-xs">
    <div className="grid grid-cols-3 gap-3.5">
      {/* 1NF */}
      <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-sky-500 shadow-md">
        <div className="flex items-center justify-between font-bold text-sky-400 pb-2 border-b border-white/10 mb-2.5">
          <span>1NF (First Normal)</span>
          <span className="text-[9px] font-mono bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-300">Atomic Cells</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
          Eliminates repeating groups so that every column contains single indivisible values.
        </p>
        <div className="rounded-lg bg-black/40 p-2 font-mono text-[10px] space-y-1">
          <div className="text-rose-400">❌ Phone: "077123, 071456"</div>
          <div className="text-emerald-400">✓ Separate rows per phone</div>
        </div>
      </div>

      {/* 2NF */}
      <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-amber-500 shadow-md">
        <div className="flex items-center justify-between font-bold text-amber-400 pb-2 border-b border-white/10 mb-2.5">
          <span>2NF (Second Normal)</span>
          <span className="text-[9px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">No Partial Key</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
          Must be in 1NF and have NO partial dependencies on composite primary keys.
        </p>
        <div className="rounded-lg bg-black/40 p-2 font-mono text-[10px] space-y-1">
          <div className="text-rose-400">❌ (StudentID, CourseID) ➔ Name</div>
          <div className="text-emerald-400">✓ Split Student Table from Course</div>
        </div>
      </div>

      {/* 3NF */}
      <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-emerald-500 shadow-md">
        <div className="flex items-center justify-between font-bold text-emerald-400 pb-2 border-b border-white/10 mb-2.5">
          <span>3NF (Third Normal)</span>
          <span className="text-[9px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">No Transitive</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
          Must be in 2NF and have NO non-key fields depending on other non-key fields.
        </p>
        <div className="rounded-lg bg-black/40 p-2 font-mono text-[10px] space-y-1">
          <div className="text-rose-400">❌ StudentID ➔ DeptID ➔ DeptName</div>
          <div className="text-emerald-400">✓ Move Department to its own table</div>
        </div>
      </div>
    </div>

    {/* Golden Rule Banner */}
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-3">
      <Sparkles size={18} className="text-amber-400 shrink-0" />
      <div className="text-xs font-semibold text-amber-200">
        <strong>Golden Rule of Normalization:</strong> "Every non-key attribute must depend on The Key (1NF), The Whole Key (2NF), and Nothing But The Key (3NF)."
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   3. Real Computer System Architecture (Von Neumann CPU & Bus)
   ───────────────────────────────────────────────────────────────────────────── */
const RealComputerArchitectureDiagram = () => (
  <div className="w-full min-w-[580px] space-y-4 text-xs">
    <div className="grid grid-cols-12 gap-3.5 items-center">
      {/* Input Devices */}
      <div className="col-span-3 diagram-inner-card rounded-2xl p-3.5 text-center border-l-4 border-l-sky-400 shadow-md">
        <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-wider">Input Unit</span>
        <h5 className="font-bold text-white text-xs mt-1">Keyboard · Sensors · Mouse</h5>
        <div className="mt-2 text-[10px] text-text-muted bg-black/30 p-1.5 rounded">Binary Raw Data Inflow</div>
      </div>

      <div className="col-span-1 flex justify-center text-primary">
        <ArrowRight size={20} className="animate-pulse text-primary" />
      </div>

      {/* Central CPU Box */}
      <div className="col-span-4 diagram-inner-card rounded-2xl p-3.5 border-2 border-primary shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
          <span className="font-black text-primary text-xs flex items-center gap-1.5">
            <Cpu size={16} /> Central Processing Unit (CPU)
          </span>
          <span className="text-[9px] font-mono bg-primary/20 text-primary px-1.5 rounded">3.2 GHz</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-center">
            <div className="font-bold text-amber-300 text-xs">Control Unit (CU)</div>
            <div className="text-[9px] text-text-muted mt-0.5">Timing &amp; Decode Cycle</div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center">
            <div className="font-bold text-emerald-300 text-xs">ALU</div>
            <div className="text-[9px] text-text-muted mt-0.5">Math &amp; Logic Operations</div>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-purple-500/30 bg-purple-500/10 p-1.5 text-center font-mono text-[10px] text-purple-300 font-bold">
          Registers: PC · MAR · MDR · ACC · CIR
        </div>
      </div>

      <div className="col-span-1 flex justify-center text-primary">
        <ArrowRight size={20} className="animate-pulse text-primary" />
      </div>

      {/* Output Devices */}
      <div className="col-span-3 diagram-inner-card rounded-2xl p-3.5 text-center border-r-4 border-r-emerald-400 shadow-md">
        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Output Unit</span>
        <h5 className="font-bold text-white text-xs mt-1">Monitor · Printer · Actuator</h5>
        <div className="mt-2 text-[10px] text-text-muted bg-black/30 p-1.5 rounded">Processed Info Presentation</div>
      </div>
    </div>

    {/* System Buses Lane */}
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
      <div className="text-[11px] font-bold text-white flex items-center justify-between">
        <span>3 System Buses (Interconnection Highways):</span>
        <span className="font-mono text-[10px] text-primary">High-Speed Digital Tracks</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
        <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300">
          <strong>🔴 Control Bus</strong> (Bidirectional: Read/Write pulses)
        </div>
        <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300">
          <strong>🔵 Address Bus</strong> (Unidirectional: CPU ➔ Memory)
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          <strong>🟢 Data Bus</strong> (Bidirectional: Payload transfer)
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   4. Real Flowchart & Trace Table Algorithm Simulator
   ───────────────────────────────────────────────────────────────────────────── */
const RealFlowchartTraceDiagram = () => (
  <div className="w-full min-w-[560px] space-y-3.5 text-xs">
    {/* Flowchart Sequence */}
    <div className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-white/10 bg-black/40">
      <div className="px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/20 font-bold text-purple-300 text-center">
        START
      </div>
      <ArrowRight size={15} className="text-primary shrink-0" />
      <div className="px-3 py-1.5 rounded border border-sky-500/40 bg-sky-500/20 font-mono text-sky-300 text-center skew-x-[-8deg]">
        Read Mark
      </div>
      <ArrowRight size={15} className="text-primary shrink-0" />
      <div className="px-3 py-1.5 rounded border-2 border-amber-500/60 bg-amber-500/20 font-bold text-amber-300 text-center">
        Mark &gt;= 50 ?
      </div>
      <ArrowRight size={15} className="text-primary shrink-0" />
      <div className="px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-500/20 font-bold text-emerald-300 text-center">
        Print "Pass"
      </div>
      <ArrowRight size={15} className="text-primary shrink-0" />
      <div className="px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/20 font-bold text-purple-300 text-center">
        STOP
      </div>
    </div>

    {/* Trace Table Grid */}
    <div className="diagram-inner-card rounded-2xl p-3.5">
      <div className="text-[11px] font-bold text-white mb-2 flex items-center justify-between">
        <span>Trace Table (Dry-Run Verification):</span>
        <span className="text-[10px] font-mono text-emerald-400">Step-by-Step Logic</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center border-b border-white/10 pb-1.5 text-text-muted font-bold">
        <span>Step</span>
        <span>Mark</span>
        <span>Mark &gt;= 50 (Condition)</span>
        <span>Output Result</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center pt-2 text-slate-200">
        <span>1</span><span>78</span><span className="text-emerald-400 font-bold">True</span><span className="text-emerald-300">"Pass"</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center pt-1.5 text-slate-200">
        <span>2</span><span>35</span><span className="text-rose-400 font-bold">False</span><span className="text-rose-300">"Fail"</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   5. Real Electronic Spreadsheet Engine
   ───────────────────────────────────────────────────────────────────────────── */
const RealSpreadsheetEngineDiagram = () => (
  <div className="w-full min-w-[560px] space-y-3 text-xs">
    {/* Formula Bar */}
    <div className="rounded-xl border border-white/10 bg-black/60 p-2 flex items-center gap-2 font-mono text-[11px]">
      <span className="font-bold text-primary bg-primary/20 px-2 py-0.5 rounded">fx</span>
      <span className="text-white">=IF(C2 &gt;= 75, "Distinction", "Pass")</span>
    </div>

    {/* Spreadsheet Grid */}
    <div className="diagram-inner-card rounded-2xl overflow-hidden shadow-lg border border-emerald-500/30">
      <div className="grid grid-cols-5 bg-white/5 border-b border-white/10 text-[11px] font-bold text-center py-1.5 font-mono">
        <span className="text-text-muted">#</span>
        <span className="text-primary">A (Student)</span>
        <span className="text-primary">B (Term 1)</span>
        <span className="text-primary">C (Term 2)</span>
        <span className="text-primary">D (Result)</span>
      </div>
      <div className="grid grid-cols-5 text-[11px] font-mono text-center py-2 border-b border-white/5 text-slate-200">
        <span className="text-text-muted">1</span><span>Kasun</span><span>82</span><span>88</span><span className="text-emerald-400 font-bold">Distinction</span>
      </div>
      <div className="grid grid-cols-5 text-[11px] font-mono text-center py-2 border-b border-white/5 text-slate-200 bg-primary/[0.04]">
        <span className="text-text-muted">2</span><span>Nimal</span><span>55</span><span>62</span><span className="text-sky-300 font-bold">Pass</span>
      </div>
    </div>

    {/* Cell Referencing Guide */}
    <div className="grid grid-cols-2 gap-3 text-[11px]">
      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
        <strong>Absolute Referencing ($A$1):</strong> Dollar locks cell so it NEVER shifts when dragged across rows/columns.
      </div>
      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300">
        <strong>Relative Referencing (A1):</strong> Automatically adjusts row/column coordinates when copied.
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   6. Real Word Processing & Mail Merge Architecture
   ───────────────────────────────────────────────────────────────────────────── */
const RealMailMergeDiagram = () => (
  <div className="w-full min-w-[560px] space-y-3 text-xs">
    <div className="flex items-center justify-between gap-3 text-center">
      <div className="diagram-inner-card flex-1 p-3 rounded-2xl border-t-4 border-t-sky-500">
        <div className="font-bold text-sky-400 mb-1">1. Main Document</div>
        <div className="text-[10px] text-text-muted">Template letter with &laquo;Student_Name&raquo; and &laquo;Marks&raquo; fields</div>
      </div>
      <div className="text-primary font-black text-base">+</div>
      <div className="diagram-inner-card flex-1 p-3 rounded-2xl border-t-4 border-t-amber-500">
        <div className="font-bold text-amber-400 mb-1">2. Data Source</div>
        <div className="text-[10px] text-text-muted">Excel sheet or database table containing 500 recipient records</div>
      </div>
      <div className="text-primary font-black text-base">=</div>
      <div className="diagram-inner-card flex-1 p-3 rounded-2xl border-t-4 border-t-emerald-500">
        <div className="font-bold text-emerald-400 mb-1">3. Merged Output</div>
        <div className="text-[10px] text-emerald-300">500 personalized letters ready for printing or email batching</div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   7. Real Internet, URL Breakdown & Email Protocols
   ───────────────────────────────────────────────────────────────────────────── */
const RealInternetEmailDiagram = () => (
  <div className="w-full min-w-[560px] space-y-3.5 text-xs">
    {/* URL Structure */}
    <div className="diagram-inner-card rounded-2xl p-3.5">
      <div className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2">URL Anatomy Breakdown:</div>
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 font-mono text-[11px]">
        <span className="text-emerald-400 font-bold">https://</span>
        <span className="text-amber-400 font-bold">www.nie.lk</span>
        <span className="text-sky-300">/ict/syllabus.pdf</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-muted px-2 mt-1">
        <span>Protocol (Encrypted)</span>
        <span>Domain Host Name</span>
        <span>File Resource Path</span>
      </div>
    </div>

    {/* Email Protocols */}
    <div className="grid grid-cols-3 gap-2.5 text-[11px]">
      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-center">
        <div className="font-bold text-purple-300">SMTP Protocol</div>
        <div className="text-[10px] text-text-muted mt-0.5">Send outgoing mail to servers</div>
      </div>
      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-center">
        <div className="font-bold text-sky-300">POP3 Protocol</div>
        <div className="text-[10px] text-text-muted mt-0.5">Download &amp; delete from server</div>
      </div>
      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-center">
        <div className="font-bold text-emerald-300">IMAP Protocol</div>
        <div className="text-[10px] text-text-muted mt-0.5">Sync live across devices</div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   8. Real Network Topologies
   ───────────────────────────────────────────────────────────────────────────── */
const RealNetworkingTopologyDiagram = () => (
  <div className="w-full min-w-[560px] grid grid-cols-2 gap-3.5 text-xs">
    <div className="diagram-inner-card rounded-2xl p-3.5 border-l-4 border-l-primary">
      <div className="font-bold text-primary flex items-center justify-between mb-1.5">
        <span>Star Topology</span>
        <span className="text-[9px] font-mono bg-primary/20 px-1.5 py-0.5 rounded">Central Switch</span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        All nodes connect directly to a central switch. Single node or cable failure does not disrupt other network devices.
      </p>
    </div>

    <div className="diagram-inner-card rounded-2xl p-3.5 border-l-4 border-l-amber-500">
      <div className="font-bold text-amber-400 flex items-center justify-between mb-1.5">
        <span>Bus Topology</span>
        <span className="text-[9px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded">Terminators</span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        All devices attach to one single backbone cable with terminators at both ends. Backbone cut brings down the whole network.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   9. Real Operating System Kernel & Process Lifecycle
   ───────────────────────────────────────────────────────────────────────────── */
const RealOperatingSystemDiagram = () => (
  <div className="w-full min-w-[560px] space-y-3 text-xs">
    <div className="diagram-inner-card rounded-2xl p-3.5 text-center">
      <div className="font-bold text-primary mb-1">Process Lifecycle States:</div>
      <div className="flex items-center justify-between gap-2 pt-2 text-[10px] font-mono">
        <span className="p-2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-1">NEW</span>
        <ArrowRight size={14} className="text-text-muted shrink-0" />
        <span className="p-2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex-1">READY</span>
        <ArrowRight size={14} className="text-text-muted shrink-0" />
        <span className="p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-1">RUNNING</span>
        <ArrowRight size={14} className="text-text-muted shrink-0" />
        <span className="p-2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex-1">TERMINATED</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   10. Real Logic Gates & Truth Circuit
   ───────────────────────────────────────────────────────────────────────────── */
const RealDataLogicGatesDiagram = () => (
  <div className="w-full min-w-[560px] grid grid-cols-3 gap-3 text-xs text-center">
    <div className="diagram-inner-card rounded-2xl p-3 border-t-4 border-t-emerald-500">
      <div className="font-bold text-emerald-400">AND Gate (·)</div>
      <div className="text-[10px] text-text-muted mt-1 font-mono">Output 1 ONLY if A=1 AND B=1</div>
      <div className="mt-2 bg-black/40 p-1 rounded font-mono text-[9px] text-slate-300">
        0·0=0 | 0·1=0 | 1·0=0 | 1·1=1
      </div>
    </div>

    <div className="diagram-inner-card rounded-2xl p-3 border-t-4 border-t-sky-500">
      <div className="font-bold text-sky-400">OR Gate (+)</div>
      <div className="text-[10px] text-text-muted mt-1 font-mono">Output 1 if ANY input is 1</div>
      <div className="mt-2 bg-black/40 p-1 rounded font-mono text-[9px] text-slate-300">
        0+0=0 | 0+1=1 | 1+0=1 | 1+1=1
      </div>
    </div>

    <div className="diagram-inner-card rounded-2xl p-3 border-t-4 border-t-purple-500">
      <div className="font-bold text-purple-400">NOT Gate (¯)</div>
      <div className="text-[10px] text-text-muted mt-1 font-mono">Inverts signal: 0 ➔ 1 | 1 ➔ 0</div>
      <div className="mt-2 bg-black/40 p-1 rounded font-mono text-[9px] text-slate-300">
        NOT(0) = 1 | NOT(1) = 0
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   11. Real Cyber Security CIA Triad
   ───────────────────────────────────────────────────────────────────────────── */
const RealCyberSecurityDiagram = () => (
  <div className="w-full min-w-[560px] grid grid-cols-3 gap-3.5 text-xs text-center">
    <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-sky-500">
      <div className="font-bold text-sky-400 mb-1">Confidentiality</div>
      <p className="text-[10px] text-slate-300">
        Data only visible to authorized users through <strong>AES/TLS Encryption</strong> and Access Passwords.
      </p>
    </div>

    <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-emerald-500">
      <div className="font-bold text-emerald-400 mb-1">Integrity</div>
      <p className="text-[10px] text-slate-300">
        Data accuracy preserved without tampering using <strong>Checksums &amp; Digital Signatures</strong>.
      </p>
    </div>

    <div className="diagram-inner-card rounded-2xl p-3.5 border-t-4 border-t-amber-500">
      <div className="font-bold text-amber-400 mb-1">Availability</div>
      <p className="text-[10px] text-slate-300">
        Systems accessible on demand via <strong>Firewalls, Backups, and DDoS Protections</strong>.
      </p>
    </div>
  </div>
);

export default TopicConceptDiagram;
