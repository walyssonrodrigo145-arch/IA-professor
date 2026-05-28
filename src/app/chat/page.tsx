"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Activity, User, Sparkles, MessageSquare, 
  History, Dumbbell, BookOpen, Music, Settings,
  Mic, Paperclip, Piano, Download, Menu, X
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: "Olá! Sou seu Mentor Musical especializado em Teclado Gospel e Worship Moderno. Sobre o que você gostaria de estudar hoje? Podemos analisar partituras, criar voicings ou falar sobre improvisação."
  };

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = () => {
    fetch('/api/chat/sessions')
      .then(res => res.json())
      .then(data => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(console.error);
  };

  useEffect(() => {
    let currentSession = localStorage.getItem('mentorMusicalSession');
    if (!currentSession) {
      currentSession = crypto.randomUUID();
      localStorage.setItem('mentorMusicalSession', currentSession);
    }
    setSessionId(currentSession);
    loadSessions();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/chat/history?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      })
      .catch(e => console.error("Erro ao carregar historico do banco", e));
  }, [sessionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo de 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const base64Data = base64Url.split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          const base64Data = base64Url.split(',')[1];
          setAttachedFile({
            name: 'gravacao.webm',
            data: base64Data,
            mimeType: 'audio/webm'
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Permissão de microfone negada ou indisponível.');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sessionId, attachedFile }),
      });
      
      setAttachedFile(null);

      if (messages.length === 1) {
        setTimeout(loadSessions, 1000);
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.result }]);
    } catch (err: any) {
      alert("Erro de comunicação: " + err.message);
      // Remove a mensagem do usuário em caso de falha grave
      setMessages(messages);
    } finally {
      setIsTyping(false);
    }
  };

  const exportToText = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mentor_Musical_Explicacao.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100vh-80px)] bg-zinc-950 text-zinc-100 flex overflow-hidden relative">
      
      {/* Sidebar Overlay Mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Sidebar */}
      <aside className={`absolute md:static top-0 left-0 h-full w-72 md:w-64 border-r border-zinc-800/50 bg-zinc-900/95 md:bg-zinc-900/30 backdrop-blur-xl md:backdrop-blur-none z-50 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
          <button 
            onClick={() => {
              const newSession = crypto.randomUUID();
              localStorage.setItem('mentorMusicalSession', newSession);
              setSessionId(newSession);
              setMessages([INITIAL_MESSAGE]);
              setIsMobileMenuOpen(false);
            }}
            className="flex-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors text-sm font-bold"
          >
            <MessageSquare className="w-4 h-4" /> Nova Conversa
          </button>
          <button className="md:hidden ml-3 text-zinc-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Histórico</h3>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSessionId(session.id);
                    localStorage.setItem('mentorMusicalSession', session.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${sessionId === session.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                  {session.title}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Ferramentas</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors">
                <Dumbbell className="w-4 h-4" /> Exercícios
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors">
                <BookOpen className="w-4 h-4" /> Análises
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors">
                <Music className="w-4 h-4" /> Timbres
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50 text-xs text-zinc-500 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Configurações
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full max-w-full overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md flex-shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 p-2 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-semibold text-sm text-zinc-200 flex items-center gap-2">
             <Piano className="w-4 h-4 text-purple-400" />
             Mentor Musical
          </div>
          <button 
            onClick={() => {
              const newSession = crypto.randomUUID();
              localStorage.setItem('mentorMusicalSession', newSession);
              setSessionId(newSession);
              setMessages([INITIAL_MESSAGE]);
            }} 
            className="text-purple-400 p-2 hover:text-purple-300"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 md:p-8 space-y-4 md:space-y-6"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20' : 'bg-zinc-800'}`}>
                {msg.role === 'assistant' ? <Piano className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <User className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />}
              </div>
              <div className={`flex-1 px-4 py-3 md:px-5 md:py-4 rounded-2xl text-[14px] md:text-[15px] leading-relaxed shadow-sm ${msg.role === 'assistant' ? 'bg-zinc-900 border border-zinc-800/50 text-zinc-300' : 'bg-purple-600/10 border border-purple-500/20 text-zinc-200'}`}>
                {msg.content.split('\n').map((line, i) => {
                  let cleanLine = line.split('**').join('').split('$').join('');
                  if (cleanLine.trim() === '---') {
                    return <hr key={i} className="my-4 border-zinc-800/50" />;
                  }
                  if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
                    return <li key={i} className="ml-4 list-disc mb-1">{cleanLine.trim().substring(2).split('*').join('')}</li>;
                  }
                  if (cleanLine.trim().startsWith('#')) {
                    return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{cleanLine.split('#').join('').trim().split('*').join('')}</h3>;
                  }
                  return <p key={i} className="mb-2 min-h-[1rem]">{cleanLine.split('*').join('')}</p>;
                })}
                {msg.role === 'assistant' && (
                  <div className="mt-5 flex justify-end border-t border-zinc-800/50 pt-3">
                    <button 
                      onClick={() => exportToText(msg.content)} 
                      className="flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-900/30 hover:bg-purple-900/50 px-4 py-2 rounded-lg transition-colors border border-purple-500/20"
                      title="Baixar explicação completa"
                    >
                      <Download className="w-4 h-4" /> Baixar Texto (.txt)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
                <Activity className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="flex-1 px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800/50 text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce delay-75" />
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-6 bg-zinc-950 border-t border-zinc-800/50 flex-shrink-0 pb-safe">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex flex-col gap-2">
            
            {attachedFile && (
              <div className="bg-zinc-800/80 backdrop-blur-md rounded-xl p-2 px-3 flex items-center justify-between w-max shadow-lg ml-2">
                <span className="text-xs text-zinc-300 font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-zinc-400 hover:text-red-400 ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-lg transition-all duration-300 hidden md:block" />
            <div className={`relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl flex items-end p-1.5 md:p-2 shadow-2xl transition-colors ${isRecording ? 'border-red-500/50 shadow-red-500/20' : 'focus-within:border-purple-500/50'}`}>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,audio/*" />

              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 md:p-3 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>

              {isRecording ? (
                 <div className="flex-1 flex items-center justify-center py-2 md:py-3 text-red-400 font-medium animate-pulse text-sm">
                   Gravando áudio... Clique no microfone para parar.
                 </div>
              ) : (
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Pergunte ao Mentor..."
                  className="flex-1 bg-transparent border-none outline-none px-2 py-2 md:py-3 text-[15px] md:text-[15px] text-white placeholder-zinc-500 resize-none max-h-24 md:max-h-32 min-h-[40px] md:min-h-[44px]"
                  rows={1}
                  disabled={isTyping}
                />
              )}

              <button type="button" onClick={toggleRecording} className={`p-2 md:p-3 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-200'}`}>
                <Mic className="w-5 h-5" />
              </button>

              <button 
                type="submit"
                disabled={isTyping || (!input.trim() && !attachedFile)}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-2 md:p-3 ml-1 md:ml-2 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] md:text-[11px] text-zinc-500">O Mentor Musical pode cometer erros de harmonia. Considere conferir no teclado.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
