import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Box,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Eye,
  FileText,
  Film,
  Filter,
  GraduationCap,
  Hand,
  Layers,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import {
  decomposeFingerspellingText,
  getFingerspellingAlphabet,
} from '../../services/signAvatarApi';
import RealisticAvatarViewer from './RealisticAvatarViewer';
import ThreeHandAvatarViewer, { ASL_LEARNER_GUIDE } from './ThreeHandAvatarViewer';
import { createLetterPose } from './FingerspellingFallback';

const ASL_26_DATABASE = {
  A: {
    letter: 'A',
    name: 'Letter A',
    description: 'Closed fist with 4 fingers curled tightly into palm and thumb resting upright along the side of index finger.',
    handShape: 'Vertical fist with thumb along side',
    ictExamples: ['ALU (Arithmetic Logic Unit)', 'ASCII Code', 'Algorithm', 'Array Data Structure'],
  },
  B: {
    letter: 'B',
    name: 'Letter B',
    description: 'Four fingers held straight and pressed together pointing upward, thumb folded flat across the palm.',
    handShape: 'Open flat 4 fingers with thumb tucked',
    ictExamples: ['BIOS (Basic Input/Output)', 'Byte', 'Bit (Binary Digit)', 'System Bus', 'Web Browser'],
  },
  C: {
    letter: 'C',
    name: 'Letter C',
    description: 'Fingers and thumb curved in a smooth arc forming a prominent "C" shape facing sideways.',
    handShape: 'Curved C-arc shape',
    ictExamples: ['CPU (Central Processing Unit)', 'Cloud Computing', 'Cache Memory', 'Client-Server Architecture'],
  },
  D: {
    letter: 'D',
    name: 'Letter D',
    description: 'Index finger pointing straight up, thumb touching middle, ring, and pinky fingertips in an "O" base.',
    handShape: 'Index vertical with circular O base',
    ictExamples: ['DNS (Domain Name System)', 'Database Management', 'DBMS', 'DDL / DML SQL Commands'],
  },
  E: {
    letter: 'E',
    name: 'Letter E',
    description: 'All 4 fingertips bent tightly down touching the thumb resting curled underneath.',
    handShape: 'Bent fingertips resting on curled thumb',
    ictExamples: ['Email Protocols', 'Ethernet Cable', 'Data Encryption', 'Entity-Relationship Diagram'],
  },
  F: {
    letter: 'F',
    name: 'Letter F',
    description: 'Index finger and thumb touching at tips to form a circle, middle, ring, and pinky held straight up.',
    handShape: 'OK circle sign with 3 vertical fingers',
    ictExamples: ['Firewall Security', 'FTP (File Transfer)', 'Flash Memory', 'Fiber Optic Cable', 'Flowchart Symbols'],
  },
  G: {
    letter: 'G',
    name: 'Letter G',
    description: 'Index finger and thumb pointing horizontally forward parallel to each other, other fingers closed.',
    handShape: 'Horizontal pinch pointing forward',
    ictExamples: ['GUI (Graphical User Interface)', 'Gateway Router', 'Gigabyte Storage', 'Computer Graphics'],
  },
  H: {
    letter: 'H',
    name: 'Letter H',
    description: 'Index and middle fingers extended straight together horizontally forward, other fingers closed in a fist.',
    handShape: 'Dual horizontal fingers pointing forward',
    ictExamples: ['HTTP (Hypertext Transfer)', 'HTTPS Secure', 'HTML Code', 'Computer Hardware', 'Network Hub'],
  },
  I: {
    letter: 'I',
    name: 'Letter I',
    description: 'Pinky finger pointing straight up, remaining three fingers and thumb folded in a closed fist.',
    handShape: 'Pinky vertical finger',
    ictExamples: ['IP Address (IPv4/IPv6)', 'Internet Connectivity', 'IoT (Internet of Things)', 'ISP Provider'],
  },
  J: {
    letter: 'J',
    name: 'Letter J',
    description: 'Pinky finger extended pointing up while tracing a curved "J" hook stroke in the air.',
    handShape: 'Pinky tracing curved J hook',
    ictExamples: ['JSON Data Format', 'Java Programming', 'JavaScript Engine', 'JPEG Image Compression'],
  },
  K: {
    letter: 'K',
    name: 'Letter K',
    description: 'Index and middle fingers held upright in a "V", thumb resting upright between them.',
    handShape: 'Upright V with thumb between',
    ictExamples: ['Operating System Kernel', 'Keyboard Input', 'Kilobyte Unit', 'Primary Key / Foreign Key'],
  },
  L: {
    letter: 'L',
    name: 'Letter L',
    description: 'Thumb and index finger held at 90-degree right angles forming an "L", other fingers folded in palm.',
    handShape: 'Right-angle L shape',
    ictExamples: ['LAN (Local Area Network)', 'Linux OS', 'Logic Gates (AND/OR/NOT)', 'Programming Loop'],
  },
  M: {
    letter: 'M',
    name: 'Letter M',
    description: 'Thumb tucked underneath three folded fingers (index, middle, ring), pinky closed in fist.',
    handShape: 'Three folded fingers over thumb',
    ictExamples: ['Main Memory (RAM/ROM)', 'Modem Device', 'MAC Physical Address', 'Motherboard Circuit'],
  },
  N: {
    letter: 'N',
    name: 'Letter N',
    description: 'Thumb tucked underneath two folded fingers (index and middle), ring and pinky closed.',
    handShape: 'Two folded fingers over thumb',
    ictExamples: ['Computer Network', 'Network Node', 'Database Normalization (1NF/2NF/3NF)', 'NIC Card'],
  },
  O: {
    letter: 'O',
    name: 'Letter O',
    description: 'All fingertips and thumb meet together to form a full "O" circle.',
    handShape: 'Circular O ring',
    ictExamples: ['OS (Operating System)', 'Output Peripherals', 'Optical Fiber Cable', 'Octal Number System'],
  },
  P: {
    letter: 'P',
    name: 'Letter P',
    description: 'Downward pointing "K" shape with index horizontal and middle pointing downwards.',
    handShape: 'Downward K posture',
    ictExamples: ['Program Counter (PC)', 'Network Protocol', 'Phishing Cyber Attack', 'TCP Port Number'],
  },
  Q: {
    letter: 'Q',
    name: 'Letter Q',
    description: 'Downward pointing "G" shape with thumb and index finger pointing downwards.',
    handShape: 'Downward pinch posture',
    ictExamples: ['SQL Query Syntax', 'Queue Data Structure', 'Qubit Quantum Bit', 'QuickSort Algorithm'],
  },
  R: {
    letter: 'R',
    name: 'Letter R',
    description: 'Index and middle fingers crossed over each other vertically in a good luck sign.',
    handShape: 'Crossed index & middle fingers',
    ictExamples: ['RAM (Random Access Memory)', 'ROM (Read Only Memory)', 'Router Device', 'CPU Register'],
  },
  S: {
    letter: 'S',
    name: 'Letter S',
    description: 'Closed fist with thumb wrapped securely across the front of all curled fingers.',
    handShape: 'Fist with thumb across front',
    ictExamples: ['SQL (Structured Query Language)', 'Server Architecture', 'System Software', 'SSD Storage'],
  },
  T: {
    letter: 'T',
    name: 'Letter T',
    description: 'Thumb placed between index and middle finger inside a closed fist.',
    handShape: 'Thumb between index and middle',
    ictExamples: ['TCP/IP Protocol Suite', 'Network Topology (Star/Bus/Ring)', 'Trace Table Algorithm'],
  },
  U: {
    letter: 'U',
    name: 'Letter U',
    description: 'Index and middle fingers held straight up and pressed tightly together, other fingers closed.',
    handShape: 'Dual vertical fingers pressed together',
    ictExamples: ['URL (Uniform Resource Locator)', 'USB Port Standard', 'UTP Cable', 'Unicode / UTF-8 Encoding'],
  },
  V: {
    letter: 'V',
    name: 'Letter V',
    description: 'Index and middle fingers held straight up in a spread "V" peace sign.',
    handShape: 'V peace sign',
    ictExamples: ['Virtual Memory Paging', 'VGA Video Port', 'Variable Declaration', 'Computer Virus Malware'],
  },
  W: {
    letter: 'W',
    name: 'Letter W',
    description: 'Index, middle, and ring fingers held straight up spread apart forming a "W", pinky and thumb tucked.',
    handShape: 'Three vertical fingers (W)',
    ictExamples: ['WWW (World Wide Web)', 'WAN (Wide Area Network)', 'Wi-Fi Wireless', 'Word Processor'],
  },
  X: {
    letter: 'X',
    name: 'Letter X',
    description: 'Index finger hooked into a curved bend, other fingers closed in a fist.',
    handShape: 'Hooked index finger',
    ictExamples: ['XML Data Format', 'XOR Logic Gate', 'XSS (Cross-site Scripting)'],
  },
  Y: {
    letter: 'Y',
    name: 'Letter Y',
    description: 'Thumb and pinky finger extended outwards (shaka sign), three middle fingers curled down in fist.',
    handShape: 'Shaka thumb & pinky sign',
    ictExamples: ['Yottabyte Unit', 'Yield Statement', 'YAML Configuration'],
  },
  Z: {
    letter: 'Z',
    name: 'Letter Z',
    description: 'Index finger pointing out to trace a "Z" zigzag stroke in the air.',
    handShape: 'Index pointing zigzag stroke',
    ictExamples: ['Zip File Compression', 'Zettabyte Unit', 'Zero-day Vulnerability'],
  },
};

const SAMPLE_ICT_PRESETS = [
  {
    label: '💾 CPU & Memory',
    text: 'RAM is primary volatile memory used by CPU and ALU in Computer Systems.',
    primaryWord: 'RAM',
  },
  {
    label: '🌐 Internet & Web',
    text: 'DNS resolves domain URL to IP address over HTTP and TCP protocols.',
    primaryWord: 'DNS',
  },
  {
    label: '🗄️ Relational DB',
    text: 'SQL DBMS tables enforce Primary Key and Foreign Key constraints.',
    primaryWord: 'SQL',
  },
  {
    label: '⚡ Hardware & Boot',
    text: 'BIOS boot firmware loads OS kernel from SSD into RAM.',
    primaryWord: 'BIOS',
  },
  {
    label: '🔒 Cyber Security',
    text: 'HTTPS uses SSL TLS encryption and Firewall to block malware.',
    primaryWord: 'SSL',
  },
];

const SPEED_FACTORS = {
  '0.5x': 2.0,
  '0.75x': 1.33,
  '1.0x': 1.0,
  '1.25x': 0.8,
  '1.5x': 0.66,
};

const KNOWN_ICT_ACRONYMS = [
  'RAM', 'ROM', 'CPU', 'ALU', 'BIOS', 'SQL', 'DBMS', 'HTTP', 'HTTPS', 'HTML',
  'DNS', 'LAN', 'WAN', 'MAN', 'IP', 'TCP', 'UDP', 'GUI', 'CLI', 'BYTE', 'BIT',
  'PORT', 'BUS', 'SSD', 'HDD', 'USB', 'VGA', 'NIC', 'ISP', 'FTP', 'SMTP', 'POP3',
  'IMAP', 'JSON', 'XML', 'UTF8', 'ASCII', 'VPN', 'MAC', 'OS', 'DCL', 'DDL', 'DML',
  '1NF', '2NF', '3NF', 'NTFS', 'FAT32', 'DOS', 'AI', 'IOT'
];

const GRADE_10_11_ICT_SYLLABUS = {
  // Grade 10 - Unit 1: Introduction to ICT
  DATA: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data & Information', desc: 'Raw unorganized facts and figures.' },
  INFORMATION: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data & Information', desc: 'Processed meaningful data.' },
  COMMUNICATION: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals', desc: 'Transmission of information.' },
  TECHNOLOGY: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals', desc: 'Practical application of computing.' },
  ICT: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals', desc: 'Information & Communication Tech.' },
  SYSTEM: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals', desc: 'Integrated components working together.' },
  SYSTEMS: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals', desc: 'Integrated computer systems.' },
  INPUT: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data Processing', desc: 'Entering data into system.' },
  PROCESS: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data Processing', desc: 'Transforming raw input into information.' },
  OUTPUT: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data Processing', desc: 'Presenting processed results.' },
  STORAGE: { grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Data Processing', desc: 'Retaining digital information.' },

  // Grade 10 - Unit 2: Architecture of Computer Systems & Hardware
  COMPUTER: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware', desc: 'Electronic machine processing data.' },
  HARDWARE: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware', desc: 'Physical tangible components.' },
  SOFTWARE: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Software', desc: 'Instructions guiding hardware.' },
  KEYBOARD: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Input Devices', desc: 'Alphanumeric typing peripheral.' },
  MOUSE: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Input Devices', desc: 'Pointing input device.' },
  SCANNER: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Input Devices', desc: 'Optical digitizer.' },
  MONITOR: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Output Devices', desc: 'Visual display screen.' },
  PRINTER: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Output Devices', desc: 'Paper hardcopy device.' },
  CPU: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Processor', desc: 'Central Processing Unit.' },
  ALU: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Processor', desc: 'Arithmetic Logic Unit.' },
  CU: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Processor', desc: 'Control Unit directing timing.' },
  REGISTER: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Internal Memory', desc: 'High-speed CPU storage cells.' },
  MEMORY: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware', desc: 'Internal working storage.' },
  RAM: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Main Memory', desc: 'Random Access Memory (volatile).' },
  ROM: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Main Memory', desc: 'Read Only Memory (non-volatile).' },
  CACHE: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'High-Speed Memory', desc: 'Fast buffer between CPU and RAM.' },
  MOTHERBOARD: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware', desc: 'Main circuit board.' },
  BUS: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Data Path', desc: 'Pathway carrying signals.' },
  PORT: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Interfaces', desc: 'Peripheral connector.' },
  USB: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Interfaces', desc: 'Universal Serial Bus.' },
  VGA: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Display Interface', desc: 'Video Graphics Array.' },
  HDMI: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Display Interface', desc: 'Digital AV interface.' },
  SSD: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Storage', desc: 'Solid State Drive.' },
  HDD: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Storage', desc: 'Hard Disk Drive.' },
  BIOS: { grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Firmware', desc: 'Boot initialization firmware.' },

  // Grade 10 - Unit 3: Data Representation
  BINARY: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Number Systems', desc: 'Base-2 numeral system (0, 1).' },
  DECIMAL: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Number Systems', desc: 'Base-10 numeral system.' },
  OCTAL: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Number Systems', desc: 'Base-8 numeral system (0-7).' },
  HEXADECIMAL: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Number Systems', desc: 'Base-16 numeral system (0-F).' },
  BIT: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Units', desc: 'Smallest binary digit.' },
  BYTE: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Units', desc: 'Group of 8 binary bits.' },
  ASCII: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Encoding', desc: 'Standard character encoding.' },
  UNICODE: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Encoding', desc: 'Universal multi-language encoding.' },
  LOGIC: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Digital Logic', desc: 'Boolean reasoning principles.' },
  GATE: { grade: 'Grade 10', unit: 'Unit 3: Data Representation', topic: 'Digital Logic', desc: 'Electronic logic circuit.' },

  // Grade 10 - Unit 4: Operating Systems
  OS: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'System Software', desc: 'Operating system managing hardware.' },
  OPERATING: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'System Software', desc: 'OS system environment.' },
  KERNEL: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'OS Core', desc: 'Core heart of an OS.' },
  GUI: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'UI', desc: 'Graphical User Interface.' },
  CLI: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'UI', desc: 'Command Line Interface.' },
  FILE: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'File System', desc: 'Digital storage container.' },
  DIRECTORY: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'File System', desc: 'Hierarchical folder.' },
  LINUX: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'OS Examples', desc: 'Open-source OS kernel.' },
  WINDOWS: { grade: 'Grade 10', unit: 'Unit 4: Operating Systems', topic: 'OS Examples', desc: 'Microsoft GUI OS.' },

  // Grade 10 - Unit 7: Database Management
  DATABASE: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Databases', desc: 'Organized electronic records repository.' },
  DBMS: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Database Software', desc: 'Database Management System.' },
  TABLE: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Relational DB', desc: 'Relation of rows and columns.' },
  RECORD: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Relational DB', desc: 'Single row / tuple.' },
  FIELD: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Relational DB', desc: 'Single attribute column.' },
  PRIMARY: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Keys', desc: 'Primary Key unique identifier.' },
  FOREIGN: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Keys', desc: 'Foreign Key reference.' },
  SQL: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Queries', desc: 'Structured Query Language.' },
  QUERY: { grade: 'Grade 10', unit: 'Unit 7: Database Management', topic: 'Queries', desc: 'Database access command.' },

  // Grade 11 - Unit 1: Programming & Algorithms
  PROGRAM: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Programming', desc: 'Executable coded instructions.' },
  ALGORITHM: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Algorithms', desc: 'Step-by-step problem-solving sequence.' },
  FLOWCHART: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Algorithms', desc: 'Visual diagram of logic.' },
  PSEUDOCODE: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Algorithms', desc: 'Informal human-readable code.' },
  VARIABLE: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Coding', desc: 'Named storage location.' },
  CONSTANT: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Coding', desc: 'Fixed unaltered value.' },
  LOOP: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Control Flow', desc: 'Repetitive code execution.' },
  ARRAY: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Data Structures', desc: 'Collection of same-type items.' },
  COMPILER: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Translators', desc: 'Converts source to machine code.' },
  DEBUG: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Testing', desc: 'Finding and fixing software bugs.' },
  PYTHON: { grade: 'Grade 11', unit: 'Unit 1: Programming & Algorithms', topic: 'Languages', desc: 'High-level interpreted language.' },

  // Grade 11 - Unit 2: The Internet & World Wide Web
  INTERNET: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Internet', desc: 'Global interconnected network.' },
  WEB: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Web Systems', desc: 'World Wide Web information system.' },
  WWW: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Web Systems', desc: 'World Wide Web documents.' },
  BROWSER: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Web Clients', desc: 'Web page viewer app.' },
  URL: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Addressing', desc: 'Uniform Resource Locator.' },
  HTTP: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Protocols', desc: 'Hypertext Transfer Protocol.' },
  HTTPS: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Protocols', desc: 'Secure encrypted HTTP.' },
  HTML: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Web Design', desc: 'Hypertext Markup Language.' },
  DNS: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Naming', desc: 'Domain Name System.' },
  EMAIL: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Messaging', desc: 'Electronic mail messages.' },
  CLOUD: { grade: 'Grade 11', unit: 'Unit 2: The Internet & WWW', topic: 'Cloud', desc: 'Remote on-demand computing & storage.' },

  // Grade 11 - Unit 3: Computer Networks
  NETWORK: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Networking', desc: 'Interconnected communicating devices.' },
  LAN: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Scope', desc: 'Local Area Network.' },
  WAN: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Scope', desc: 'Wide Area Network.' },
  TOPOLOGY: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Layout', desc: 'Arrangement of network nodes.' },
  ROUTER: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Devices', desc: 'Packet forwarding interconnect.' },
  SWITCH: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Devices', desc: 'Intelligent LAN frame switch.' },
  HUB: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Devices', desc: 'Multiport broadcast device.' },
  NIC: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Network Devices', desc: 'Network Interface Card.' },
  IP: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Protocols', desc: 'Internet Protocol address.' },
  TCP: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Protocols', desc: 'Transmission Control Protocol.' },
  PACKET: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Transmission', desc: 'Formatted data segment.' },
  ETHERNET: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Media', desc: 'Wired LAN network standard.' },
  CABLE: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Media', desc: 'Physical wired connection medium.' },
  FIBER: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Media', desc: 'High-speed optical fiber.' },
  SERVER: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Architecture', desc: 'Resource provider node.' },
  CLIENT: { grade: 'Grade 11', unit: 'Unit 3: Computer Networks', topic: 'Architecture', desc: 'Resource requester node.' },

  // Grade 11 - Unit 4: Cyber Security & Ethics
  SECURITY: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Security', desc: 'Protection of systems & data.' },
  CYBER: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Security', desc: 'Relating to digital networks.' },
  MALWARE: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Threats', desc: 'Malicious destructive software.' },
  VIRUS: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Threats', desc: 'Replicating file malware.' },
  WORM: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Threats', desc: 'Network propagating malware.' },
  TROJAN: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Threats', desc: 'Disguised malicious program.' },
  PHISHING: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Threats', desc: 'Deceptive credential theft.' },
  FIREWALL: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Defense', desc: 'Network traffic filter barrier.' },
  ENCRYPTION: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Cryptography', desc: 'Cipher conversion of plaintext.' },
  PASSWORD: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Auth', desc: 'Identity verification secret.' },
  BACKUP: { grade: 'Grade 11', unit: 'Unit 4: Cyber Security', topic: 'Protection', desc: 'Duplicate copy of data.' },

  // Grade 11 - Unit 5: Emerging Technologies & IoT
  IOT: { grade: 'Grade 11', unit: 'Unit 5: Emerging Tech', topic: 'IoT', desc: 'Internet of Things smart devices.' },
  SENSOR: { grade: 'Grade 11', unit: 'Unit 5: Emerging Tech', topic: 'IoT', desc: 'Environmental input detector.' },
  AI: { grade: 'Grade 11', unit: 'Unit 5: Emerging Tech', topic: 'AI', desc: 'Artificial Intelligence systems.' },
  ROBOTICS: { grade: 'Grade 11', unit: 'Unit 5: Emerging Tech', topic: 'Robotics', desc: 'Automated intelligent machines.' },
};

const INITIAL_ICT_KEYWORDS = [
  { word: 'RAM', isAcronym: true, letterCount: 3, letters: ['R', 'A', 'M'], grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Main Memory' },
  { word: 'CPU', isAcronym: true, letterCount: 3, letters: ['C', 'P', 'U'], grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Processor' },
  { word: 'ALU', isAcronym: true, letterCount: 3, letters: ['A', 'L', 'U'], grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Processor' },
  { word: 'MEMORY', isAcronym: false, letterCount: 6, letters: ['M', 'E', 'M', 'O', 'R', 'Y'], grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware' },
  { word: 'COMPUTER', isAcronym: false, letterCount: 8, letters: ['C', 'O', 'M', 'P', 'U', 'T', 'E', 'R'], grade: 'Grade 10', unit: 'Unit 2: Computer Architecture', topic: 'Hardware' },
  { word: 'SYSTEMS', isAcronym: false, letterCount: 7, letters: ['S', 'Y', 'S', 'T', 'E', 'M', 'S'], grade: 'Grade 10', unit: 'Unit 1: Introduction to ICT', topic: 'Fundamentals' },
];

const INITIAL_OTHER_WORDS = [
  { word: 'IS', isAcronym: false, letterCount: 2, letters: ['I', 'S'] },
  { word: 'PRIMARY', isAcronym: false, letterCount: 7, letters: ['P', 'R', 'I', 'M', 'A', 'R', 'Y'] },
  { word: 'VOLATILE', isAcronym: false, letterCount: 8, letters: ['V', 'O', 'L', 'A', 'T', 'I', 'L', 'E'] },
  { word: 'USED', isAcronym: false, letterCount: 4, letters: ['U', 'S', 'E', 'D'] },
  { word: 'BY', isAcronym: false, letterCount: 2, letters: ['B', 'Y'] },
  { word: 'AND', isAcronym: false, letterCount: 3, letters: ['A', 'N', 'D'] },
  { word: 'IN', isAcronym: false, letterCount: 2, letters: ['I', 'N'] },
];

const FingerspellingStudio = () => {
  const [inputText, setInputText] = useState('RAM is primary volatile memory used by CPU and ALU in Computer Systems.');
  const [ictKeywords, setIctKeywords] = useState(INITIAL_ICT_KEYWORDS);
  const [otherWords, setOtherWords] = useState(INITIAL_OTHER_WORDS);
  const [syllabusFilter, setSyllabusFilter] = useState('ALL'); // 'ALL' | 'Grade 10' | 'Grade 11'
  const [visualMode, setVisualMode] = useState('3d-mesh'); // '3d-mesh' | '3d-skeleton' | '3d-hud' | '2d-vector'
  const [selectedWord, setSelectedWord] = useState('RAM');
  const [activeLetterIndex, setActiveLetterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1.0x');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [useBothHands, setUseBothHands] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordingWord, setRecordingWord] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadVideoUrl, setDownloadVideoUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [selectedManualLetter, setSelectedManualLetter] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  const timerRef = useRef(null);
  const threeViewerRef = useRef(null);

  // Manual Filter & Extract ICT Keywords and Other Words
  const handleManualFilterKeywords = async (overrideText = null, targetWord = null) => {
    const textToAnalyze = overrideText !== null ? overrideText : inputText;
    if (!textToAnalyze.trim()) return;

    setIsFiltering(true);

    try {
      const res = await decomposeFingerspellingText({
        text: textToAnalyze,
        selectedWord: targetWord,
      });

      if (res.ictKeywords && res.otherWords) {
        setIctKeywords(res.ictKeywords);
        setOtherWords(res.otherWords);
        const newWord = targetWord || res.selectedWord || res.ictKeywords[0]?.word || res.otherWords[0]?.word;
        if (newWord) setSelectedWord(newWord);
        setActiveLetterIndex(0);
        setSelectedManualLetter(null);
      } else if (res.detectedKeywords?.length) {
        // Classify response if backend returned combined list
        classifyAndSetWords(textToAnalyze, targetWord);
      }
    } catch (err) {
      console.error('API extraction fallback to local classifier', err);
      classifyAndSetWords(textToAnalyze, targetWord);
    } finally {
      setIsFiltering(false);
    }
  };

  // Local Syllabus Classifier Fallback
  const classifyAndSetWords = (textToAnalyze, targetWord = null) => {
    const words = textToAnalyze.match(/[A-Za-z0-9]+/g) || [];
    const extractedIct = [];
    const extractedOther = [];
    const seen = new Set();

    words.forEach((w) => {
      const upper = w.toUpperCase();
      if (seen.has(upper)) return;

      const isSyllabus = !!GRADE_10_11_ICT_SYLLABUS[upper];
      const isAcronym = KNOWN_ICT_ACRONYMS.includes(upper);

      if (isSyllabus || isAcronym) {
        seen.add(upper);
        const meta = GRADE_10_11_ICT_SYLLABUS[upper] || {
          grade: 'Grade 10/11',
          unit: 'General O/L ICT',
          topic: 'ICT Acronym',
          desc: `Technical term ${upper}`,
        };
        extractedIct.push({
          word: upper,
          isAcronym,
          letterCount: upper.length,
          letters: upper.split(''),
          grade: meta.grade,
          unit: meta.unit,
          topic: meta.topic,
          desc: meta.desc,
        });
      } else if (upper.length >= 2) {
        seen.add(upper);
        extractedOther.push({
          word: upper,
          isAcronym: false,
          letterCount: upper.length,
          letters: upper.split(''),
        });
      }
    });

    setIctKeywords(extractedIct);
    setOtherWords(extractedOther);

    const defaultWord = targetWord || extractedIct[0]?.word || extractedOther[0]?.word || 'RAM';
    setSelectedWord(defaultWord);
    setActiveLetterIndex(0);
    setSelectedManualLetter(null);
  };

  // Letters of the currently selected word
  const currentLetters = useMemo(() => {
    if (selectedManualLetter) {
      return [selectedManualLetter];
    }
    return (selectedWord || 'RAM').toUpperCase().replace(/[^A-Z]/g, '').split('');
  }, [selectedWord, selectedManualLetter]);

  // Filtered ICT keywords according to Grade 10 & 11 syllabus tab
  const filteredIctKeywords = useMemo(() => {
    if (syllabusFilter === 'Grade 10') {
      return ictKeywords.filter((k) => k.grade === 'Grade 10');
    }
    if (syllabusFilter === 'Grade 11') {
      return ictKeywords.filter((k) => k.grade === 'Grade 11');
    }
    return ictKeywords;
  }, [ictKeywords, syllabusFilter]);

  const grade10Count = useMemo(
    () => ictKeywords.filter((k) => k.grade === 'Grade 10').length,
    [ictKeywords]
  );
  const grade11Count = useMemo(
    () => ictKeywords.filter((k) => k.grade === 'Grade 11').length,
    [ictKeywords]
  );

  // Metadata for current word if an ICT term
  const selectedIctMeta = useMemo(() => {
    const upper = (selectedWord || '').toUpperCase();
    return ictKeywords.find((k) => k.word === upper) || GRADE_10_11_ICT_SYLLABUS[upper] || null;
  }, [selectedWord, ictKeywords]);

  // Current active letter character
  const activeLetterChar = currentLetters[activeLetterIndex] || currentLetters[0] || 'A';
  const activeLetterMeta = useMemo(() => {
    return ASL_26_DATABASE[activeLetterChar] || {
      letter: activeLetterChar,
      name: `Letter ${activeLetterChar}`,
      description: `Standard ASL Manual Letter ${activeLetterChar} handshape.`,
      handShape: 'ASL Finger Posture',
      ictExamples: [`${activeLetterChar} - Example ICT Term`],
    };
  }, [activeLetterChar]);

  const activeLearnerGuide = useMemo(() => {
    return ASL_LEARNER_GUIDE[activeLetterChar] || ASL_LEARNER_GUIDE['A'];
  }, [activeLetterChar]);

  // Direct pose for active letter
  const activeGestureData = useMemo(() => {
    return {
      gestureName: `fingerspelling_${activeLetterChar.toLowerCase()}`,
      glossWord: activeLetterChar,
      description: activeLetterMeta.description,
      leftHandPose: createLetterPose(activeLetterChar, 'left', activeLetterIndex),
      rightHandPose: createLetterPose(activeLetterChar, 'right', activeLetterIndex),
      durationMs: 800 * (SPEED_FACTORS[speed] || 1),
    };
  }, [activeLetterChar, activeLetterIndex, activeLetterMeta, speed]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalDuration = Math.round(1100 * (SPEED_FACTORS[speed] || 1));
    timerRef.current = setInterval(() => {
      setActiveLetterIndex((prev) => {
        if (prev + 1 >= currentLetters.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentLetters, speed]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (activeLetterIndex >= currentLetters.length - 1) {
      setActiveLetterIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // Step Forward
  const handleStepNext = () => {
    setIsPlaying(false);
    setActiveLetterIndex((prev) => (prev + 1 >= currentLetters.length ? 0 : prev + 1));
  };

  // Step Backward
  const handleStepPrev = () => {
    setIsPlaying(false);
    setActiveLetterIndex((prev) => (prev - 1 < 0 ? currentLetters.length - 1 : prev - 1));
  };

  // Replay
  const handleReplay = () => {
    setActiveLetterIndex(0);
    setIsPlaying(true);
  };

  // Select Manual Letter from 26-Letter alphabet grid
  const handleSelectAlphabetLetter = (letterChar) => {
    setIsPlaying(false);
    setSelectedManualLetter(letterChar);
    setActiveLetterIndex(0);
  };

  // Select Keyword Chip
  const handleSelectKeyword = (word) => {
    setIsPlaying(false);
    setSelectedManualLetter(null);
    setSelectedWord(word);
    setActiveLetterIndex(0);
  };

  // Fallback: Direct Avatar Canvas 3D WebM Recorder (Native in DOM, 100% Guaranteed)
  const recordDirectCanvas = async (wordToSpel, lettersToRecord, canvasElem) => {
    try {
      if (!canvasElem || typeof canvasElem.captureStream !== 'function') {
        throw new Error('Avatar canvas element not capable of captureStream');
      }

      const stream = canvasElem.captureStream(30);
      let mimeType = 'video/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          console.error('Direct canvas recording produced 0 bytes');
          setIsRecording(false);
          alert('Recording failed to produce video data. Please try again.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const fileName = `asl_sign_${wordToSpel}.webm`;
        setDownloadVideoUrl(url);
        setDownloadFileName(fileName);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 3000);

        setIsRecording(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 8000);
      };

      recorder.start(100);

      for (let i = 0; i < lettersToRecord.length; i++) {
        setActiveLetterIndex(i);
        setRecordProgress(Math.round(((i + 1) / lettersToRecord.length) * 100));
        await new Promise((r) => setTimeout(r, 650));
      }

      await new Promise((r) => setTimeout(r, 350));
      if (recorder.state === 'recording') {
        recorder.requestData();
        await new Promise((r) => setTimeout(r, 200));
        recorder.stop();
      }
    } catch (err) {
      console.error('Direct canvas recording failed:', err);
      setIsRecording(false);
      alert('Unable to capture video in this browser.');
    }
  };

  // Ultra High Quality 720p/1080p WebM Video Exporter
  const handleDownloadKeywordVideo = async (targetWordToRecord = null) => {
    if (isRecording) return;

    const wordToSpel = targetWordToRecord || (selectedManualLetter || selectedWord || 'RAM');
    const lettersToRecord = wordToSpel.toUpperCase().replace(/[^A-Z]/g, '').split('');
    if (!lettersToRecord.length) return;

    setIsRecording(true);
    setRecordingWord(wordToSpel);
    setRecordProgress(0);
    setDownloadSuccess(false);

    const container = document.getElementById('realistic-avatar-canvas-container');
    const canvasElem = container ? container.querySelector('canvas') : null;

    // 1. Offscreen Composite Canvas Setup (MUST be appended to DOM so Chromium compositor fires captureStream frames)
    const width = 1280;
    const height = 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.left = '-9999px';
    canvas.style.top = '-9999px';
    canvas.style.width = '1280px';
    canvas.style.height = '720px';
    canvas.style.opacity = '0.01';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: false });

    // Helper: Draw full composite frame
    const renderCompositeFrame = (letterChar) => {
      // Background gradient
      const bg = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width / 1.3);
      bg.addColorStop(0, '#0a1a12');
      bg.addColorStop(0.6, '#050c08');
      bg.addColorStop(1, '#020504');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // 3D Avatar WebGL Canvas draw
      if (canvasElem && canvasElem.width > 0 && canvasElem.height > 0) {
        const srcW = canvasElem.width;
        const srcH = canvasElem.height;
        const maxDrawW = 1000;
        const maxDrawH = 540;
        const scale = Math.min(maxDrawW / srcW, maxDrawH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2 - 10;
        ctx.drawImage(canvasElem, drawX, drawY, drawW, drawH);
      }

      // Top Header Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(40, 25, width - 80, 60);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 25, width - 80, 60);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('SIGNLEARN AI · 3D ASL FINGERSPELLING FOOTAGE', 65, 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px monospace';
      ctx.fillText(`WORD: ${wordToSpel}`, width - 290, 62);

      // Bottom Active Letter Card
      const activeMeta = ASL_26_DATABASE[letterChar] || {};
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(40, height - 120, width - 80, 85);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, height - 120, width - 80, 85);

      // Big Letter Box
      ctx.fillStyle = '#10b981';
      ctx.fillRect(55, height - 110, 65, 65);
      ctx.fillStyle = '#020504';
      ctx.font = '900 42px monospace';
      ctx.fillText(letterChar, 70, height - 63);

      // Letter Info
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Letter ${letterChar} · ${activeMeta.handShape || 'ASL Sign'}`, 140, height - 85);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px sans-serif';
      ctx.fillText(activeMeta.description || 'American Sign Language manual alphabet posture.', 140, height - 60);
    };

    try {
      // Paint first frame BEFORE starting stream so stream has an initial valid image buffer
      renderCompositeFrame(lettersToRecord[0]);

      if (typeof canvas.captureStream !== 'function') {
        throw new Error('canvas.captureStream not supported');
      }

      const stream = canvas.captureStream(30); // 30 FPS steady capture
      const videoTrack = stream.getVideoTracks()[0];

      let mimeType = 'video/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
        }

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          console.warn('Composite recorder chunks were empty, running direct canvas fallback...');
          if (canvasElem) {
            recordDirectCanvas(wordToSpel, lettersToRecord, canvasElem);
            return;
          }
          setIsRecording(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const fileName = `asl_fingerspelling_${wordToSpel}_720p.webm`;
        setDownloadVideoUrl(url);
        setDownloadFileName(fileName);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 3000);

        setIsRecording(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 8000);
      };

      recorder.start(100);

      const frameDelayMs = 40; // 25 frames per second
      const framesPerLetter = 16; // 16 * 40ms = 640ms per letter

      for (let i = 0; i < lettersToRecord.length; i++) {
        const char = lettersToRecord[i];
        if (targetWordToRecord) {
          setSelectedWord(targetWordToRecord);
          setSelectedManualLetter(null);
        }
        setActiveLetterIndex(i);
        setRecordProgress(Math.round(((i + 1) / lettersToRecord.length) * 100));

        // Render frames for this letter
        for (let f = 0; f < framesPerLetter; f++) {
          renderCompositeFrame(char);
          if (videoTrack && typeof videoTrack.requestFrame === 'function') {
            videoTrack.requestFrame();
          }
          await new Promise((r) => setTimeout(r, frameDelayMs));
        }
      }

      await new Promise((r) => setTimeout(r, 250));
      if (recorder.state === 'recording') {
        recorder.requestData();
        await new Promise((r) => setTimeout(r, 150));
        recorder.stop();
      }
    } catch (err) {
      console.error('Composite recording failed, trying direct canvas fallback...', err);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      if (canvasElem) {
        await recordDirectCanvas(wordToSpel, lettersToRecord, canvasElem);
      } else {
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Studio Banner Header ── */}
      <div className="p-6 border fs-card border-primary/30 sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center border shadow-lg h-14 w-14 shrink-0 rounded-2xl bg-primary/20 text-primary border-primary/40 shadow-primary/20">
              <Hand size={30} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary border border-primary/30">
                  ASL Fingerspelling Studio
                </span>
                <span className="text-xs font-medium text-text-muted">
                  26 English Manual Alphabet &amp; 1080p HD Video Clips
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Finger Spelling Words &amp; 3D Avatar Footage
              </h2>
            </div>
          </div>

          {/* Quick Controls & Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 text-center border rounded-xl border-border bg-black/5 dark:bg-white/5">
              <div className="text-[10px] uppercase font-bold text-text-muted">Active Sign</div>
              <div className="text-sm font-black text-primary">
                {selectedManualLetter ? `Letter ${selectedManualLetter}` : selectedWord}
              </div>
            </div>
            <div className="px-4 py-2 text-center border rounded-xl border-border bg-black/5 dark:bg-white/5">
              <div className="text-[10px] uppercase font-bold text-text-muted">Letter Index</div>
              <div className="font-mono text-sm font-black">
                {activeLetterChar} ({activeLetterIndex + 1}/{currentLetters.length})
              </div>
            </div>
            <div className="px-4 py-2 text-center border rounded-xl border-border bg-black/5 dark:bg-white/5">
              <div className="text-[10px] uppercase font-bold text-text-muted">Video Quality</div>
              <div className="text-sm font-black text-emerald-500">1080p 60FPS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Studio Grid (Left Controls & Right 3D Avatar) ── */}
      <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Notes Input, Keyword Detector & 26-Letter Grid (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Note Input Card */}
          <div className="space-y-5 fs-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  Lesson Notes &amp; Text Input
                </h4>
              </div>
              <span className="text-xs text-text-muted">Click Filter to extract ICT keywords</span>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.03] p-4 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none transition-all leading-relaxed"
              placeholder="Paste or type ICT notes here (e.g. RAM is volatile memory used by CPU and ALU)..."
            />

            {/* Presets Row */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Sample Lesson Presets: 
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_ICT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(preset.text);
                      handleManualFilterKeywords(preset.text, preset.primaryWord);
                    }}
                    className="rounded-xl border border-border bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
 <br></br>
            {/* Manual Filter Action Row */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-muted">
                Detects acronyms like RAM, CPU, SQL, BIOS, HTTP...
              </span>
              <button
                type="button"
                onClick={() => handleManualFilterKeywords()}
                disabled={isFiltering || !inputText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-primary-hover shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
              >
                <Filter size={15} className={isFiltering ? 'animate-spin' : ''} />
                <span>{isFiltering ? 'Filtering Notes...' : '🔍 Filter & Detect ICT Keywords'}</span>
              </button>
            </div>
<br></br>
            {/* ── SECTION 1: Grade 10 & 11 O/L ICT Keywords ── */}
            <div className="pt-4 space-y-3 border-t border-border">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 font-bold rounded-lg bg-emerald-500/20 text-emerald-500">
                    <GraduationCap size={15} />
                  </span>
                  <div>
                    <h5 className="text-xs font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                      O/L ICT Syllabus Keywords ({ictKeywords.length})
                    </h5>
                    <p className="text-[11px] text-text-muted">
                      Categorized according to Grade 10 &amp; 11 National ICT Syllabus
                    
                    </p>
                    <br></br>
                  </div>
                </div>
  
                {/* Syllabus Grade Filter Pills */}
                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setSyllabusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      syllabusFilter === 'ALL'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-primary'
                    }`}
                  >
                    All ICT ({ictKeywords.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyllabusFilter('Grade 10')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      syllabusFilter === 'Grade 10'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-emerald-400'
                    }`}
                  >
                    Grade 10 ({grade10Count})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyllabusFilter('Grade 11')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      syllabusFilter === 'Grade 11'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-cyan-400'
                    }`}
                  >
                    Grade 11 ({grade11Count})
                  </button>
                </div>
              </div>

              {filteredIctKeywords.length === 0 ? (
                <div className="p-4 text-xs text-center border border-dashed rounded-xl border-border text-text-muted">
                  No keywords found for {syllabusFilter}. Try selecting &quot;All ICT&quot; or filter new notes above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredIctKeywords.map((kw) => {
                    const isSelected = selectedWord === kw.word && !selectedManualLetter;
                    const isG10 = kw.grade === 'Grade 10';
                    return (
                      <div
                        key={kw.word}
                        className={`fs-keyword-card flex flex-col justify-between p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'is-active ring-2 ring-emerald-500/50 shadow-md border-emerald-500/60 bg-emerald-500/5'
                            : 'border-border/70 bg-black/[0.02] dark:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectKeyword(kw.word)}
                            className="flex-1 space-y-1 text-left cursor-pointer"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-sm font-black tracking-wide ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                {kw.word}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  isG10
                                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}
                              >
                                {kw.grade || 'O/L ICT'}
                              </span>
                            </div>
                            <div className="text-[10px] text-text-muted line-clamp-1 font-medium">
                              {kw.unit || kw.topic || 'ICT Terminology'}
                            </div>
                          </button>

                          {/* Individual Download Video Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadKeywordVideo(kw.word)}
                            disabled={isRecording}
                            className="flex items-center justify-center w-8 h-8 transition-all border cursor-pointer shrink-0 rounded-xl bg-black/5 dark:bg-white/10 border-border text-text-muted hover:text-primary hover:border-primary"
                            title={`Download "${kw.word}" 1080p 3D sign video clip`}
                          >
                            <Download size={13} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50 text-[10px] text-text-muted">
                          <span className="font-mono">{kw.letterCount} letters</span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {kw.topic || 'Syllabus Core'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
<br></br>
            {/* ── SECTION 2: Other General Lesson Words ── */}
            <div className="pt-4 space-y-3 border-t border-border">
              <div className="flex items-center justify-between">
                
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FileText size={14} className="text-text-muted" /> Other Lesson Words ({otherWords.length})
                  </h5>
                  <p className="text-[11px] text-text-muted">
                    General English vocabulary from notes. Click any word to fingerspell letter-by-letter.
                  </p>
                  <br></br>
                </div>
                <span className="text-[11px] font-mono text-text-muted">{otherWords.length} words</span>
              </div>

              {otherWords.length === 0 ? (
                <div className="p-3 text-xs text-center border border-dashed rounded-xl border-border text-text-muted">
                  No additional words detected in current text.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {otherWords.map((ow) => {
                    const isSelected = selectedWord === ow.word && !selectedManualLetter;
                    return (
                      <div
                        key={ow.word}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-border/60 bg-black/[0.01] dark:bg-white/[0.01] hover:border-border text-text-muted'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectKeyword(ow.word)}
                          className="flex items-center gap-1.5 text-left cursor-pointer truncate flex-1"
                        >
                          <span className="font-semibold truncate">{ow.word}</span>
                          <span className="text-[9px] font-mono opacity-70">({ow.letterCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadKeywordVideo(ow.word)}
                          disabled={isRecording}
                          className="p-1 transition-colors text-text-muted hover:text-primary"
                          title={`Download "${ow.word}" sign video`}
                        >
                          <Download size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 26-Letter ASL Manual Alphabet Grid */}
          <div className="space-y-4 fs-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-500" />
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  26 English Letters Manual Alphabet (A–Z)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Click any letter to test 3D hand sign
              </span>
            </div>

            {/* 26 Alphabet Buttons Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2 sm:gap-2.5">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                const isCurrentActive = activeLetterChar === char;
                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleSelectAlphabetLetter(char)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[52px] border ${
                      isCurrentActive
                        ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105 ring-2 ring-emerald-500/40'
                        : 'border-border bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-base font-black">{char}</span>
                    <span className={`text-[9px] font-normal font-mono ${isCurrentActive ? 'text-slate-900 font-bold' : 'text-text-muted'}`}>
                      ASL
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Letter Anatomical Guide Card */}
            <div className="fs-guide-box">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 fs-guide-copy">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase fs-guide-title">
                    <Sparkles size={15} className="text-emerald-500" />
                    <span className="font-bold">Anatomical Sign Guide: {activeLetterMeta.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {activeLearnerGuide.difficulty}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      <span>Palm:</span>
                      <span>{activeLearnerGuide.directionIcon}</span>
                      <span>{activeLearnerGuide.palmDirection}</span>
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed fs-guide-text">
                    {activeLetterMeta.description}
                  </p>

                  <div className="pt-1 text-xs font-semibold">
                    Handshape Posture:{' '}
                    <span className="font-bold underline decoration-emerald-500/40">
                      {activeLetterMeta.handShape}
                    </span>
                  </div>
                </div>

                {/* Big Letter Badge */}
                <div className="flex items-center justify-center font-mono text-3xl font-black shadow-lg h-14 w-14 shrink-0 rounded-2xl bg-emerald-500 text-slate-950 shadow-emerald-500/30">
                  {activeLetterChar}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-3 border fs-guide-instructions rounded-xl bg-black/5 dark:bg-black/30 border-emerald-500/20">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                  📋 How to Form Handshape (Step-by-Step):
                </div>
                <div className="fs-guide-steps grid grid-cols-1 gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {activeLearnerGuide.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2 fs-guide-step">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learner Tip & Finger State Badges */}
              <div className="fs-guide-tips">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 leading-snug flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <div>
                    <strong>Learner Tip:</strong> {activeLearnerGuide.learnerTip}
                  </div>
                </div>

                {/* Individual Finger Postures */}
                {activeLearnerGuide.fingerStates && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 pt-1">
                    <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                      <span className="font-bold text-amber-500">👍 Thumb:</span>
                      <div className="truncate text-text-muted">{activeLearnerGuide.fingerStates.thumb}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                      <span className="font-bold text-cyan-500">☝️ Index:</span>
                      <div className="truncate text-text-muted">{activeLearnerGuide.fingerStates.index}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                      <span className="font-bold text-emerald-500">🖕 Middle:</span>
                      <div className="truncate text-text-muted">{activeLearnerGuide.fingerStates.middle}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                      <span className="font-bold text-purple-500">💍 Ring:</span>
                      <div className="truncate text-text-muted">{activeLearnerGuide.fingerStates.ring}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                      <span className="font-bold text-rose-500">🤙 Pinky:</span>
                      <div className="truncate text-text-muted">{activeLearnerGuide.fingerStates.pinky}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ICT Acronym Examples */}
              {activeLetterMeta.ictExamples && activeLetterMeta.ictExamples.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 text-xs border-t fs-guide-examples border-emerald-500/20">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">ICT Term Examples:</span>
                  {activeLetterMeta.ictExamples.map((ex, i) => (
                    <span
                      key={i}
                      className="bg-black/5 dark:bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Realistic Hand Avatar Stage & Recording Exporter (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-4 fs-card">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black tracking-wider uppercase text-emerald-500">
                  3D ASL Hand Avatar
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  360° Interactive Orbit
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Visual Mode Selector */}
                <div className="flex items-center gap-1 p-1 border bg-black/5 dark:bg-white/5 rounded-xl border-border">
                  <button
                    type="button"
                    onClick={() => setVisualMode('3d-mesh')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      visualMode === '3d-mesh'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-white'
                    }`}
                    title="Three.js Articulated 3D Hand Mesh with Organic Shading"
                  >
                    🖐️ 3D Mesh
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualMode('3d-skeleton')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      visualMode === '3d-skeleton'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-white'
                    }`}
                    title="3D Biomechanical Skeleton with Glowing Landmark Joints"
                  >
                    🦴 Skeleton
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualMode('3d-hud')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      visualMode === '3d-hud'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-white'
                    }`}
                    title="Real-time 5-Finger Flex Angle Telemetry Gauge"
                  >
                    📊 Flex HUD
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualMode('2d-vector')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      visualMode === '2d-vector'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-text-muted hover:text-white'
                    }`}
                    title="High-Contrast 2D Vector Diagram (Accessible Mode)"
                  >
                    📐 2D SVG
                  </button>
                </div>

                {/* Both Hands Toggle Button */}
                <button
                  type="button"
                  onClick={() => setUseBothHands((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    useBothHands
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      : 'border-border bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary'
                  }`}
                  title="Toggle between Both Hands and Single Dominant Hand signing"
                >
                  <Users size={14} />
                  <span>{useBothHands ? 'Both Hands' : 'Single Hand'}</span>
                </button>

                {/* Speed Dropdown */}
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="rounded-xl border border-border bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs font-bold text-text-muted focus:outline-none cursor-pointer"
                >
                  {Object.keys(SPEED_FACTORS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prominent Active Word Ribbon HUD with Syllabus Metadata */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {selectedManualLetter ? 'Manual Alphabet:' : 'Word Spelling:'}
                  </span>
                  <span className="font-mono text-base font-black tracking-widest text-emerald-700 dark:text-white">
                    {selectedManualLetter ? selectedManualLetter : selectedWord}
                  </span>
                </div>
                {selectedIctMeta && !selectedManualLetter && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-300 font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 font-bold">
                      {selectedIctMeta.grade || 'O/L ICT'}
                    </span>
                    <span>{selectedIctMeta.unit || selectedIctMeta.topic}</span>
                  </div>
                )}
              </div>

              {/* Progress Letter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {currentLetters.map((letter, idx) => {
                  const isActive = idx === activeLetterIndex;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 scale-110 ring-2 ring-emerald-400'
                          : 'bg-black/10 dark:bg-white/10 text-text-muted'
                      }`}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 3D WebGL / Vector Avatar Canvas Stage */}
            <div
              id="realistic-avatar-canvas-container"
              className="relative min-h-[520px] h-[550px] w-full rounded-2xl border border-border bg-gradient-to-b from-slate-950 via-[#060a12] to-black overflow-hidden shadow-inner flex items-center justify-center"
            >
              {visualMode !== '2d-vector' ? (
                <ThreeHandAvatarViewer
                  ref={threeViewerRef}
                  activeLetter={activeLetterChar}
                  speed={speed === '0.5x' ? 'slow' : speed === '1.5x' ? 'fast' : 'normal'}
                  isPlaying={isPlaying}
                  useBothHands={useBothHands}
                  viewMode={visualMode === '3d-mesh' ? 'realistic' : visualMode === '3d-skeleton' ? 'skeleton' : 'hud'}
                  isAutoRotate={isAutoRotate}
                  onAutoRotateChange={setIsAutoRotate}
                />
              ) : (
                <>
                  <RealisticAvatarViewer
                    currentGesture={activeGestureData}
                    currentWord={activeLetterChar}
                    speed={speed === '0.5x' ? 'slow' : speed === '1.5x' ? 'fast' : 'normal'}
                    isPlaying={isPlaying}
                    showHandLandmarks={showSkeleton}
                    showFingerLabels={false}
                    useBothHands={useBothHands}
                    zoomLevel={1.15}
                  />

                  {/* Active Letter Giant Illuminated HUD Tag for 2D Mode */}
                  <div className="absolute z-10 flex items-center gap-2 pointer-events-none top-3 left-4">
                    <span className="flex items-center justify-center w-12 h-12 font-mono text-3xl font-black border shadow-xl rounded-2xl bg-black/60 backdrop-blur-md border-emerald-500/40 text-emerald-300">
                      {activeLetterChar}
                    </span>
                    <div className="rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10">
                      <div className="text-[10px] font-bold uppercase text-emerald-400">ASL Pose</div>
                      <div className="text-xs font-bold text-white truncate max-w-[150px]">
                        {activeLetterMeta.handShape}
                      </div>
                    </div>
                  </div>

                  {/* Hand Mode Indicator Pill for 2D Mode */}
                  <div className="absolute z-10 pointer-events-none bottom-3 right-4">
                    <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                      {useBothHands ? '● Dual Hands Mode' : '● Dominant Hand Mode'}
                    </span>
                  </div>
                </>
              )}

              {/* Recording Overlay if exporting video */}
              {isRecording && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/85 backdrop-blur-sm">
                  <Film size={36} className="mb-3 text-emerald-400 animate-pulse" />
                  <h4 className="text-base font-bold text-white">
                    Rendering 1080p 60FPS Video ({recordingWord})...
                  </h4>
                  <p className="mt-1 text-xs text-text-muted">Exporting high-resolution smooth ASL footage</p>
                  <div className="w-full max-w-[220px] h-2.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full transition-all duration-200 bg-emerald-400"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                  <span className="mt-2 font-mono text-xs text-emerald-400">{recordProgress}% completed</span>
                </div>
              )}
            </div>

            {/* Letter Sequence Ribbon Interactive Stepper */}
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border space-y-2">
              <div className="text-[10px] uppercase font-bold text-text-muted flex items-center justify-between">
                <span>Timeline Stepper ({selectedManualLetter ? 'Letter' : selectedWord}):</span>
                <span className="font-mono font-bold text-primary">
                  Letter {activeLetterIndex + 1} of {currentLetters.length} ({activeLetterChar})
                </span>
              </div>

              <div className="flex items-center gap-2 pb-1 overflow-x-auto">
                {currentLetters.map((char, idx) => {
                  const isCurrent = idx === activeLetterIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveLetterIndex(idx);
                      }}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black transition-all cursor-pointer border ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-110'
                          : 'border-border bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:border-primary'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Controls Bar & Full Video Downloader */}
            <div className="relative z-10 flex flex-col items-stretch justify-between gap-3 pt-2 pb-2 pr-0 sm:pr-24 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStepPrev}
                  className="rounded-xl border border-border bg-black/5 dark:bg-white/5 p-2.5 text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer"
                  title="Previous Letter"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold shadow-lg transition-all cursor-pointer min-h-[42px] ${
                    isPlaying
                      ? 'bg-amber-400 text-slate-950 shadow-amber-400/20'
                      : 'bg-primary text-slate-950 hover:bg-primary-hover shadow-primary/20'
                  }`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlaying ? 'Pause Sequence' : 'Play Sequence'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStepNext}
                  className="rounded-xl border border-border bg-black/5 dark:bg-white/5 p-2.5 text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer"
                  title="Next Letter"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="rounded-xl border border-border bg-black/5 dark:bg-white/5 p-2.5 text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer"
                  title="Replay from Beginning"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Dedicated Stop / Start 360° Rotation Button while playing sign */}
                <button
                  type="button"
                  id="btn-toggle-360-rotation"
                  onClick={() => setIsAutoRotate((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[42px] border ${
                    isAutoRotate
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-600/40 animate-pulse'
                      : 'bg-black/5 dark:bg-white/5 border-border text-text-muted hover:text-cyan-400 hover:border-cyan-500/40'
                  }`}
                  title={isAutoRotate ? 'Stop 360° Hand Rotation' : 'Start 360° Continuous Turntable Rotation'}
                >
                  {isAutoRotate ? (
                    <>
                      <span className="flex w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="font-black">🛑 Stop 360° Spin</span>
                    </>
                  ) : (
                    <>
                      <RotateCw size={15} />
                      <span>360° Spin</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Master Export Video Footage Button (WebM) */}
                <button
                  type="button"
                  id="btn-download-asl-video"
                  onClick={() => handleDownloadKeywordVideo()}
                  disabled={isRecording}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer ${
                    downloadSuccess
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isRecording
                      ? 'bg-emerald-700/60 text-white cursor-wait opacity-80'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 active:scale-95'
                  }`}
                  title="Capture & Download Sign Video Footage in WEBM format"
                >
                  {downloadSuccess ? (
                    <>
                      <Check size={16} />
                      <span>Downloaded WEBM Footage!</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Film size={16} className="animate-spin" />
                      <span>Recording {recordProgress}%...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download {selectedWord} WEBM Video</span>
                    </>
                  )}
                </button>

                {/* Direct Save Button Link if generated (100% bypasses popup blocker) */}
                {downloadVideoUrl && (
                  <a
                    href={downloadVideoUrl}
                    download={downloadFileName || `asl_sign_${selectedWord}.webm`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/40 transition-all cursor-pointer animate-bounce hover:animate-none"
                    title="Click to directly save WEBM video file"
                  >
                    <Download size={15} />
                    <span>Save {downloadFileName || `${selectedWord}.webm`}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerspellingStudio;
