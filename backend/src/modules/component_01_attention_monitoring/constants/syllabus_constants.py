"""
constants/syllabus_constants.py
National Sri Lankan G.C.E. Ordinary Level (O/L) ICT Curriculum Taxonomy
Grade 10 & Grade 11 Units, Topics, Competencies, and Adaptive Interventions.
"""
from typing import Dict, List, Any, Optional

GRADE_10_ICT: Dict[str, Any] = {
    "grade": "Grade 10",
    "units": [
        {
            "unit_number": 1,
            "unit_title": "Introduction to Information and Communication Technology",
            "topics": [
                {
                    "subtopic_id": "g10_u1_t1",
                    "title": "Data and Information & The IPO Cycle",
                    "concept_id": "intro_ict",
                    "key_terms": ["Data", "Information", "Input", "Process", "Output", "Storage"],
                    "summary_hint": "Data consists of raw unprocessed facts. Information is processed, structured, meaningful data produced by the Input-Process-Output (IPO) cycle.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the primary difference between data and information?",
                        "options": ["Information is raw facts; data is processed", "Data is raw facts; information is processed meaningful data", "Both mean identical concepts", "Data requires a computer; information does not"],
                        "answer": "Data is raw facts; information is processed meaningful data"
                    }
                },
                {
                    "subtopic_id": "g10_u1_t2",
                    "title": "Applications of ICT in Society",
                    "concept_id": "intro_ict",
                    "key_terms": ["e-Learning", "e-Commerce", "e-Health", "Telemedicine", "Automation"],
                    "summary_hint": "ICT modernizes education (LMS, smart classrooms), healthcare (telemedicine), banking (ATM, online banking), and government services.",
                    "sample_checkpoint_mcq": {
                        "question": "Which of the following is an example of an e-Health service?",
                        "options": ["Telemedicine remote consultation", "ATM cash withdrawal", "Online flight booking", "Barcode scanning"],
                        "answer": "Telemedicine remote consultation"
                    }
                }
            ]
        },
        {
            "unit_number": 2,
            "unit_title": "Architecture of Computer Systems & Hardware",
            "topics": [
                {
                    "subtopic_id": "g10_u2_t1",
                    "title": "Von Neumann Architecture & CPU Organization",
                    "concept_id": "computer_hardware",
                    "key_terms": ["Von Neumann", "CPU", "ALU", "CU", "Registers", "Buses"],
                    "summary_hint": "Von Neumann architecture stores instructions and data in memory. CPU consists of ALU (arithmetic/logic), CU (timing and signals), and high-speed Registers.",
                    "sample_checkpoint_mcq": {
                        "question": "Which CPU component directs the timing and flow of signals across hardware?",
                        "options": ["Arithmetic Logic Unit (ALU)", "Control Unit (CU)", "Hard Disk Drive", "Cache Memory"],
                        "answer": "Control Unit (CU)"
                    }
                },
                {
                    "subtopic_id": "g10_u2_t2",
                    "title": "Memory Hierarchy: Cache, RAM, ROM & Secondary Storage",
                    "concept_id": "computer_hardware",
                    "key_terms": ["RAM", "ROM", "Cache", "Volatile", "SSD", "HDD"],
                    "summary_hint": "Registers & Cache are fastest. RAM is volatile main memory (lost on power-off). ROM is non-volatile holding BIOS. SSD/HDD provide persistent secondary storage.",
                    "sample_checkpoint_mcq": {
                        "question": "Why is RAM termed 'volatile' memory?",
                        "options": ["It retains data without electricity", "Its contents are lost when power is disconnected", "It can only be written once", "It is optical storage"],
                        "answer": "Its contents are lost when power is disconnected"
                    }
                },
                {
                    "subtopic_id": "g10_u2_t3",
                    "title": "Input, Output & Communication Peripherals",
                    "concept_id": "computer_hardware",
                    "key_terms": ["Keyboard", "OCR", "OMR", "Monitor", "Printer", "Ports", "HDMI"],
                    "summary_hint": "Input devices capture data (keyboards, scanners, OMR/OCR); output devices display/present results (monitors, printers); connected via USB/HDMI/VGA ports.",
                    "sample_checkpoint_mcq": {
                        "question": "Which input device is typically used for grading multiple choice exam answer sheets?",
                        "options": ["OMR (Optical Mark Recognition)", "Microphone", "Thermal Printer", "Projector"],
                        "answer": "OMR (Optical Mark Recognition)"
                    }
                }
            ]
        },
        {
            "unit_number": 3,
            "unit_title": "Data Representation & Number Systems",
            "topics": [
                {
                    "subtopic_id": "g10_u3_t1",
                    "title": "Number Bases: Decimal, Binary, Octal and Hexadecimal",
                    "concept_id": "number_systems",
                    "key_terms": ["Base-10", "Base-2", "Base-8", "Base-16", "Bit", "Byte", "Nibble"],
                    "summary_hint": "Computers use binary (Base-2: digits 0 and 1). Octal uses 0-7 (Base-8). Hexadecimal uses 0-9 and A-F (Base-16). 1 Byte = 8 Bits.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the decimal equivalent of binary 1011(2)?",
                        "options": ["11", "9", "13", "7"],
                        "answer": "11"
                    }
                },
                {
                    "subtopic_id": "g10_u3_t2",
                    "title": "Radix Conversions & Character Encoding (ASCII, Unicode)",
                    "concept_id": "number_systems",
                    "key_terms": ["Division by 2", "Place Value", "ASCII", "Unicode", "UTF-8"],
                    "summary_hint": "To convert Decimal to Binary, divide repeatedly by 2 recording remainders. ASCII uses 7/8 bits for Latin chars; Unicode uses 16/32 bits supporting all languages.",
                    "sample_checkpoint_mcq": {
                        "question": "How many bits are used in standard 7-bit ASCII encoding?",
                        "options": ["7 bits", "16 bits", "32 bits", "64 bits"],
                        "answer": "7 bits"
                    }
                }
            ]
        },
        {
            "unit_number": 4,
            "unit_title": "Logic Gates and Boolean Logic",
            "topics": [
                {
                    "subtopic_id": "g10_u4_t1",
                    "title": "Basic Gates: AND, OR, NOT and Truth Tables",
                    "concept_id": "logic_gates",
                    "key_terms": ["AND Gate", "OR Gate", "NOT Inverter", "Truth Table", "Boolean Algebra"],
                    "summary_hint": "AND outputs 1 only when all inputs are 1. OR outputs 1 if at least one input is 1. NOT inverts 0 to 1 and 1 to 0.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the output of an AND gate when input A=1 and input B=0?",
                        "options": ["0", "1", "Undefined", "High impedance"],
                        "answer": "0"
                    }
                },
                {
                    "subtopic_id": "g10_u4_t2",
                    "title": "Universal & Combinational Gates: NAND, NOR, XOR",
                    "concept_id": "logic_gates",
                    "key_terms": ["NAND Gate", "NOR Gate", "XOR Gate", "Universal Gate", "Logic Circuit"],
                    "summary_hint": "NAND and NOR are Universal Gates because any circuit can be constructed solely using them. XOR outputs 1 when inputs are different.",
                    "sample_checkpoint_mcq": {
                        "question": "Which of the following is considered a Universal Logic Gate?",
                        "options": ["NAND", "AND", "OR", "XOR"],
                        "answer": "NAND"
                    }
                }
            ]
        },
        {
            "unit_number": 5,
            "unit_title": "Operating Systems & System Software",
            "topics": [
                {
                    "subtopic_id": "g10_u5_t1",
                    "title": "Functions of an OS & User Interfaces (CLI vs GUI)",
                    "concept_id": "operating_systems",
                    "key_terms": ["Operating System", "CLI", "GUI", "Process Management", "Memory Management"],
                    "summary_hint": "OS manages hardware, processor scheduling, memory, files, and security. GUI provides icons, windows, and pointers; CLI uses typed commands.",
                    "sample_checkpoint_mcq": {
                        "question": "Which is an advantage of a GUI over a CLI for beginner users?",
                        "options": ["Intuitive visual interface with icons", "Consumes less memory", "Faster keyboard execution", "Runs without graphics driver"],
                        "answer": "Intuitive visual interface with icons"
                    }
                }
            ]
        },
        {
            "unit_number": 6,
            "unit_title": "Word Processing",
            "topics": [
                {
                    "subtopic_id": "g10_u6_t1",
                    "title": "Document Formatting, Tables, Headers, Footers & Mail Merge",
                    "concept_id": "word_processing",
                    "key_terms": ["Paragraph formatting", "Tables", "Mail Merge", "Styles", "Spell check"],
                    "summary_hint": "Mail Merge allows sending personalized bulk letters or certificates from a structured recipient data source.",
                    "sample_checkpoint_mcq": {
                        "question": "Which word processor feature is used to produce personalized letters for 50 students from one template?",
                        "options": ["Mail Merge", "Find and Replace", "Macros", "AutoCorrect"],
                        "answer": "Mail Merge"
                    }
                }
            ]
        },
        {
            "unit_number": 7,
            "unit_title": "Electronic Spreadsheets",
            "topics": [
                {
                    "subtopic_id": "g10_u7_t1",
                    "title": "Formulas, Functions (SUM, AVERAGE, IF, COUNT) & Charts",
                    "concept_id": "spreadsheets",
                    "key_terms": ["Cell Reference", "Absolute Reference $", "SUM", "AVERAGE", "IF Function", "Bar Chart"],
                    "summary_hint": "Formulas start with '='. Absolute reference ($A$1) locks row/column on drag. Relative reference changes automatically.",
                    "sample_checkpoint_mcq": {
                        "question": "Which formula correctly computes the arithmetic average of cells B2 to B10?",
                        "options": ["=AVERAGE(B2:B10)", "=SUM(B2:B10)/TOTAL", "=MEAN(B2:B10)", "=AVG(B2..B10)"],
                        "answer": "=AVERAGE(B2:B10)"
                    }
                }
            ]
        },
        {
            "unit_number": 8,
            "unit_title": "Electronic Presentations",
            "topics": [
                {
                    "subtopic_id": "g10_u8_t1",
                    "title": "Slide Layouts, Transitions, Animations & Presenter View",
                    "concept_id": "electronic_presentations",
                    "key_terms": ["Slide Master", "Transitions", "Custom Animations", "Slide Show"],
                    "summary_hint": "Transitions apply when advancing between slides; animations apply to individual objects/bullet points within a slide.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the visual effect that occurs when moving from Slide 1 to Slide 2?",
                        "options": ["Slide Transition", "Object Animation", "Theme Change", "Slide Master"],
                        "answer": "Slide Transition"
                    }
                }
            ]
        },
        {
            "unit_number": 9,
            "unit_title": "Database Management Systems (DBMS)",
            "topics": [
                {
                    "subtopic_id": "g10_u9_t1",
                    "title": "Relational Tables, Records, Fields, Primary Keys and Foreign Keys",
                    "concept_id": "database_management",
                    "key_terms": ["Table", "Field (Attribute)", "Record (Tuple)", "Primary Key", "Foreign Key"],
                    "summary_hint": "A Table consists of rows (records) and columns (fields). A Primary Key uniquely identifies each record. Foreign keys establish relational links.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the purpose of a Primary Key in a relational database table?",
                        "options": ["Uniquely identify every record", "Sort fields alphabetically", "Store password encryption keys", "Encrypt data backups"],
                        "answer": "Uniquely identify every record"
                    }
                }
            ]
        }
    ]
}

GRADE_11_ICT: Dict[str, Any] = {
    "grade": "Grade 11",
    "units": [
        {
            "unit_number": 1,
            "unit_title": "Programming & Algorithms",
            "topics": [
                {
                    "subtopic_id": "g11_u1_t1",
                    "title": "Algorithms, Flowchart Symbols and Pseudocode",
                    "concept_id": "algorithms_flowcharts",
                    "key_terms": ["Algorithm", "Oval (Terminal)", "Parallelogram (I/O)", "Rectangle (Process)", "Diamond (Decision)"],
                    "summary_hint": "An algorithm is a step-by-step sequence of instructions to solve a problem. Flowcharts use standard geometric symbols (Diamond = Decision, Parallelogram = I/O).",
                    "sample_checkpoint_mcq": {
                        "question": "Which flowchart symbol represents an Input/Output operation?",
                        "options": ["Parallelogram", "Diamond", "Rectangle", "Oval"],
                        "answer": "Parallelogram"
                    }
                },
                {
                    "subtopic_id": "g11_u1_t2",
                    "title": "Control Structures: Sequence, Selection (if/else), and Iteration (loops)",
                    "concept_id": "programming_principles",
                    "key_terms": ["Sequence", "Selection", "Iteration (while / for)", "Condition", "Indent"],
                    "summary_hint": "Sequence executes statements sequentially. Selection branches based on condition (if/elif/else). Iteration loops until a condition ceases to hold.",
                    "sample_checkpoint_mcq": {
                        "question": "Which control structure is used when a block of code needs to repeat 10 times?",
                        "options": ["Iteration (Loop)", "Sequence", "Selection (if)", "Terminal"],
                        "answer": "Iteration (Loop)"
                    }
                }
            ]
        },
        {
            "unit_number": 2,
            "unit_title": "Web Development & Authoring",
            "topics": [
                {
                    "subtopic_id": "g11_u2_t1",
                    "title": "HTML5 Elements: Headings, Paragraphs, Lists, Tables & Hyperlinks",
                    "concept_id": "web_development",
                    "key_terms": ["HTML5", "<html>", "<head>", "<body>", "<a> href", "<img>", "<table>"],
                    "summary_hint": "HTML defines webpage structure. Hyperlinks use <a href='url'>. Tables use <table>, <tr> (row), <td> (data), and <th> (header).",
                    "sample_checkpoint_mcq": {
                        "question": "Which HTML tag is used to create a hyperlink?",
                        "options": ["<a href='...'>", "<link src='...'>", "<hyperlink>", "<nav to='...'>"],
                        "answer": "<a href='...'>"
                    }
                },
                {
                    "subtopic_id": "g11_u2_t2",
                    "title": "CSS Styling: Inline, Internal, External & Box Model",
                    "concept_id": "web_development",
                    "key_terms": ["CSS", "Selector", "Property", "Margin", "Border", "Padding", "Color"],
                    "summary_hint": "Cascading Style Sheets (CSS) style the HTML presentation. The box model consists of Content, Padding, Border, and Margin.",
                    "sample_checkpoint_mcq": {
                        "question": "In the CSS box model, what is the space directly between content and border called?",
                        "options": ["Padding", "Margin", "Outline", "Gap"],
                        "answer": "Padding"
                    }
                }
            ]
        },
        {
            "unit_number": 3,
            "unit_title": "Computer Networks and the Internet",
            "topics": [
                {
                    "subtopic_id": "g11_u3_t1",
                    "title": "Network Topologies (Star, Bus, Ring, Mesh) & Media",
                    "concept_id": "computer_networks",
                    "key_terms": ["Star Topology", "Bus Topology", "Twisted Pair (UTP)", "Fiber Optic", "Switch", "Router"],
                    "summary_hint": "Star topology connects nodes to a central switch/hub. Fiber optic uses light signals for highest bandwidth and immunity to electromagnetic interference.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the primary vulnerability of a Bus topology with a single backbone cable?",
                        "options": ["Break in backbone cable collapses whole network", "Central switch failure halts network", "Extremely expensive cabling", "High power consumption"],
                        "answer": "Break in backbone cable collapses whole network"
                    }
                },
                {
                    "subtopic_id": "g11_u3_t2",
                    "title": "Protocols (TCP/IP, HTTP, DNS) and IP Addressing",
                    "concept_id": "computer_networks",
                    "key_terms": ["IP Address (IPv4/IPv6)", "DNS", "TCP/IP", "HTTP/HTTPS", "MAC Address"],
                    "summary_hint": "DNS resolves human-readable domain names (e.g., mohe.gov.lk) to numeric IP addresses. HTTP/HTTPS transmits web pages.",
                    "sample_checkpoint_mcq": {
                        "question": "What service resolves a domain name like 'google.com' into an IP address?",
                        "options": ["DNS (Domain Name System)", "DHCP", "FTP", "SMTP"],
                        "answer": "DNS (Domain Name System)"
                    }
                }
            ]
        },
        {
            "unit_number": 4,
            "unit_title": "Multimedia Technologies",
            "topics": [
                {
                    "subtopic_id": "g11_u4_t1",
                    "title": "Digital Audio, Video, Graphics and Compression (Lossy vs Lossless)",
                    "concept_id": "multimedia_tech",
                    "key_terms": ["Raster vs Vector", "Lossy (JPEG, MP3)", "Lossless (PNG, WAV)", "Bitrate", "Resolution"],
                    "summary_hint": "Vector graphics scale without pixelation. Lossy compression removes redundant perceptual data for smaller sizes; Lossless retains 100% exact data.",
                    "sample_checkpoint_mcq": {
                        "question": "Which image format uses lossy compression commonly for photographic web images?",
                        "options": ["JPEG", "PNG", "BMP", "TIFF lossless"],
                        "answer": "JPEG"
                    }
                }
            ]
        },
        {
            "unit_number": 5,
            "unit_title": "ICT in Society, Cyber Security, Ethics and Legal Issues",
            "topics": [
                {
                    "subtopic_id": "g11_u5_t1",
                    "title": "Malware (Virus, Worm, Trojan, Ransomware) & Cyber Defense",
                    "concept_id": "cyber_security",
                    "key_terms": ["Virus", "Worm", "Trojan", "Phishing", "Firewall", "Encryption", "Strong Passwords"],
                    "summary_hint": "Worms replicate across networks without user execution. Phishing tricks users into revealing credentials. Firewalls filter unauthorized network traffic.",
                    "sample_checkpoint_mcq": {
                        "question": "Which malware replicates itself over network connections without requiring a host file?",
                        "options": ["Worm", "Macro Virus", "Trojan Horse", "Adware"],
                        "answer": "Worm"
                    }
                },
                {
                    "subtopic_id": "g11_u5_t2",
                    "title": "Intellectual Property, Computer Crimes Act & Ergonomics",
                    "concept_id": "cyber_security",
                    "key_terms": ["Copyright", "Plagiarism", "Computer Crimes Act Sri Lanka", "Ergonomics", "e-Waste"],
                    "summary_hint": "Computer Crimes Act No. 24 of 2007 penalizes unauthorized access. Ergonomics prevents musculoskeletal and eye strain in computer workstations.",
                    "sample_checkpoint_mcq": {
                        "question": "What is the science of designing computer workplaces to minimize physical strain and injury?",
                        "options": ["Ergonomics", "Cybernetics", "Cryptography", "Nanotechnology"],
                        "answer": "Ergonomics"
                    }
                }
            ]
        }
    ]
}

SYLLABUS_MAP = {
    "Grade 10": GRADE_10_ICT,
    "Grade 11": GRADE_11_ICT,
}


def get_full_syllabus_taxonomy() -> Dict[str, Any]:
    """Return complete structured taxonomy for Grade 10 & 11 O/L ICT."""
    return {
        "curriculum": "Sri Lanka G.C.E. Ordinary Level ICT",
        "grades": [GRADE_10_ICT, GRADE_11_ICT],
    }


def find_topic_for_timestamp(timeline_segments: List[Dict[str, Any]], current_time: float) -> Optional[Dict[str, Any]]:
    """Resolve active syllabus topic segment for playback second."""
    if not timeline_segments:
        return None
    for seg in timeline_segments:
        start = seg.get("start_time", 0.0)
        end = seg.get("end_time", 999999.0)
        if start <= current_time <= end:
            return seg
    # fallback to latest passed segment
    passed = [s for s in timeline_segments if s.get("start_time", 0.0) <= current_time]
    if passed:
        return passed[-1]
    return timeline_segments[0]


def generate_default_timeline(grade: str, unit_number: int, duration_seconds: float) -> List[Dict[str, Any]]:
    """Synthesize evenly distributed topic intervals when raw video lacks manual markers."""
    grade_data = SYLLABUS_MAP.get(grade, GRADE_10_ICT)
    matching_unit = next((u for u in grade_data["units"] if u["unit_number"] == unit_number), None)
    if not matching_unit or not matching_unit.get("topics"):
        return [{
            "start_time": 0.0,
            "end_time": max(duration_seconds, 60.0),
            "subtopic_id": f"{grade.lower().replace(' ', '')}_u{unit_number}_t1",
            "subtopic_title": f"Unit {unit_number} Overview",
            "concept_id": "intro_ict",
            "key_terms": ["ICT", "Fundamentals"],
            "summary_hint": "General ICT lesson content.",
        }]

    topics = matching_unit["topics"]
    num_topics = len(topics)
    total_dur = max(duration_seconds, 60.0)
    step = total_dur / num_topics

    timeline = []
    for i, t in enumerate(topics):
        start = round(i * step, 1)
        end = round((i + 1) * step if i < num_topics - 1 else total_dur, 1)
        timeline.append({
            "start_time": start,
            "end_time": end,
            "subtopic_id": t["subtopic_id"],
            "subtopic_title": t["title"],
            "concept_id": t.get("concept_id"),
            "key_terms": t.get("key_terms", []),
            "summary_hint": t.get("summary_hint", ""),
            "sample_checkpoint_mcq": t.get("sample_checkpoint_mcq"),
        })
    return timeline
