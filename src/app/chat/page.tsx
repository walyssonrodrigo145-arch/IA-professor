"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Activity, User, Sparkles, MessageSquare, 
  History, Dumbbell, BookOpen, Music, Settings,
  Mic, Paperclip, Piano, Download, Menu, X, FileText
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: "Olá! Sou seu Mentor Musical especializado em Teclado Gospel e Worship Moderno. Sobre o que você gostaria de estudar hoje? Podemos analisar partituras (PDF), ouvir seu áudio, criar voicings ou falar sobre improvisação."
  };

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [sessions, setSessions] = useState<{id: string, title: string}[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = (devId: string) => {
    fetch(`/api/chat/sessions?deviceId=${devId}`)
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

    let devId = localStorage.getItem('deviceId');
    if (!devId) {
      devId = crypto.randomUUID();
      localStorage.setItem('deviceId', devId);
    }
    setDeviceId(devId);
    loadSessions(devId);
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

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const base64Data = base64Url.split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64Data,
        mimeType: file.type || 'application/pdf'
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
            name: 'Gravacao_Voz.webm',
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
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isTyping) return;

    let userContent = input;
    const userMessage: Message = { role: 'user', content: userContent || '[Arquivo Anexado]' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    
    // Store reference to attached file to clear it immediately from UI
    const fileToSend = attachedFile;
    setAttachedFile(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          sessionId, 
          deviceId,
          attachedFile: fileToSend 
        }),
      });
      
      if (messages.length === 1) {
        setTimeout(() => loadSessions(deviceId), 1000);
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.result }]);
    } catch (err: any) {
      alert("Erro de comunicação: " + err.message);
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
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100vh-80px)] bg-black text-zinc-100 flex overflow-hidden relative font-sans">
      
      {/* Sidebar Overlay Mobile */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Sidebar Premium SaaS */}
      <aside className={`absolute md:static top-0 left-0 h-full w-72 md:w-[280px] border-r border-zinc-800/50 bg-[#0a0a0a] z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between">
          <button 
            onClick={() => {
              const newSession = crypto.randomUUID();
              localStorage.setItem('mentorMusicalSession', newSession);
              setSessionId(newSession);
              setMessages([INITIAL_MESSAGE]);
              setIsMobileMenuOpen(false);
            }}
            className="flex-1 bg-white text-black hover:bg-zinc-200 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-sm font-semibold group"
          >
            <MessageSquare className="w-4 h-4 text-zinc-900 group-hover:scale-110 transition-transform" /> Nova Conversa
          </button>
          <button className="md:hidden ml-3 text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="pt-2">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-3 mb-2">Histórico Local</h3>
            <div className="space-y-[2px]">
              {sessions.length === 0 && <p className="text-xs text-zinc-600 px-3 italic">Nenhuma conversa ainda.</p>}
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSessionId(session.id);
                    localStorage.setItem('mentorMusicalSession', session.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate flex items-center gap-3 group ${sessionId === session.id ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${sessionId === session.id ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                  <span className="truncate">{session.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50 text-xs text-zinc-500 flex items-center gap-3 cursor-pointer hover:bg-zinc-900 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">M</div>
          <div>
            <div className="text-zinc-200 font-medium text-sm">Meu Perfil</div>
            <div className="text-[11px] text-zinc-500">Plano Gratuito</div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area SaaS */}
      <main className="flex-1 flex flex-col h-full w-full max-w-full overflow-hidden bg-black relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl flex-shrink-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 p-2 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold text-sm text-white flex items-center gap-2">
             <Piano className="w-4 h-4 text-zinc-400" />
             Mentor AI
          </div>
          <button 
            onClick={() => {
              const newSession = crypto.randomUUID();
              localStorage.setItem('mentorMusicalSession', newSession);
              setSessionId(newSession);
              setMessages([INITIAL_MESSAGE]);
            }} 
            className="text-zinc-400 p-2 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth z-10"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 md:gap-5 w-full max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm ${msg.role === 'assistant' ? 'bg-white border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                {msg.role === 'assistant' ? <Piano className="w-4 h-4 md:w-5 md:h-5" /> : <User className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[13px] font-medium text-zinc-500">{msg.role === 'assistant' ? 'Mentor AI' : 'Você'}</span>
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed tracking-wide shadow-sm ${msg.role === 'assistant' ? 'bg-zinc-900/50 border border-zinc-800 text-zinc-200' : 'bg-white text-black font-medium'}`}>
                  {msg.content.split('\n').map((line, i) => {
                    let cleanLine = line.split('**').join('').split('$').join('');
                    if (cleanLine.trim() === '---') {
                      return <hr key={i} className={`my-4 border-${msg.role==='assistant'?'zinc-800':'zinc-200'}`} />;
                    }
                    if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
                      return <li key={i} className={`ml-4 list-disc mb-1 ${msg.role==='assistant'?'text-zinc-300':'text-zinc-800'}`}>{cleanLine.trim().substring(2).split('*').join('')}</li>;
                    }
                    if (cleanLine.trim().startsWith('#')) {
                      return <h3 key={i} className={`text-lg font-bold mt-4 mb-2 ${msg.role==='assistant'?'text-white':'text-black'}`}>{cleanLine.split('#').join('').trim().split('*').join('')}</h3>;
                    }
                    // Handle Anexo tag
                    if (cleanLine.includes('[Anexo:')) {
                      return <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm my-2 ${msg.role==='assistant'?'bg-zinc-800 text-zinc-300':'bg-zinc-100 text-zinc-600'}`}><FileText className="w-4 h-4"/> {cleanLine.replace('[Anexo: ', '').replace(']', '')}</div>
                    }
                    return <p key={i} className={`mb-2 min-h-[1rem] ${msg.role==='assistant'?'text-zinc-300':'text-zinc-800'}`}>{cleanLine.split('*').join('')}</p>;
                  })}
                  
                  {msg.role === 'assistant' && idx > 0 && (
                    <div className="mt-4 flex justify-end gap-2">
                      <button 
                        onClick={() => exportToText(msg.content)} 
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
                        title="Baixar texto"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 md:gap-5 w-full max-w-3xl mx-auto animate-in fade-in duration-300">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 flex items-center justify-center border bg-white border-zinc-200 text-black shadow-sm">
                <Piano className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[13px] font-medium text-zinc-500">Mentor AI</span>
                </div>
                <div className="px-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-1.5 h-[52px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-[bounce_1.4s_infinite_0s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-[bounce_1.4s_infinite_0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-[bounce_1.4s_infinite_0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SaaS Input Bar */}
        <div className="p-3 md:p-6 bg-gradient-to-t from-black via-black to-transparent flex-shrink-0 pb-safe pt-10 z-20">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex flex-col gap-2">
            
            {attachedFile && (
              <div className="absolute -top-12 left-4 bg-zinc-900 border border-zinc-700 rounded-xl p-2 px-3 flex items-center justify-between shadow-xl z-10 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-xs text-white font-medium">
                  {attachedFile.mimeType.includes('audio') ? <Mic className="w-4 h-4 text-zinc-400" /> : <FileText className="w-4 h-4 text-zinc-400" />}
                  <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                </div>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-zinc-500 hover:text-white ml-3 transition-colors bg-zinc-800 rounded-full p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col p-1.5 transition-all duration-300 ${isRecording ? 'border-red-500/50 ring-1 ring-red-500/20' : 'focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-700'}`}>
              
              {isRecording ? (
                 <div className="flex-1 flex items-center justify-center py-5 text-red-400 font-medium animate-pulse text-sm">
                   Gravando sua voz... Clique no ícone vermelho para parar.
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
                  placeholder="Envie uma partitura (PDF) ou pergunte algo..."
                  className="w-full bg-transparent border-none outline-none px-3 py-3 text-[15px] text-white placeholder-zinc-500 resize-none max-h-32 min-h-[52px]"
                  rows={1}
                  disabled={isTyping}
                />
              )}

              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf,image/*,audio/*" />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors tooltip-wrapper" title="Anexar PDF, Imagem ou Áudio">
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <button type="button" onClick={toggleRecording} className={`p-2 transition-colors rounded-lg ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`} title="Gravar Áudio">
                    <Mic className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isTyping || (!input.trim() && !attachedFile)}
                  className={`p-2 md:px-4 md:py-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 gap-2 font-semibold text-sm ${(!input.trim() && !attachedFile) ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200 shadow-sm'}`}
                >
                  <span className="hidden md:inline">Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
            <div className="text-center mt-1.5">
              <p className="text-[10px] md:text-xs text-zinc-600">A IA pode errar. O upload suporta arquivos PDF até 10MB para análise de partituras.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
