import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, Server, Skull, Crosshair, Map, Mail, Phone, Lock, Eye, EyeOff, Send, Star, FileText, Image as ImageIcon, Languages, ShieldAlert, Cpu, Activity, LayoutTemplate, Database, Menu, X, Download, HelpCircle, Briefcase, Brain, CheckSquare, Square, Plus, Trash2, Smartphone, Wifi, GitBranch, Monitor, Radio, Car, Globe, Maximize2, Minimize2, Palette, CloudDownload, Circle, ChevronUp, Copy, Check } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { chatWithShifter } from './services/gemini';
import { TOOLS, CATEGORIES, Tool } from './data/tools';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

const I18N = {
  en: {
    title: "sh1Fter osint tool v1.1",
    search_placeholder: "Search tools, platforms, scripts...",
    db_indexed: "DB_INDEXED",
    status_online: "STATUS: ONLINE",
    ai_assistant: "AI_ASSISTANT",
    root_dir: "Root Dir",
    pkg: "pkg",
    warning: "WARNING:",
    more_hidden: "MORE TOOLS HIDDEN.",
    refinement: "REFINEMENT QUERY REQUIRED TO PREVENT OVERFLOW.",
    not_found: "Error 0x404: DIRECTORY NOT FOUND",
    add_note: "Add Note",
    note_placeholder: "Enter case notes or clues here...",
    save_record: "SAVE_RECORD",
    chat_header: "Gemini_OSINT_COMMS",
    chat_placeholder: "Enter command, query, or attach file...",
    decrypting: "decrypting response...",
    lang_switch: "RU",
    you: "YOU",
    system: "SYSTEM",
    no_favs: "Error: NO FAVORITES FOUND. STAR TOOLS TO ADD.",
    no_notes: "0 RECORDS FOUND.",
    no_assignments: "0 ASSIGNMENTS FOUND.",
    training_title: "OSINT TRAINING MODULES",
    add_assignment: "CREATE ASSIGNMENT",
    assignment_name: "Assignment Name (e.g. Fraud Investigation)",
    add_task: "Add Task...",
    top: "TOP",
    legal_title: "LEGAL DISCLAIMER",
    legal_body: "sh1Fter is an analytical utility. I am not responsible for your actions within this tool. It is designed to collect only legal, open-source data (OSINT). Any illegal use of the provided tools and datasets is strictly prohibited and falls entirely under your responsibility.",
    accept: "AGREE & ENTER",
    help_title: "SYSTEM DOCUMENTATION",
    help_body: "[FREE]: Tool is completely free without limits.\n[FREEMIUM]: Tool is free, but features or API usage are limited.\n[PAID]: Tool requires a paid subscription.\n\n[TOP]: Highlighted with a brighter border and pulsing beacon. Curated high-quality, most effective tool in its category.",
    chat_welcome_1: "> Connection established. sh1Fter-OS v1.1 ready.",
    chat_welcome_2: "> Over 500+ OSINT tools indexed. Ask questions, upload files. I am online and parse syntax.",
    quick_1: "IP PROFILE",
    quick_2: "ANALYZE IMAGE",
    quick_3: "BUILD GRAPH",
    quick_4: "GEOLOCATE",
    export_notes: "EXPORT TXT"
  },
  ru: {
    title: "sh1Fter osint tool v1.1",
    search_placeholder: "Поиск инструментов, датасетов, скриптов...",
    db_indexed: "БАЗА_ДАННЫХ",
    status_online: "СТАТУС: В СЕТИ",
    ai_assistant: "ИИ_АССИСТЕНТ",
    root_dir: "Корневой Каталог",
    pkg: "пакет",
    warning: "ВНИМАНИЕ:",
    more_hidden: "ИНСТРУМЕНТОВ СКРЫТО.",
    refinement: "ТРЕБУЕТСЯ УТОЧНЕНИЕ ЗАПРОСА.",
    not_found: "Ошибка 0x404: ДИРЕКТОРИЯ НЕ НАЙДЕНА",
    add_note: "Добавить заметку",
    note_placeholder: "Введи улики или заметки по кейсу...",
    save_record: "СОХРАНИТЬ",
    chat_header: "Gemini_OSINT_COMMS",
    chat_placeholder: "Команда, запрос или загрузи файл...",
    decrypting: "дешифровка ответа...",
    lang_switch: "EN",
    you: "ТЫ",
    system: "СИСТЕМА",
    no_favs: "Ошибка: Избранного нет. Отмечай инструменты.",
    no_notes: "ЗАПИСЕЙ НЕ НАЙДЕНО.",
    no_assignments: "ДЕЛ НЕ НАЙДЕНО.",
    training_title: "ОБУЧАЮЩИЕ МОДУЛИ OSINT",
    add_assignment: "СОЗДАТЬ ДЕЛО",
    assignment_name: "Название дела (напр. Скам-сеть)",
    add_task: "Добавить задачу...",
    top: "ЛУЧШИЙ ВЫБОР",
    legal_title: "ПРАВОВАЯ ИНФОРМАЦИЯ",
    legal_body: "sh1Fter — аналитическая утилита. Я не несу ответственности за ваши действия в этой программе. Инструмент предназначен исключительно для работы с легальными открытыми данными (OSINT). Любое незаконное использование инструментов и баз данных строго запрещено и является вашей личной ответственностью.",
    accept: "ПРИНЯТЬ И ВОЙТИ",
    help_title: "СИСТЕМНАЯ ДОКУМЕНТАЦИЯ",
    help_body: "[FREE]: Бесплатный инструмент без лимитов.\n[FREEMIUM]: Основной функционал бесплатен, но есть ограничения (ограничения API, подписка).\n[PAID]: Платный инструмент (лицензия).\n\n[TOP]: Инструмент выделен светящейся рамкой и маячком. Означает, что это наиболее мощный и качественный инструмент в своей категории.",
    chat_welcome_1: "> Соединение установлено. sh1Fter-OS v1.1 готов.",
    chat_welcome_2: "> Здесь 500+ OSINT-инструментов. Задавай вопросы, грузи файлы. Я на связи и понимаю синтаксис.",
    quick_1: "Анализ IP",
    quick_2: "Обзор фото",
    quick_3: "Граф связей",
    quick_4: "Геолокация",
    export_notes: "ЭКСПОРТ TXT"
  }
};

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'All': 'Все',
  'Favorites': 'Избранное',
  'Notes DB': 'Заметки БД',
  'Assignments': 'Задания / Дела',
  'Training': 'Обучение',
  'OSINT Frameworks & Colls': 'Сборки и Фреймворки',
  'Graph Board / Maltego': 'Графы / Связи',
  'Social Media & Messengers': 'Соцсети и Мессенджеры',
  'GEOINT': 'Георазведка',
  'Dark Web': 'Даркнет',
  'Email & Telephone': 'Почта и Телефон',
  'Network & IP': 'Сети и IP',
  'Corporate & Financial': 'Бизнес и Финансы',
  'Breaches & Leaks': 'Утечки Баз Данных',
  'Metadata & Forensics': 'Метаданные и Форензика',
  'Blockchain & Crypto': 'Блокчейн и Крипта',
  'Threat Intelligence': 'Киберразведка',
  'Hardware & Radio': 'Оборудование и Радио',
  'Source Code & Repos': 'Код и Исходники',
  'Gaming Platforms': 'Игровые Платформы'
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'All': <Terminal size={16} />,
  'Favorites': <Star size={16} />,
  'Notes DB': <FileText size={16} />,
  'Assignments': <Briefcase size={16} />,
  'Training': <Brain size={16} />,
  'OSINT Frameworks & Colls': <LayoutTemplate size={16} />,
  'Graph Board / Maltego': <Server size={16} />,
  'Social Media & Messengers': <Eye size={16} />,
  'GEOINT': <Map size={16} />,
  'Dark Web': <Skull size={16} />,
  'Email & Telephone': <Phone size={16} />,
  'Network & IP': <Crosshair size={16} />,
  'Corporate & Financial': <Lock size={16} />,
  'Breaches & Leaks': <Mail size={16} />,
  'Metadata & Forensics': <ShieldAlert size={16} />,
  'Blockchain & Crypto': <Activity size={16} />,
  'Threat Intelligence': <Database size={16} />,
  'Hardware & Radio': <Cpu size={16} />,
  'Source Code & Repos': <Terminal size={16} />,
  'Gaming Platforms': <Monitor size={16} />,
};

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const CodeBlock = ({ inline, className, children, node, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const isBlock = match || (node?.position?.start?.line !== node?.position?.end?.line);
  const codeContent = String(children).replace(/\n$/, '');
  const lang = match ? match[1].toLowerCase() : '';
  const isPreviewable = ['html', 'javascript', 'js', 'svg'].includes(lang);
  
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifter_code.${match ? match[1] : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isBlock) {
    return (
      <div className="flex flex-col gap-2 my-4">
        <div className="relative group">
          <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {isPreviewable && (
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className={`p-1 px-2 border rounded hover:border-green-500 transition-colors flex items-center gap-1.5 ${showPreview ? 'bg-green-900/50 text-green-300 border-green-500' : 'bg-[#050505] border-green-900 text-green-500 hover:text-green-400 hover:bg-green-900/30'}`}
                title="Toggle Preview"
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="text-[10px] font-mono tracking-wider">PREVIEW</span>
              </button>
            )}
            <button 
              onClick={handleCopy}
              className="p-1 px-2 bg-[#050505] border border-green-900 rounded text-green-500 hover:text-green-400 hover:border-green-500 hover:bg-green-900/30 transition-colors flex items-center gap-1.5"
              title="Copy Code"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span className="text-[10px] font-mono tracking-wider">{copied ? 'COPIED' : 'COPY'}</span>
            </button>
            <button 
              onClick={handleDownload}
              className="p-1 px-2 bg-[#050505] border border-green-900 rounded text-green-500 hover:text-green-400 hover:border-green-500 hover:bg-green-900/30 transition-colors flex items-center gap-1.5"
              title="Download Code"
            >
              <Download size={14} />
              <span className="text-[10px] font-mono tracking-wider">DL</span>
            </button>
          </div>
          
          <pre className={`bg-[#050505] border border-green-900/50 p-4 rounded text-green-400 font-mono text-xs overflow-x-auto shadow-[inset_0_0_20px_rgba(0,255,65,0.05)] text-left relative ${showPreview ? 'hidden' : 'block pt-10'}`}>
            {match && (
              <div className="absolute top-0 left-0 bg-green-900/40 px-3 py-1 text-[10px] font-bold text-green-500 rounded-br-lg border-b border-r border-green-900/50">
                {match[1].toUpperCase()}
              </div>
            )}
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
        
        {showPreview && isPreviewable && (
          <div className="bg-white rounded border border-green-900/50 overflow-hidden min-h-[600px] flex flex-col relative group/preview">
            {lang === 'html' && (
              <button
                className="absolute top-2 right-2 bg-black/70 text-green-400 border border-green-500 rounded px-3 py-1 text-xs opacity-0 group-hover/preview:opacity-100 transition-opacity z-10 hover:bg-black"
                onClick={() => {
                  const blob = new Blob([codeContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}
              >
                OPEN IN NEW TAB
              </button>
            )}
            <iframe 
              srcDoc={lang === 'javascript' || lang === 'js' ? `<!DOCTYPE html><html><body><script>${codeContent}</script></body></html>` : codeContent}
              className="w-full border-none min-h-[600px] flex-1"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        )}
      </div>
    );
  }
  
  return <code className="bg-green-950/50 border border-green-900/50 px-1 py-0.5 rounded text-green-400 font-mono text-xs" {...props}>{children}</code>;
};

const MarkdownComponents = {
  ul: ({ children }: any) => <ul className="space-y-1 my-2">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex gap-2 items-start text-green-400">
      <span className="mt-1.5 flex-shrink-0">
        <Circle size={8} className="fill-green-500 text-green-500" />
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  ),
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed text-green-300">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-green-400">{children}</strong>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-500 underline hover:text-green-300">{children}</a>,
  code: CodeBlock,
  pre: ({ children }: any) => <div className="not-prose my-2">{children}</div>
};

const TypewriterText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let current = '';
    let i = 0;
    // Fast typing speed
    const interval = setInterval(() => {
      if (i < text.length) {
        // add chunks of characters to make it faster if needed
        const chunkSize = Math.max(1, Math.floor(text.length / 200));
        current += text.substring(i, i + chunkSize);
        setDisplayed(current);
        i += chunkSize;
      } else {
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="markdown-body text-[12px] sm:text-[13px] max-w-full">
      <Markdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
        {displayed}
      </Markdown>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<'en'|'ru'>('ru');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Disclaimer State
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    localStorage.getItem('shifter-agreed') === 'true'
  );

  // Notes state
  const [notes, setNotes] = useState<{id: string, text: string, date: string}[]>([]);
  const [newNote, setNewNote] = useState('');

  // Assignments state
  const [assignments, setAssignments] = useState<{id: string, name: string, tasks: {id: string, name: string, done: boolean}[]}[]>([]);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [newTaskInput, setNewTaskInput] = useState<Record<string, string>>({});

  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string, fileUrl?: string, fileName?: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const t = I18N[lang];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingAuth(false);
      
      if (u) {
        // Init user record for favorites
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', u.uid), { favorites: [] });
          } else {
            setFavorites(new Set(userDoc.data()?.favorites || []));
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setFavorites(new Set());
        setNotes([]);
        setAssignments([]);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'users', user.uid, 'notes'), where('userId', '==', user.uid)), (snapshot) => {
      const data: {id: string, text: string, date: string}[] = [];
      snapshot.forEach(d => {
         const dn = d.data();
         data.push({ id: d.id, text: dn.text, date: dn.date });
      });
      setNotes(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, error => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notes`));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'users', user.uid, 'assignments'), where('userId', '==', user.uid)), (snapshot) => {
      const data: {id: string, name: string, tasks: {id: string, name: string, done: boolean}[]}[] = [];
      snapshot.forEach(d => {
         const da = d.data();
         data.push({ id: d.id, name: da.name, tasks: da.tasks || [] });
      });
      setAssignments(data);
    }, error => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assignments`));
    return unsub;
  }, [user]);

  const exportNotes = () => {
    if (!notes.length) return;
    const textData = notes.map(n => `[${new Date(n.date).toLocaleString()}]\n${n.text}\n-------------------`).join('\n\n');
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifter_notes_export_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // When a model message starts, we scroll to its top if it's the last one
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model' && isTyping) {
       // We don't scroll to bottom, we stay at the start of the message
       // Actually, we scroll so the message start is visible
       const lastMsg = chatEndRef.current?.previousElementSibling;
       if (lastMsg) {
         lastMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
    } else if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  const toggleFav = async (id: string) => {
    if (!user) return loginWithGoogle();
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { favorites: Array.from(next) });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { loginWithGoogle(); return; }
    if (!newNote.trim()) return;
    const nId = Date.now().toString();
    try {
      await setDoc(doc(db, 'users', user.uid, 'notes', nId), {
        text: newNote,
        date: new Date().toISOString(),
        userId: user.uid
      });
      setNewNote('');
    } catch(e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/notes/${nId}`);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
    } catch(e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/notes/${id}`);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { loginWithGoogle(); return; }
    if (!newAssignmentName.trim()) return;
    const aId = Date.now().toString();
    try {
      await setDoc(doc(db, 'users', user.uid, 'assignments', aId), {
        name: newAssignmentName,
        userId: user.uid,
        tasks: []
      });
      setNewAssignmentName('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/assignments/${aId}`);
    }
  };

  const handleAddTask = async (assignmentId: string) => {
    if (!user) return;
    const text = newTaskInput[assignmentId];
    if (!text?.trim()) return;
    
    const a = assignments.find(x => x.id === assignmentId);
    if (!a) return;
    
    try {
      const updatedTasks = [...a.tasks, { id: Date.now().toString(), name: text, done: false }];
      await updateDoc(doc(db, 'users', user.uid, 'assignments', assignmentId), {
        tasks: updatedTasks
      });
      setNewTaskInput({ ...newTaskInput, [assignmentId]: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/assignments/${assignmentId}`);
    }
  };

  const toggleTask = async (assignmentId: string, taskId: string) => {
    if (!user) return;
    const a = assignments.find(x => x.id === assignmentId);
    if (!a) return;

    const updatedTasks = a.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'assignments', assignmentId), {
        tasks: updatedTasks
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/assignments/${assignmentId}`);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'assignments', assignmentId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/assignments/${assignmentId}`);
    }
  };

          useEffect(() => {
    setVisibleCount(30); // Reset infinite scroll on category or search change
  }, [activeCategory, searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setVisibleCount(prev => prev + 30);
      }
    }
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const acceptDisclaimer = () => {
    localStorage.setItem('shifter-agreed', 'true');
    setDisclaimerAccepted(true);
  };

  // Filtering tools
  const filteredTools = TOOLS.filter(tool => {
    if (activeCategory === 'Favorites') return favorites.has(tool.id);
    if (activeCategory === 'Notes DB' || activeCategory === 'Assignments' || activeCategory === 'Training') return false; 
    
    const matchesCat = activeCategory === 'All' || tool.category === activeCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description[lang].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    if (a.isTop && !b.isTop) return -1;
    if (!a.isTop && b.isTop) return 1;
    return 0;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
           setVisibleCount(prev => prev + 30);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [filteredTools.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !selectedFile) return;

    const userMessage = chatInput.trim();
    let b64: string | undefined;
    let mime: string | undefined;

    const newChatMsg: {role: 'user', content: string, fileUrl?: string, fileName?: string} = { 
      role: 'user', 
      content: userMessage || 'FILE_DATA_ATTACHED' 
    };

    if (selectedFile) {
      b64 = await toBase64(selectedFile);
      mime = selectedFile.type;
      newChatMsg.fileUrl = URL.createObjectURL(selectedFile);
      newChatMsg.fileName = selectedFile.name;
    }

    setChatInput('');
    setSelectedFile(null);
    setChatHistory(prev => [...prev, newChatMsg]);
    setIsTyping(true);

    const apiHistory = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await chatWithShifter(userMessage, apiHistory, b64, mime);
    
    setIsTyping(false);
    setChatHistory(prev => [...prev, { role: 'model', content: response }]);
  };

  const handleDeleteMessage = (idx: number) => {
    setChatHistory(prev => prev.filter((_, i) => i !== idx));
  };

  const getBorderColor = (category: string) => {
    if (category.includes('Social') || category.includes('Messengers')) return 'border-cyan-500/50 hover:border-cyan-400';
    if (category.includes('Threat') || category.includes('Breaches')) return 'border-red-500/50 hover:border-red-400';
    if (category.includes('Dark')) return 'border-purple-500/50 hover:border-purple-400';
    if (category.includes('Blockchain') || category.includes('Financial')) return 'border-amber-500/50 hover:border-amber-400';
    return 'border-green-900 hover:border-green-400';
  };

  const getAccentColor = (category: string) => {
    if (category.includes('Social') || category.includes('Messengers')) return 'text-cyan-400';
    if (category.includes('Threat') || category.includes('Breaches')) return 'text-red-400';
    if (category.includes('Dark')) return 'text-purple-400';
    if (category.includes('Blockchain') || category.includes('Financial')) return 'text-amber-400';
    return 'text-green-400';
  };

  if (!disclaimerAccepted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 crt font-mono selection:bg-green-500 selection:text-black">
        <div className="max-w-2xl border border-green-900 bg-[#050000] p-6 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.15)] relative">
          <div className="flex justify-between items-center mb-6 border-b border-green-900/50 pb-4">
            <h1 className="text-xl sm:text-2xl text-green-500 font-bold tracking-widest uppercase glitch" data-text={t.legal_title}>{t.legal_title}</h1>
            <ShieldAlert className="text-green-500 flex-shrink-0" size={28} />
          </div>
          <p className="text-green-400/90 text-sm sm:text-base leading-relaxed mb-8">
            {t.legal_body}
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-4 items-center">
            <button onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} className="text-xs text-green-500/50 hover:text-green-500 transition-colors uppercase tracking-widest w-full sm:w-auto text-left sm:text-right">
              [ {lang === 'en' ? 'SWITCH TO RU' : 'SWITCH TO EN'} ]
            </button>
            <button 
              onClick={acceptDisclaimer}
              className="w-full sm:w-auto bg-green-950/50 hover:bg-green-900/80 text-green-300 border border-green-700 px-6 py-3 sm:py-2 uppercase tracking-widest font-bold transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]"
            >
              &gt; {t.accept}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`crt min-h-screen flex flex-col font-mono selection:bg-green-500 selection:text-black transition-all duration-300 ${
        fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
      }`}
    >
      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[300px] border-l border-green-500 bg-[#020202] z-[70] p-6 flex flex-col gap-6 shadow-2xl"
          >
            <div className="flex justify-between items-center text-green-400">
              <h2 className="font-bold uppercase tracking-widest flex items-center gap-2"><Palette size={20}/> UI Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)}>[ X ]</button>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className="text-xs uppercase text-green-700">Font Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sm', 'base', 'lg'] as const).map(size => (
                  <button key={size} onClick={() => setFontSize(size)} className={`p-2 border text-xs uppercase ${fontSize === size ? 'border-green-400 bg-green-900/40 text-green-400' : 'border-green-900 text-green-700'}`}>{size}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs uppercase text-green-700">Layout Density</label>
               <div className="grid grid-cols-2 gap-2">
                 {(['compact', 'comfortable'] as const).map(density => (
                   <button key={density} onClick={() => setLayoutDensity(density)} className={`p-2 border text-xs uppercase ${layoutDensity === density ? 'border-green-400 bg-green-900/40 text-green-400' : 'border-green-900 text-green-700'}`}>{density}</button>
                 ))}
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main App Content ... */}
      <header className={`border-b border-green-900 bg-black/80 backdrop-blur-sm ${layoutDensity === 'compact' ? 'p-2' : 'p-4'} flex justify-between items-center sticky top-0 z-40 relative`}>
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden text-green-500 hover:text-green-300 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Terminal size={24} className="text-green-400 hidden sm:block" />
          <h1 className="text-xl font-bold tracking-widest uppercase glitch cursor-pointer" data-text={t.title} onClick={() => {}}>
            {t.title}
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 text-xs uppercase tracking-widest text-green-700">
          <button 
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 hover:text-green-400 transition-colors"
            title="System Documentation"
          >
            <HelpCircle size={16} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 hover:text-green-400 transition-colors"
            title="UI Settings"
          >
            <Palette size={16} />
          </button>
          <button 
            onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
            className="flex items-center gap-1 border border-green-900 hover:bg-green-900/40 px-2 py-1 text-green-500 transition-colors"
          >
            <Languages size={14} /> {t.lang_switch}
          </button>
          <span className="hidden lg:inline-block animate-pulse">{t.db_indexed}: {TOOLS.length}</span>
          <span className="flex items-center">
            {user ? (
              <button 
                onClick={() => logout()}
                className="hover:text-green-500 transition-colors flex items-center gap-1 max-w-[120px] sm:max-w-[200px] truncate"
                title="Google Log Out"
              >
                <span className="hidden sm:inline">USER:</span>
                <span className="truncate flex-1 text-left">***@*.*</span>
                <span className="text-[10px] bg-red-900/30 text-red-500 border border-red-900 px-1 ml-1 rounded-sm flex-shrink-0">OUT</span>
              </button>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="text-cyan-500 hover:text-cyan-400 transition-colors bg-cyan-900/20 border border-cyan-900 px-2 py-0.5 animate-pulse"
              >
                LOGIN <span className="hidden sm:inline">TO CLOUD</span>
              </button>
            )}
          </span>
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="border border-green-900 bg-green-950/30 px-2 sm:px-3 py-1 hover:bg-green-900/50 hover:text-green-300 transition-colors flex items-center gap-2 text-green-400"
          >
            <Server size={14} /> <span className="hidden sm:inline">{t.ai_assistant}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          absolute z-30 inset-y-0 left-0 bg-[#020202] border-r border-green-900 w-64 transform transition-transform duration-300 ease-in-out py-4 flex flex-col gap-1 overflow-y-auto
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 shadow-[20px_0_30px_rgba(0,0,0,0.8)]' : '-translate-x-full'}
        `}>
          <div className="text-[10px] text-green-700 uppercase mb-2 px-4 tracking-widest">&gt;&gt; {t.root_dir}</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-4 ${layoutDensity === 'compact' ? 'py-1.5' : 'py-2.5'} text-sm transition-all border-l-2
                ${activeCategory === cat 
                  ? 'border-green-400 bg-green-900/20 text-green-400 font-bold shadow-[inset_2px_0_10px_rgba(0,255,65,0.1)]' 
                  : 'border-transparent text-green-700 hover:text-green-500 hover:bg-green-900/10'}`}
            >
              {CATEGORY_ICONS[cat] || <Terminal size={16} />}
              {lang === 'ru' ? CATEGORY_TRANSLATIONS[cat] || cat : cat}
            </button>
          ))}
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative bg-[#050505]">
          <div className="p-4 md:p-6 border-b border-green-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="text-xl md:text-2xl font-bold tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,255,65,0.5)] flex items-center gap-3">
              &gt; {lang === 'ru' ? CATEGORY_TRANSLATIONS[activeCategory] || activeCategory : activeCategory}
            </div>
            
            {activeCategory !== 'Notes DB' && (
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" size={16} />
                <input 
                  type="text" 
                  placeholder={t.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-green-900 text-green-500 px-10 py-2 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all font-mono text-sm placeholder:text-green-900"
                />
              </div>
            )}
          </div>

          <div 
            ref={scrollRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-6"
          >
            
            {/* Notes Section Render */}
            {activeCategory === 'Notes DB' ? (
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                  <textarea 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder={t.note_placeholder}
                    className="w-full bg-[#0a0a0a] border border-green-900/50 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none p-4 text-green-500 placeholder:text-green-900/50 min-h-[120px] resize-y"
                  />
                  <div className="flex justify-end gap-2">
                    {notes.length > 0 && (
                      <button type="button" onClick={exportNotes} className="bg-green-900/10 border border-green-900 hover:bg-green-900/30 text-green-600 px-4 py-2 transition-colors flex items-center gap-2">
                        <CloudDownload size={16}/> {t.export_notes}
                      </button>
                    )}
                    <button type="submit" className="bg-green-900/30 border border-green-700 hover:bg-green-900/50 text-green-400 px-6 py-2 transition-colors flex items-center gap-2">
                       <FileText size={16}/> {t.save_record}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.length === 0 && <div className="col-span-full py-10 tracking-widest text-center text-green-900 uppercase glitch" data-text={t.no_notes}>{t.no_notes}</div>}
                  {notes.map(note => (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} key={note.id} className="border border-green-900/40 bg-green-950/10 p-4 flex flex-col gap-2 relative group">
                      <button onClick={() => handleDeleteNote(note.id)} className="absolute top-2 right-2 text-green-900 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         [ X ]
                      </button>
                      <div className="text-[10px] text-green-700/50">{new Date(note.date).toLocaleString()}</div>
                      <div className="text-green-400 whitespace-pre-wrap text-sm">{note.text}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activeCategory === 'Assignments' ? (
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <form onSubmit={handleAddAssignment} className="flex gap-3">
                  <input 
                    type="text"
                    value={newAssignmentName}
                    onChange={e => setNewAssignmentName(e.target.value)}
                    placeholder={t.assignment_name}
                    className="flex-1 bg-[#0a0a0a] border border-green-900/50 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none px-4 py-3 text-green-500 placeholder:text-green-900/50"
                  />
                  <button type="submit" className="bg-green-900/30 border border-green-700 hover:bg-green-900/50 text-green-400 px-6 py-2 transition-colors flex items-center gap-2 uppercase tracking-widest font-bold whitespace-nowrap">
                     <Plus size={16}/> {t.add_assignment}
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {assignments.length === 0 && <div className="col-span-full py-10 tracking-widest text-center text-green-900 uppercase glitch" data-text={t.no_assignments}>{t.no_assignments}</div>}
                  {assignments.map(assignment => (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} key={assignment.id} className="border border-green-900/40 bg-green-950/10 p-5 flex flex-col gap-4 relative group">
                      <div className="flex justify-between items-start border-b border-green-900/30 pb-3">
                        <h3 className="text-green-400 font-bold uppercase tracking-widest text-lg">{assignment.name}</h3>
                        <button onClick={() => deleteAssignment(assignment.id)} className="text-green-900 hover:text-red-500 transition-colors bg-black/50 p-1">
                           <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 flex-1">
                        {assignment.tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-3 group/task cursor-pointer" onClick={() => toggleTask(assignment.id, task.id)}>
                            <div className="mt-0.5 text-green-600 group-hover/task:text-green-400 transition-colors">
                              {task.done ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
                            </div>
                            <span className={`text-sm flex-1 transition-colors ${task.done ? 'text-green-900 line-through' : 'text-green-300'}`}>
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleAddTask(assignment.id); }} 
                        className="mt-auto flex gap-2 pt-3 border-t border-green-900/20"
                      >
                        <input 
                          type="text"
                          value={newTaskInput[assignment.id] || ''}
                          onChange={e => setNewTaskInput({...newTaskInput, [assignment.id]: e.target.value})}
                          placeholder={t.add_task}
                          className="flex-1 bg-transparent border-b border-green-900/50 focus:border-green-500 outline-none px-2 py-1 text-sm text-green-400 placeholder:text-green-900/50"
                        />
                        <button type="submit" className="text-green-700 hover:text-green-400 p-1"><Plus size={16} /></button>
                      </form>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activeCategory === 'Training' ? (
              <div className="max-w-4xl mx-auto flex flex-col gap-6 text-green-500 font-mono">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-6 text-green-400">{t.training_title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Level 1 */}
                  <div className="border border-green-900/50 bg-[#0a0a0a] p-8 hover:border-green-500 transition-colors flex flex-col min-h-[200px]">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-300 mb-4 uppercase flex items-center gap-3"><Brain size={28}/> {lang === 'en' ? 'Level 1: Beginner' : 'Уровень 1 (Новичок)'}</h3>
                      <p className="text-base text-green-600 mb-6">{lang === 'en' ? 'Basic OSINT: search engines, basic social media, and simple metadata.' : 'Базовый OSINT: поисковые системы, соцсети и простые метаданные.'}</p>
                    </div>
                    <button className="border border-green-900 px-6 py-3 text-sm uppercase tracking-widest hover:bg-green-900/30 w-full text-left font-bold mt-auto" onClick={() => { setIsChatOpen(true); setChatInput(lang === 'en' ? 'Start Training: Level 1 (Beginner)' : 'Начать обучение: Уровень 1 (Новичок)'); }}>&gt; {lang === 'en' ? 'START LEVEL 1' : 'НАЧАТЬ УРОВЕНЬ 1'}</button>
                  </div>
                  {/* Level 2 */}
                  <div className="border border-green-900/50 bg-[#0a0a0a] p-8 hover:border-green-500 transition-colors flex flex-col min-h-[200px]">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-300 mb-4 uppercase flex items-center gap-3"><Brain size={28}/> {lang === 'en' ? 'Level 2: Amateur' : 'Уровень 2 (Любитель)'}</h3>
                      <p className="text-base text-green-600 mb-6">{lang === 'en' ? 'Intermediate techniques: people search, breach databases, and image tracking.' : 'Средний уровень: поиск по людям, базы утечек, обратный поиск по фото.'}</p>
                    </div>
                    <button className="border border-green-900 px-6 py-3 text-sm uppercase tracking-widest hover:bg-green-900/30 w-full text-left font-bold mt-auto" onClick={() => { setIsChatOpen(true); setChatInput(lang === 'en' ? 'Start Training: Level 2 (Amateur)' : 'Начать обучение: Уровень 2 (Любитель)'); }}>&gt; {lang === 'en' ? 'START LEVEL 2' : 'НАЧАТЬ УРОВЕНЬ 2'}</button>
                  </div>
                  {/* Level 3 */}
                  <div className="border border-green-900/50 bg-[#0a0a0a] p-8 hover:border-green-500 transition-colors flex flex-col min-h-[200px]">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-300 mb-4 uppercase flex items-center gap-3"><Brain size={28}/> {lang === 'en' ? 'Level 3: Experienced' : 'Уровень 3 (Опытный)'}</h3>
                      <p className="text-base text-green-600 mb-6">{lang === 'en' ? 'Advanced OSINT: graph analytics, dark web basics, and crypto tracing.' : 'Продвинутый OSINT: графовая аналитика, базовый даркнет и крипто-форензика.'}</p>
                    </div>
                    <button className="border border-green-900 px-6 py-3 text-sm uppercase tracking-widest hover:bg-green-900/30 w-full text-left font-bold mt-auto" onClick={() => { setIsChatOpen(true); setChatInput(lang === 'en' ? 'Start Training: Level 3 (Experienced)' : 'Начать обучение: Уровень 3 (Опытный)'); }}>&gt; {lang === 'en' ? 'START LEVEL 3' : 'НАЧАТЬ УРОВЕНЬ 3'}</button>
                  </div>
                  {/* Level 4 */}
                  <div className="border border-green-900/50 bg-[#0a0a0a] p-8 hover:border-green-500 transition-colors flex flex-col min-h-[200px]">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-300 mb-4 uppercase flex items-center gap-3"><Brain size={28}/> {lang === 'en' ? 'Level 4: Pro' : 'Уровень 4 (Профи)'}</h3>
                      <p className="text-base text-green-600 mb-6">{lang === 'en' ? 'Expert methodologies: corporate reconnaissance, deep web monitoring, and forensics.' : 'Экспертные методики: корпоративная разведка, мониторинг глубокой сети и форензика.'}</p>
                    </div>
                    <button className="border border-green-900 px-6 py-3 text-sm uppercase tracking-widest hover:bg-green-900/30 w-full text-left font-bold mt-auto" onClick={() => { setIsChatOpen(true); setChatInput(lang === 'en' ? 'Start Training: Level 4 (Pro)' : 'Начать обучение: Уровень 4 (Профи)'); }}>&gt; {lang === 'en' ? 'START LEVEL 4' : 'НАЧАТЬ УРОВЕНЬ 4'}</button>
                  </div>
                  {/* Level 5 */}
                  <div className="border border-red-500/50 bg-[#0a0a0a] p-8 hover:border-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.1)] md:col-span-2 flex flex-col min-h-[200px]">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-red-400 mb-4 uppercase flex items-center gap-3"><Skull size={32}/> {lang === 'en' ? 'Level 5: Chief' : 'Уровень 5 (Шеф)'}</h3>
                      <p className="text-base text-red-500/80 mb-6">{lang === 'en' ? 'Master class: zero-day integrations, total anonymity stripping, and advanced automation.' : 'Мастер-класс: полная деанонимизация, квантовый поиск, скриптинг и тотальный OSINT 20-го уровня.'}</p>
                    </div>
                    <button className="border border-red-500 px-6 py-4 text-sm text-red-400 uppercase tracking-widest hover:bg-red-900/30 w-full text-left font-bold mt-auto" onClick={() => { setIsChatOpen(true); setChatInput(lang === 'en' ? 'Start Training: Level 5 (Chief)' : 'Начать обучение: Уровень 5 (Шеф)'); }}>&gt; {lang === 'en' ? 'START LEVEL 5' : 'НАЧАТЬ УРОВЕНЬ 5'}</button>
                  </div>
                  {/* END TRAINING MODULES */}
                </div>
              </div>
            ) : (
              /* Tools Section Render */
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
                <AnimatePresence>
                  {filteredTools.slice(0, visibleCount).map((tool, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: (idx % 10) * 0.03 }}
                      key={tool.id} 
                      className={`group border bg-[#0a0a0a] p-5 sm:p-6 transition-all relative overflow-hidden flex flex-col transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,255,65,0.2)] cursor-grab active:cursor-grabbing rounded-sm min-h-[220px] ${tool.isTop ? 'border-red-500/80 shadow-[inset_0_0_15px_rgba(220,38,38,0.15)] hover:border-red-400' : getBorderColor(tool.category)}`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {CATEGORY_ICONS[tool.category]}
                      </div>
                      
                      <div className="flex justify-between items-start mb-4 border-b border-green-900/40 pb-3">
                        <div className="flex gap-3 items-center flex-1 pr-2">
                           <button onClick={(e) => { e.preventDefault(); toggleFav(tool.id); }} className="focus:outline-none flex-shrink-0 hover:scale-110 transition-transform">
                             <Star size={20} className={`transition-colors ${favorites.has(tool.id) ? 'fill-green-500 text-green-500' : 'text-green-900 hover:text-green-500/50'}`} />
                           </button>
                           <a href={tool.url} target="_blank" rel="noreferrer" className={`text-lg sm:text-xl font-bold hover:underline truncate ${tool.isTop ? 'text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]' : getAccentColor(tool.category)}`} title={tool.name}>
                             {tool.name}
                           </a>
                           {tool.isTop && (
                             <span className="hidden sm:flex items-center gap-1.5 ml-2 text-[10px] bg-red-950/40 text-red-400 border border-red-500/50 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-bold">
                               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> {t.top}
                             </span>
                           )}
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 border flex-shrink-0 rounded-sm ${
                          tool.price === 'Free' ? 'border-green-500 text-green-500' :
                          tool.price === 'Paid' ? 'border-red-500 text-red-500' :
                          'border-cyan-400 text-cyan-400' 
                        }`}>
                          {tool.price}
                        </span>
                      </div>
                      
                      <div className="text-xs text-green-700 mb-3 tracking-widest uppercase truncate font-bold">
                        {t.pkg}: {lang === 'ru' ? CATEGORY_TRANSLATIONS[tool.category] || tool.category : tool.category}
                      </div>
                      
                      {tool.isTop && ( // Show Top tag on mobile via subtitle
                        <div className="sm:hidden flex items-center gap-1.5 text-[10px] text-red-400 mb-3 uppercase tracking-widest font-bold"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> {t.top}</div>
                      )}

                      <p className="text-sm sm:text-base font-medium text-green-300/90 mb-6 flex-1 leading-relaxed group-hover:text-green-100 transition-colors">
                        {tool.description[lang]}
                      </p>
                      
                      <div className="bg-[#030303] border border-green-900/40 p-3 sm:p-3.5 text-xs sm:text-sm text-green-400 mt-auto font-mono flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide group-hover:border-green-600/60 rounded-sm transition-colors shadow-inner">
                        <span className="text-green-700 select-none mr-2">$ </span>
                        {typeof tool.example === 'string' ? tool.example : tool.example[lang]}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredTools.length > visibleCount && (
                  <div ref={loaderRef} className="col-span-full py-8 text-center text-green-700 border border-dashed border-green-900/50">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                       <Crosshair className="animate-spin-slow" size={16} /> <span>Loading more tools automatically...</span>
                    </div>
                  </div>
                )}
                {filteredTools.length === 0 && (
                  <div className="col-span-full py-20 text-center text-red-500 font-bold tracking-widest glitch" data-text={t.not_found}>
                    {activeCategory === 'Favorites' ? t.no_favs : t.not_found}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Scroll to top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                key="scroll-top-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToTop}
                className={`fixed bottom-8 z-[50] bg-black border border-green-500 text-green-400 p-2 sm:p-3 rounded-md hover:bg-green-500 hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)] flex items-center justify-center ${isChatOpen ? 'max-md:hidden md:right-[620px]' : 'right-6 md:right-8'}`}
                title="Scroll to Top"
              >
                <ChevronUp size={24} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </main>

        {/* AI Chatbot Terminal Slide-out */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 bottom-0 ${isChatFullscreen ? 'w-full' : 'w-full md:w-[600px]'} border-l-2 border-green-500 bg-[#010101] z-[60] flex flex-col shadow-[-10px_0_40px_rgba(0,255,65,0.1)] transition-all duration-300`}
            >
              <div className="border-b border-green-900 p-4 flex justify-between items-center bg-green-950/20">
                <div className="flex items-center gap-3">
                  <Terminal className="text-green-400" size={18} />
                  <span className="font-bold tracking-widest uppercase text-sm text-green-400">{t.chat_header}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsChatFullscreen(!isChatFullscreen)} className="text-green-700 hover:text-green-400 transition-colors hidden md:block">
                     {isChatFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="text-green-700 hover:text-green-400 transition-colors">
                     [ X ]
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-5">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start"
                >
                  <div className="text-[10px] mb-1 uppercase tracking-widest text-green-800">
                    &gt;&gt; {t.system}
                  </div>
                  <div className="text-[12px] sm:text-[13px] p-3 whitespace-pre-wrap font-mono relative leading-relaxed max-w-[90%] text-green-300 border-l-2 border-green-500 bg-green-950/20">
                    {t.chat_welcome_1}
                    <br/>
                    {t.chat_welcome_2}
                  </div>
                </motion.div>
                <AnimatePresence initial={false}>
                  {chatHistory.map((msg, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={idx} 
                      className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2">
                        {msg.role === 'user' && (
                          <button onClick={() => handleDeleteMessage(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-900 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        )}
                        <div className={`text-[10px] mb-1 uppercase tracking-widest ${msg.role === 'user' ? 'text-green-700' : 'text-green-800'}`}>
                          &gt;&gt; {msg.role === 'user' ? t.you : t.system}
                        </div>
                        {msg.role === 'model' && (
                          <button onClick={() => handleDeleteMessage(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-900 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div className={`text-[12px] sm:text-[13px] p-3 whitespace-pre-wrap font-mono relative leading-relaxed max-w-[90%]
                        ${msg.role === 'user' 
                          ? 'bg-green-950/30 border border-green-900/50 text-green-400' 
                          : 'text-green-300 border-l-2 border-green-500 bg-green-950/20'
                      }`}>
                        {msg.fileUrl && (
                          <div className="mb-2 border border-green-900 p-1">
                            {msg.fileUrl.startsWith('blob:') && msg.fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img src={msg.fileUrl} alt="uploaded" className="max-w-full h-auto max-h-48 object-contain" />
                            ) : (
                              <div className="flex items-center gap-2 text-green-500 bg-green-950/50 p-2">
                                <FileText size={16} /> <span>{msg.fileName}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.role === 'model' && idx === chatHistory.length - 1 ? (
                          <TypewriterText text={msg.content} />
                        ) : (
                          <div className="markdown-body text-[12px] sm:text-[13px] max-w-full">
                            {msg.role === 'model' ? (
                              <Markdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                {msg.content}
                              </Markdown>
                            ) : (
                              msg.content
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="text-sm p-3 text-green-600 border-l-2 border-green-600 animate-pulse">
                    &gt; {t.decrypting}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-green-900 bg-[#020202] relative">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2 border-b border-green-900/30">
                  <button type="button" onClick={() => setChatInput(t.quick_1)} className="text-[10px] sm:text-xs text-green-600 border border-green-900 px-2 py-1 hover:bg-green-900/30 whitespace-nowrap">{t.quick_1}</button>
                  <button type="button" onClick={() => setChatInput(t.quick_2)} className="text-[10px] sm:text-xs text-green-600 border border-green-900 px-2 py-1 hover:bg-green-900/30 whitespace-nowrap">{t.quick_2}</button>
                  <button type="button" onClick={() => setChatInput(t.quick_3)} className="text-[10px] sm:text-xs text-green-600 border border-green-900 px-2 py-1 hover:bg-green-900/30 whitespace-nowrap">{t.quick_3}</button>
                  <button type="button" onClick={() => setChatInput(t.quick_4)} className="text-[10px] sm:text-xs text-green-600 border border-green-900 px-2 py-1 hover:bg-green-900/30 whitespace-nowrap">{t.quick_4}</button>
                </div>
                <form onSubmit={handleSendMessage} className="flex flex-col gap-2 relative">
                  {selectedFile && (
                    <div className="text-xs text-green-500 flex justify-between items-center bg-green-950/30 px-2 py-1 border border-green-900/50">
                      <span className="truncate max-w-[200px]">File: {selectedFile.name}</span>
                      <button type="button" onClick={() => setSelectedFile(null)} className="text-green-700 hover:text-green-500">[ X ]</button>
                    </div>
                  )}
                  <div className="relative flex items-center">
                    <input 
                      type="file" 
                      accept="*/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute left-3 text-green-700 hover:text-green-400 z-10"
                    >
                      <ImageIcon size={18} />
                    </button>

                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t.chat_placeholder} 
                      className="w-full bg-transparent border border-green-900 text-green-400 pl-10 pr-12 py-3 md:py-3 py-4 text-sm focus:outline-none focus:border-green-500 placeholder:text-green-900"
                    />
                    
                    <button 
                      type="submit" 
                      disabled={isTyping || (!chatInput.trim() && !selectedFile)}
                      className="absolute right-3 text-green-600 hover:text-green-400 disabled:opacity-30 z-10"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* System Documentation Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{opacity: 0}} 
            animate={{opacity: 1}} 
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowHelpModal(false)}
          >
            <div 
              className="bg-[#050505] border border-green-500 shadow-[0_0_40px_rgba(0,255,65,0.2)] p-4 sm:p-6 max-w-[90vw] md:max-w-md w-full relative sm:my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
                <h2 className="text-green-400 font-bold uppercase tracking-widest flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle size={18} /> {t.help_title}
                </h2>
                <button onClick={() => setShowHelpModal(false)} className="text-green-700 hover:text-green-400">[ X ]</button>
              </div>
              <div className="text-green-300/90 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-mono">
                {t.help_body}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Quick Notes FAB */}
      <button 
        onClick={() => {
          setActiveCategory('Notes DB');
          if (window.innerWidth < 768) setIsSidebarOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-[#050505] border-2 border-green-500 text-green-400 p-4 rounded-full shadow-[0_0_20px_rgba(0,255,65,0.4)] flex items-center justify-center hover:bg-green-900/40 active:scale-95 transition-all"
        title="Mobile Notes"
      >
        <Smartphone size={24} />
      </button>

    </div>
  );
}
