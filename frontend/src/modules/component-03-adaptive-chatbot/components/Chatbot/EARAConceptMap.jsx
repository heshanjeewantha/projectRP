import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  Lightbulb,
  Network,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { getEaraDiagram } from '../../services/chatbotApi';

// Node type styling
const NODE_COLORS = {
  core:       { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300' },
  sub:        { bg: 'bg-violet-500/15',  border: 'border-violet-500/40',  text: 'text-violet-300',  badge: 'bg-violet-500/20 text-violet-300' },
  action:     { bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40',    text: 'text-cyan-300',    badge: 'bg-cyan-500/20 text-cyan-300' },
  memory:     { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-300',   badge: 'bg-amber-500/20 text-amber-300' },
  key:        { bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    text: 'text-rose-300',    badge: 'bg-rose-500/20 text-rose-300' },
  symbol:     { bg: 'bg-teal-500/15',    border: 'border-teal-500/40',    text: 'text-teal-300',    badge: 'bg-teal-500/20 text-teal-300' },
  function:   { bg: 'bg-indigo-500/15',  border: 'border-indigo-500/40',  text: 'text-indigo-300',  badge: 'bg-indigo-500/20 text-indigo-300' },
  interface:  { bg: 'bg-sky-500/15',     border: 'border-sky-500/40',     text: 'text-sky-300',     badge: 'bg-sky-500/20 text-sky-300' },
  output:     { bg: 'bg-lime-500/15',    border: 'border-lime-500/40',    text: 'text-lime-300',    badge: 'bg-lime-500/20 text-lime-300' },
  connector:  { bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  text: 'text-orange-300',  badge: 'bg-orange-500/20 text-orange-300' },
  step:       { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-300',    badge: 'bg-blue-500/20 text-blue-300' },
  pillar:     { bg: 'bg-pink-500/15',    border: 'border-pink-500/40',    text: 'text-pink-300',    badge: 'bg-pink-500/20 text-pink-300' },
  danger:     { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-300',     badge: 'bg-red-500/20 text-red-300' },
  defence:    { bg: 'bg-green-500/15',   border: 'border-green-500/40',   text: 'text-green-300',   badge: 'bg-green-500/20 text-green-300' },
  protocol:   { bg: 'bg-indigo-500/15',  border: 'border-indigo-500/40',  text: 'text-indigo-300',  badge: 'bg-indigo-500/20 text-indigo-300' },
  address:    { bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40',  text: 'text-yellow-300',  badge: 'bg-yellow-500/20 text-yellow-300' },
  reference:  { bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-500/40', text: 'text-fuchsia-300',  badge: 'bg-fuchsia-500/20 text-fuchsia-300' },
  sql:        { bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  text: 'text-purple-300',  badge: 'bg-purple-500/20 text-purple-300' },
  property:   { bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40',    text: 'text-cyan-300',    badge: 'bg-cyan-500/20 text-cyan-300' },
  benefit:    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300' },
  device:     { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-300',   badge: 'bg-amber-500/20 text-amber-300' },
  control:    { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-300',    badge: 'bg-blue-500/20 text-blue-300' },
  tool:       { bg: 'bg-teal-500/15',    border: 'border-teal-500/40',    text: 'text-teal-300',    badge: 'bg-teal-500/20 text-teal-300' },
  start:      { bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    text: 'text-rose-300',    badge: 'bg-rose-500/20 text-rose-300' },
};

const defaultColor = {
  bg: 'bg-white/5',
  border: 'border-white/15',
  text: 'text-white/80',
  badge: 'bg-white/10 text-white/70',
};

const getNodeColor = (type) => NODE_COLORS[type] || defaultColor;

/**
 * TopicSVGSchematic
 * Renders an interactive SVG architectural diagram matching the topic's schematicType.
 */
const TopicSVGSchematic = ({ schematicType, topicName }) => {
  switch (schematicType) {
    case 'bus_architecture':
      return (
        <svg viewBox="0 0 640 220" className="w-full h-auto max-h-[220px]">
          {/* CPU Box */}
          <rect x="20" y="20" width="220" height="180" rx="14" fill="#0d2818" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="35" y="42" fill="#10b981" fontSize="12" fontWeight="700" letterSpacing="0.05em">CPU (CENTRAL PROCESSING UNIT)</text>
          
          {/* CU */}
          <rect x="35" y="55" width="90" height="50" rx="8" fill="#133d26" stroke="#34d399" strokeWidth="1.2" />
          <text x="50" y="77" fill="#6ee7b7" fontSize="11" fontWeight="700">Control Unit</text>
          <text x="50" y="93" fill="#a7f3d0" fontSize="9">Fetch & Decode</text>

          {/* ALU */}
          <rect x="135" y="55" width="90" height="50" rx="8" fill="#133d26" stroke="#34d399" strokeWidth="1.2" />
          <text x="165" y="77" fill="#6ee7b7" fontSize="11" fontWeight="700">ALU</text>
          <text x="145" y="93" fill="#a7f3d0" fontSize="9">Math & Logic</text>

          {/* Registers */}
          <rect x="35" y="115" width="190" height="42" rx="8" fill="#064e3b" stroke="#059669" strokeWidth="1" />
          <text x="50" y="134" fill="#a7f3d0" fontSize="10" fontWeight="600">Registers (PC, MAR, MDR, ACC)</text>
          <text x="50" y="148" fill="#6ee7b7" fontSize="8">High-Speed CPU Memory</text>

          {/* System Bus (central highway) */}
          <rect x="270" y="30" width="40" height="160" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
          <text x="290" y="115" fill="#c7d2fe" fontSize="10" fontWeight="700" textAnchor="middle" transform="rotate(-90 290 115)">
            SYSTEM BUS (Control · Address · Data)
          </text>

          {/* Connecting lines CPU to Bus */}
          <line x1="240" y1="80" x2="270" y2="80" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="240" y1="135" x2="270" y2="135" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 2" />

          {/* RAM */}
          <rect x="340" y="25" width="130" height="52" rx="10" fill="#2d1b4e" stroke="#c084fc" strokeWidth="1.2" />
          <text x="355" y="47" fill="#e9d5ff" fontSize="11" fontWeight="700">RAM (Main Memory)</text>
          <text x="355" y="63" fill="#d8b4fe" fontSize="9">Volatile · Active Workspace</text>
          <line x1="310" y1="51" x2="340" y2="51" stroke="#818cf8" strokeWidth="2" />

          {/* ROM */}
          <rect x="340" y="85" width="130" height="52" rx="10" fill="#3b1d32" stroke="#f472b6" strokeWidth="1.2" />
          <text x="355" y="107" fill="#fbcfe8" fontSize="11" fontWeight="700">ROM (Firmware)</text>
          <text x="355" y="123" fill="#f472b6" fontSize="9">Non-Volatile · BIOS Startup</text>
          <line x1="310" y1="111" x2="340" y2="111" stroke="#818cf8" strokeWidth="2" />

          {/* Secondary Storage */}
          <rect x="340" y="145" width="130" height="52" rx="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
          <text x="355" y="167" fill="#f1f5f9" fontSize="11" fontWeight="700">Secondary Storage</text>
          <text x="355" y="183" fill="#cbd5e1" fontSize="9">HDD, SSD · Permanent Files</text>
          <line x1="310" y1="171" x2="340" y2="171" stroke="#818cf8" strokeWidth="2" />

          {/* I/O Devices */}
          <rect x="495" y="60" width="125" height="100" rx="12" fill="#0f2942" stroke="#38bdf8" strokeWidth="1.2" />
          <text x="510" y="85" fill="#bae6fd" fontSize="11" fontWeight="700">I/O Devices</text>
          <text x="510" y="105" fill="#7dd3fc" fontSize="9">• Keyboard, Mouse</text>
          <text x="510" y="123" fill="#7dd3fc" fontSize="9">• Monitor, Printer</text>
          <text x="510" y="141" fill="#7dd3fc" fontSize="9">• USB Controllers</text>
          <line x1="470" y1="110" x2="495" y2="110" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      );

    case 'star_network':
      return (
        <svg viewBox="0 0 640 220" className="w-full h-auto max-h-[220px]">
          {/* Central Switch */}
          <circle cx="320" cy="110" r="42" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <text x="320" y="106" fill="#c7d2fe" fontSize="12" fontWeight="800" textAnchor="middle">CENTRAL</text>
          <text x="320" y="122" fill="#a5b4fc" fontSize="11" fontWeight="800" textAnchor="middle">SWITCH</text>

          {/* Router to WAN */}
          <rect x="30" y="85" width="110" height="50" rx="10" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          <text x="85" y="107" fill="#a7f3d0" fontSize="11" fontWeight="700" textAnchor="middle">ROUTER</text>
          <text x="85" y="123" fill="#6ee7b7" fontSize="9" textAnchor="middle">Gateway to WAN/Internet</text>

          <line x1="140" y1="110" x2="278" y2="110" stroke="#34d399" strokeWidth="2.5" />

          {/* Node 1 */}
          <rect x="250" y="15" width="90" height="40" rx="8" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="295" y="35" fill="#e5e7eb" fontSize="10" fontWeight="600" textAnchor="middle">PC 1 (192.168.1.10)</text>
          <line x1="295" y1="55" x2="310" y2="70" stroke="#818cf8" strokeWidth="1.5" />

          {/* Node 2 */}
          <rect x="420" y="30" width="90" height="40" rx="8" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="465" y="50" fill="#e5e7eb" fontSize="10" fontWeight="600" textAnchor="middle">PC 2 (192.168.1.11)</text>
          <line x1="420" y1="65" x2="355" y2="90" stroke="#818cf8" strokeWidth="1.5" />

          {/* Node 3 */}
          <rect x="460" y="100" width="100" height="40" rx="8" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="510" y="120" fill="#e5e7eb" fontSize="10" fontWeight="600" textAnchor="middle">File Server</text>
          <line x1="460" y1="120" x2="362" y2="115" stroke="#818cf8" strokeWidth="1.5" />

          {/* Node 4 */}
          <rect x="380" y="165" width="90" height="40" rx="8" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="425" y="185" fill="#e5e7eb" fontSize="10" fontWeight="600" textAnchor="middle">Network Printer</text>
          <line x1="390" y1="165" x2="340" y2="145" stroke="#818cf8" strokeWidth="1.5" />

          {/* Node 5 */}
          <rect x="200" y="165" width="90" height="40" rx="8" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="245" y="185" fill="#e5e7eb" fontSize="10" fontWeight="600" textAnchor="middle">PC 3 (192.168.1.12)</text>
          <line x1="265" y1="165" x2="300" y2="145" stroke="#818cf8" strokeWidth="1.5" />
        </svg>
      );

    case 'table_rel':
      return (
        <svg viewBox="0 0 640 200" className="w-full h-auto max-h-[200px]">
          {/* Table 1: Student (Parent Table) */}
          <rect x="30" y="25" width="230" height="150" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="30" y="25" width="230" height="34" rx="10" fill="#1e293b" />
          <text x="45" y="48" fill="#38bdf8" fontSize="12" fontWeight="700">TABLE: Student (Parent)</text>
          
          <rect x="40" y="68" width="210" height="26" fill="#0284c7" fillOpacity="0.2" rx="4" />
          <text x="48" y="85" fill="#f0f9ff" fontSize="10" fontWeight="700">🔑 Student_ID (PK)</text>
          <text x="175" y="85" fill="#7dd3fc" fontSize="9">CHAR(6)</text>
          
          <text x="48" y="112" fill="#cbd5e1" fontSize="10">Full_Name</text>
          <text x="175" y="112" fill="#94a3b8" fontSize="9">VARCHAR(50)</text>
          
          <text x="48" y="136" fill="#cbd5e1" fontSize="10">Date_Of_Birth</text>
          <text x="175" y="136" fill="#94a3b8" fontSize="9">DATE</text>

          <text x="48" y="160" fill="#cbd5e1" fontSize="10">Class_Grade</text>
          <text x="175" y="160" fill="#94a3b8" fontSize="9">INT</text>

          {/* Relationship Link */}
          <path d="M 260 81 C 320 81, 320 81, 370 81" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
          <text x="315" y="72" fill="#f59e0b" fontSize="10" fontWeight="700" textAnchor="middle">1 : M Relationship</text>

          {/* Table 2: Exam_Marks (Child Table) */}
          <rect x="380" y="25" width="230" height="150" rx="10" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
          <rect x="380" y="25" width="230" height="34" rx="10" fill="#1e293b" />
          <text x="395" y="48" fill="#c084fc" fontSize="12" fontWeight="700">TABLE: Exam_Marks (Child)</text>

          <rect x="390" y="68" width="210" height="26" fill="#7e22ce" fillOpacity="0.25" rx="4" />
          <text x="398" y="85" fill="#f3e8ff" fontSize="10" fontWeight="700">🔗 Student_ID (FK)</text>
          <text x="525" y="85" fill="#d8b4fe" fontSize="9">References PK</text>

          <text x="398" y="112" fill="#cbd5e1" fontSize="10">Subject_Code</text>
          <text x="525" y="112" fill="#94a3b8" fontSize="9">VARCHAR(10)</text>

          <text x="398" y="136" fill="#cbd5e1" fontSize="10">Marks_Obtained</text>
          <text x="525" y="136" fill="#94a3b8" fontSize="9">INT (0-100)</text>

          <text x="398" y="160" fill="#cbd5e1" fontSize="10">Term_Exam</text>
          <text x="525" y="160" fill="#94a3b8" fontSize="9">VARCHAR(10)</text>
        </svg>
      );

    case 'cia_triad':
      return (
        <svg viewBox="0 0 640 210" className="w-full h-auto max-h-[210px]">
          {/* CIA Triangle */}
          <polygon points="320,35 170,165 470,165" fill="#064e3b" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />

          {/* Confidentiality Vertex */}
          <circle cx="320" cy="35" r="32" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <text x="320" y="32" fill="#c7d2fe" fontSize="10" fontWeight="800" textAnchor="middle">CONFIDENTIALITY</text>
          <text x="320" y="45" fill="#a5b4fc" fontSize="8" textAnchor="middle">Encryption · Passwords</text>

          {/* Integrity Vertex */}
          <circle cx="170" cy="165" r="32" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="170" y="162" fill="#bae6fd" fontSize="10" fontWeight="800" textAnchor="middle">INTEGRITY</text>
          <text x="170" y="175" fill="#7dd3fc" fontSize="8" textAnchor="middle">Hashing · Backups</text>

          {/* Availability Vertex */}
          <circle cx="470" cy="165" r="32" fill="#3b1d32" stroke="#f472b6" strokeWidth="2" />
          <text x="470" y="162" fill="#fbcfe8" fontSize="10" fontWeight="800" textAnchor="middle">AVAILABILITY</text>
          <text x="470" y="175" fill="#f472b6" fontSize="8" textAnchor="middle">Redundant Servers</text>

          {/* Firewall Shield Left */}
          <rect x="30" y="80" width="95" height="55" rx="10" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
          <text x="77" y="103" fill="#fca5a5" fontSize="11" fontWeight="700" textAnchor="middle">MALWARE</text>
          <text x="77" y="120" fill="#f87171" fontSize="9" textAnchor="middle">Virus · Phishing</text>
          <line x1="125" y1="107" x2="160" y2="135" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Controls Shield Right */}
          <rect x="520" y="80" width="95" height="55" rx="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          <text x="567" y="103" fill="#a7f3d0" fontSize="11" fontWeight="700" textAnchor="middle">DEFENCE</text>
          <text x="567" y="120" fill="#6ee7b7" fontSize="9" textAnchor="middle">Firewall · 2FA</text>
          <line x1="520" y1="107" x2="480" y2="135" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );

    case 'sdlc_cycle':
      return (
        <svg viewBox="0 0 640 180" className="w-full h-auto max-h-[180px]">
          {/* Stepper Pipeline */}
          {[
            { step: '1. Identification', sub: 'Define Problem', col: '#38bdf8' },
            { step: '2. Analysis', sub: 'Gather Needs', col: '#818cf8' },
            { step: '3. Design', sub: 'ER & UI Logic', col: '#c084fc' },
            { step: '4. Coding', sub: 'Develop App', col: '#f472b6' },
            { step: '5. Testing', sub: 'UAT & Bugs', col: '#fbbf24' },
            { step: '6. Deploy', sub: 'Production', col: '#34d399' },
          ].map((item, idx) => {
            const x = 20 + idx * 102;
            return (
              <g key={idx}>
                <rect x={x} y="40" width="95" height="80" rx="10" fill="#0f172a" stroke={item.col} strokeWidth="1.5" />
                <circle cx={x + 18} cy="58" r="10" fill={item.col} fillOpacity="0.2" />
                <text x={x + 18} y="62" fill={item.col} fontSize="10" fontWeight="800" textAnchor="middle">{idx + 1}</text>
                <text x={x + 47} y="85" fill="#f8fafc" fontSize="10" fontWeight="700" textAnchor="middle">{item.step.split('. ')[1]}</text>
                <text x={x + 47} y="102" fill="#94a3b8" fontSize="8" textAnchor="middle">{item.sub}</text>
                {idx < 5 && (
                  <path d={`M ${x + 95} 80 L ${x + 102} 80`} stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
                )}
              </g>
            );
          })}
        </svg>
      );

    default:
      // Universal IPO Pipeline
      return (
        <svg viewBox="0 0 640 160" className="w-full h-auto max-h-[160px]">
          {/* Input Box */}
          <rect x="30" y="35" width="150" height="90" rx="12" fill="#0f2942" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="105" y="70" fill="#bae6fd" fontSize="13" fontWeight="800" textAnchor="middle">INPUT</text>
          <text x="105" y="92" fill="#7dd3fc" fontSize="10" textAnchor="middle">Raw Facts · User Data</text>

          {/* Arrow 1 */}
          <line x1="180" y1="80" x2="245" y2="80" stroke="#38bdf8" strokeWidth="2.5" />
          <polygon points="245,80 235,74 235,86" fill="#38bdf8" />

          {/* Process Box */}
          <rect x="245" y="30" width="160" height="100" rx="14" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <text x="325" y="68" fill="#c7d2fe" fontSize="14" fontWeight="800" textAnchor="middle">PROCESS</text>
          <text x="325" y="90" fill="#a5b4fc" fontSize="10" textAnchor="middle">Calculations · Sorting · Rules</text>

          {/* Arrow 2 */}
          <line x1="405" y1="80" x2="470" y2="80" stroke="#34d399" strokeWidth="2.5" />
          <polygon points="470,80 460,74 460,86" fill="#34d399" />

          {/* Output Box */}
          <rect x="470" y="35" width="140" height="90" rx="12" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          <text x="540" y="70" fill="#a7f3d0" fontSize="13" fontWeight="800" textAnchor="middle">OUTPUT</text>
          <text x="540" y="92" fill="#6ee7b7" fontSize="10" textAnchor="middle">Meaningful Information</text>
        </svg>
      );
  }
};

/**
 * EARAConceptMap
 * Highly responsive, explainable concept diagram and state-adaptive engagement helper.
 */
const EARAConceptMap = ({ topicId, learningState = 'understanding', question = '' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showBrainAnswer, setShowBrainAnswer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getEaraDiagram(topicId, learningState, question)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setShowBrainAnswer(false);
          setSelectedNode(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load EARA diagram:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topicId, learningState, question]);

  const stateBadgeInfo = {
    bored: {
      label: '⚡ Engagement Booster · Topic Architecture',
      color: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
      icon: Flame,
    },
    not_understanding: {
      label: '🧩 Step-by-Step Breakdown · Simplified',
      color: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
      icon: Lightbulb,
    },
    distracted: {
      label: '🎯 Focus Mode · Essential Exam Core',
      color: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
      icon: Zap,
    },
    understanding: {
      label: '🌟 O/L ICT Concept Architecture',
      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
      icon: BrainCircuit,
    },
  }[learningState] || {
    label: 'EARA Explainability Diagram',
    color: 'bg-primary/15 text-primary border-primary/35',
    icon: BrainCircuit,
  };

  const StateIcon = stateBadgeInfo.icon;

  return (
    <div className="eara-diagram-container mt-4 mb-2 w-full rounded-2xl border border-primary/25 bg-[#040e07] overflow-hidden shadow-2xl">
      {/* Header bar with generous padding */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/[0.08] bg-black/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
            <BrainCircuit size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                EARA Visual Architecture
              </span>
              {data && (
                <span className="text-xs font-semibold text-white/90">
                  — {data.topicName}
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-muted">
              Dynamic concept map & cognitive state explainability 
              <br></br>
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${stateBadgeInfo.color}`}>
          <StateIcon size={13} />
          <span>{stateBadgeInfo.label}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-10 text-text-muted text-sm">
            <Sparkles size={16} className="animate-spin text-primary" />
            Loading topic-tailored concept diagram...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>Could not load the concept diagram. The chatbot will continue with text explanation.</span>
          </div>
        )}

        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* ── 1. Interactive Topic SVG Schematic Canvas ── */}
            <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Layers size={13} />
                  Visual Schematic
                </span>
                <span className="text-[10px] font-medium text-white/50 hidden sm:inline">
                  Architectural Concept Map
                </span>
                <span className="text-[10px] font-medium text-primary/70 sm:hidden">
                  Scroll horizontally →
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar pb-1">
                <div className="min-w-[560px]">
                  <TopicSVGSchematic
                    schematicType={data.schematicType}
                    topicName={data.topicName}
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Concept Nodes Grid (Comfortable 3-column / 2-column Spacing) ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Cpu size={13} />
                  Concept Nodes ({data.diagram.nodes.length})
                </span>
                <br></br> 
                <br></br>
                <span className="text-[10px] text-white/50">
                  Click any node to read full details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {data.diagram.nodes.map((node) => {
                  const col = getNodeColor(node.type);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <motion.button
                      key={node.id}
                      type="button"
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                      className={`text-left rounded-xl border p-3.5 transition-all relative ${col.bg} ${col.border} ${
                        isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/25 scale-[1.015]' : 'hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${col.badge}`}>
                          {node.type}
                        </span>
                        {isSelected && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                      </div>
                      <div className="text-xs font-bold leading-snug text-white">
                        {node.label}
                      </div>
                      <p className="text-[11px] text-white/70 line-clamp-2 mt-1 leading-relaxed">
                        {node.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Drawer / Detail View */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs space-y-1.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary uppercase text-[11px]">
                      Node Details: {selectedNode.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedNode(null)}
                      className="text-[10px] text-white/50 hover:text-white"
                    >
                      Close ✕
                    </button>
                  </div>
                  <p className="text-white/90 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 3. Concept Relationship Connections Flow ── */}
            {data.diagram.edges?.length > 0 && (
              <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <Network size={12} />
                  Concept Connections & Flow
                </div>
                <br></br>
                
                <div className="flex flex-wrap gap-2">
                  {data.diagram.edges.map((edge, i) => {
                    const nodeMap = Object.fromEntries((data.diagram.nodes || []).map((n) => [n.id, n.label]));
                    const fromLabel = nodeMap[edge.from] || edge.from;
                    const toLabel = nodeMap[edge.to] || edge.to;
                    return (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs shadow-sm"
                      >
                        <span className="font-semibold text-white">{fromLabel}</span>
                        <span className="text-primary font-bold">→</span>
                        <span className="text-emerald-400/80 italic text-[11px]">{edge.label}</span>
                        <span className="text-primary font-bold">→</span>
                        <span className="font-semibold text-white">{toLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
<br></br>
            {/* ── 4. Real-World Analogy (Crucial for not_understanding) ── */}
            {data.analogy && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <Lightbulb size={16} />
                </div>
                
                <div> 
                  
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    Everyday Real-World Analogy
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {data.analogy}
                  </p>
                </div>
              </div>
            )}
<br></br>
            {/* ── 5. Brain Challenge (Crucial for bored state) ── */}
            {data.brainChallenge && (
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-orange-400">
                    <Zap size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Interactive Brain Challenge
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBrainAnswer((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-300 hover:text-white px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40"
                  >
                    {showBrainAnswer ? 'Hide Hint' : 'Think & Reveal'}
                    {showBrainAnswer ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
                <p className="text-xs text-white/95 leading-relaxed font-semibold">
                  {data.brainChallenge}
                </p>
                {showBrainAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2 border-t border-orange-500/20 text-[11px] text-orange-200"
                  >
                    💡 <span className="font-semibold">Review the diagram above:</span> check the key fact and core nodes for the exact answer, or type your thoughts right into the chatbot!
                  </motion.div>
                )}
              </div>
            )}
<br></br>
            {/* ── 6. Summary + Key Fact & Study Tip ── */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl bg-primary/10 border border-primary/25 p-3.5 flex items-start gap-2.5">
                <Zap size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                    Exam Key Fact
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    {data.keyFact}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-start gap-2.5">
                <BookOpen size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Study Guidance
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    {data.stateTip}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EARAConceptMap;
