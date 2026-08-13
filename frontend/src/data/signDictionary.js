const signDictionary = [
  { keyword: 'computer', sinhalaMeaning: 'පරිගණකය', englishMeaning: 'Computer', animationName: 'computer_sign_animation', fallbackGesture: 'typing_pose', subtitleText: 'Computer', sourceGloss: 'COMPUTER', duration: 2 },
  { keyword: 'network', sinhalaMeaning: 'ජාලය', englishMeaning: 'Network', animationName: 'network_sign_animation', fallbackGesture: 'linked_hands_pose', subtitleText: 'Network', sourceGloss: 'NETWORK', duration: 2 },
  { keyword: 'database', sinhalaMeaning: 'දත්ත ගබඩාව', englishMeaning: 'Database', animationName: 'database_sign_animation', fallbackGesture: 'stacked_storage_pose', subtitleText: 'Database', sourceGloss: 'DATABASE', duration: 2 },
  { keyword: 'algorithm', sinhalaMeaning: 'අල්ගොරිතමය', englishMeaning: 'Algorithm', animationName: 'algorithm_sign_animation', fallbackGesture: 'sequence_flow_pose', subtitleText: 'Algorithm', sourceGloss: 'FLOWCHART', duration: 1.9 },
  { keyword: 'software', sinhalaMeaning: 'මෘදුකාංග', englishMeaning: 'Software', animationName: 'software_sign_animation', fallbackGesture: 'logic_open_pose', subtitleText: 'Software', sourceGloss: 'SOFTWARE', duration: 1.8 },
  { keyword: 'hardware', sinhalaMeaning: 'දෘඩාංග', englishMeaning: 'Hardware', animationName: 'hardware_sign_animation', fallbackGesture: 'solid_component_pose', subtitleText: 'Hardware', sourceGloss: 'HARDWARE', duration: 1.8 },
  { keyword: 'internet', sinhalaMeaning: 'අන්තර්ජාලය', englishMeaning: 'Internet', animationName: 'internet_sign_animation', fallbackGesture: 'web_link_pose', subtitleText: 'Internet', sourceGloss: 'INTERNET', duration: 2 },
  { keyword: 'input', sinhalaMeaning: 'ආදානය', englishMeaning: 'Input', animationName: 'input_sign_animation', fallbackGesture: 'inward_point_pose', subtitleText: 'Input', sourceGloss: 'INPUT', duration: 1.7 },
  { keyword: 'output', sinhalaMeaning: 'ප්‍රතිදානය', englishMeaning: 'Output', animationName: 'output_sign_animation', fallbackGesture: 'outward_release_pose', subtitleText: 'Output', sourceGloss: 'OUTPUT', duration: 1.7 },
  { keyword: 'cpu', sinhalaMeaning: 'මධ්‍යම සැකසුම් ඒකකය', englishMeaning: 'CPU', animationName: 'cpu_sign_animation', fallbackGesture: 'center_focus_pose', subtitleText: 'CPU', sourceGloss: 'CPU', duration: 1.8 },
  { keyword: 'memory', sinhalaMeaning: 'මතකය', englishMeaning: 'Memory', animationName: 'memory_sign_animation', fallbackGesture: 'memory_hold_pose', subtitleText: 'Memory', sourceGloss: 'MEMORY', duration: 1.8 },
  { keyword: 'storage', sinhalaMeaning: 'ගබඩා කිරීම', englishMeaning: 'Storage', animationName: 'storage_sign_animation', fallbackGesture: 'memory_hold_pose', subtitleText: 'Storage', sourceGloss: 'STORAGE', duration: 1.8 },
  { keyword: 'keyboard', sinhalaMeaning: 'යතුරුපුවරුව', englishMeaning: 'Keyboard', animationName: 'keyboard_sign_animation', fallbackGesture: 'typing_pose', subtitleText: 'Keyboard', sourceGloss: 'KEYBOARD', duration: 1.7 },
  { keyword: 'mouse', sinhalaMeaning: 'මවුසය', englishMeaning: 'Mouse', animationName: 'mouse_sign_animation', fallbackGesture: 'point_click_pose', subtitleText: 'Mouse', sourceGloss: 'MOUSE', duration: 1.6 },
  { keyword: 'monitor', sinhalaMeaning: 'තිරය', englishMeaning: 'Monitor', animationName: 'monitor_sign_animation', fallbackGesture: 'screen_frame_pose', subtitleText: 'Monitor', sourceGloss: 'MONITOR', duration: 1.7 },
  { keyword: 'code', sinhalaMeaning: 'කේතය', englishMeaning: 'Code', animationName: 'code_sign_animation', fallbackGesture: 'sequence_flow_pose', subtitleText: 'Code', sourceGloss: 'PROGRAM', duration: 1.8 },
  { keyword: 'program', sinhalaMeaning: 'වැඩසටහන', englishMeaning: 'Program', animationName: 'program_sign_animation', fallbackGesture: 'sequence_flow_pose', subtitleText: 'Program', sourceGloss: 'PROGRAM', duration: 1.8 },
  { keyword: 'data', sinhalaMeaning: 'දත්ත', englishMeaning: 'Data', animationName: 'data_sign_animation', fallbackGesture: 'data_cup_pose', subtitleText: 'Data', sourceGloss: 'DATA', duration: 1.8 },
  { keyword: 'information', sinhalaMeaning: 'තොරතුරු', englishMeaning: 'Information', animationName: 'information_sign_animation', fallbackGesture: 'present_information_pose', subtitleText: 'Information', sourceGloss: 'INFORMATION', duration: 1.9 },
  { keyword: 'security', sinhalaMeaning: 'ආරක්ෂාව', englishMeaning: 'Security', animationName: 'security_sign_animation', fallbackGesture: 'shield_pose', subtitleText: 'Security', sourceGloss: 'SECURITY', duration: 1.9 },
  { keyword: 'password', sinhalaMeaning: 'මුරපදය', englishMeaning: 'Password', animationName: 'password_sign_animation', fallbackGesture: 'shield_pose', subtitleText: 'Password', sourceGloss: 'PASSWORD', duration: 1.8 },
  { keyword: 'login', sinhalaMeaning: 'පිවිසුම', englishMeaning: 'Login', animationName: 'login_sign_animation', fallbackGesture: 'inward_point_pose', subtitleText: 'Login', sourceGloss: 'LOGIN', duration: 1.7 },
  { keyword: 'file', sinhalaMeaning: 'ගොනුව', englishMeaning: 'File', animationName: 'file_sign_animation', fallbackGesture: 'document_frame_pose', subtitleText: 'File', sourceGloss: 'FILE', duration: 1.6 },
  { keyword: 'folder', sinhalaMeaning: 'ෆෝල්ඩරය', englishMeaning: 'Folder', animationName: 'folder_sign_animation', fallbackGesture: 'document_frame_pose', subtitleText: 'Folder', sourceGloss: 'FOLDER', duration: 1.6 },
  { keyword: 'server', sinhalaMeaning: 'සර්වරය', englishMeaning: 'Server', animationName: 'server_sign_animation', fallbackGesture: 'stacked_storage_pose', subtitleText: 'Server', sourceGloss: 'SERVER', duration: 1.9 },
  { keyword: 'browser', sinhalaMeaning: 'වෙබ් බ්‍රව්සරය', englishMeaning: 'Browser', animationName: 'browser_sign_animation', fallbackGesture: 'web_link_pose', subtitleText: 'Browser', sourceGloss: 'BROWSER', duration: 1.8 },
  { keyword: 'website', sinhalaMeaning: 'වෙබ් අඩවිය', englishMeaning: 'Website', animationName: 'website_sign_animation', fallbackGesture: 'web_link_pose', subtitleText: 'Website', sourceGloss: 'WEBSITE', duration: 1.8 },
  { keyword: 'email', sinhalaMeaning: 'විද්‍යුත් තැපෑල', englishMeaning: 'Email', animationName: 'email_sign_animation', fallbackGesture: 'message_send_pose', subtitleText: 'Email', sourceGloss: 'EMAIL', duration: 1.8 },
  { keyword: 'cloud', sinhalaMeaning: 'ක්ලවුඩ්', englishMeaning: 'Cloud', animationName: 'cloud_sign_animation', fallbackGesture: 'web_link_pose', subtitleText: 'Cloud', sourceGloss: 'CLOUD', duration: 1.8 },
  { keyword: 'device', sinhalaMeaning: 'උපාංගය', englishMeaning: 'Device', animationName: 'device_sign_animation', fallbackGesture: 'device_frame_pose', subtitleText: 'Device', sourceGloss: 'DEVICE', duration: 1.7 },
];

export const signDictionaryLookup = Object.fromEntries(
  signDictionary.map((entry) => [entry.keyword, entry])
);

export default signDictionary;
