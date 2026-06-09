"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { 
  Send, Activity, User, Piano, Download, X, FileText, Mic, ArrowLeft, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ReferenceChatContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: "Carregando a referência..."
  };

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let devId = localStorage.getItem('deviceId');
    if (!devId) {
      devId = crypto.randomUUID();
      localStorage.setItem('deviceId', devId);
    }
    setDeviceId(devId);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    
    fetch(`/api/chat/history?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{
            role: 'assistant',
            content: "Referência pronta para estudo! Pode me perguntar qualquer coisa sobre ela."
          }]);
        }
      })
      .catch(e => console.error("Erro ao carregar historico", e));
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
    e.target.value = '';
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
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
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
      console.error('Erro microfone:', err);
      alert('Permissão de microfone negada.');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isTyping || !sessionId) return;

    let userContent = input;
    const userMessage: Message = { role: 'user', content: userContent || '[Áudio Anexado]' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    
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
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

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
    a.download = 'Analise_Referencia.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100vh-80px)] bg-white text-zinc-900 flex flex-col overflow-hidden relative font-sans">
      
      {/* Header Referência */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white/90 backdrop-blur-xl flex-shrink-0 z-20">
        <Link href="/references" className="text-zinc-500 hover:text-black flex items-center gap-2 font-medium transition-colors bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-100">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">Acervo</span>
        </Link>
        <div className="font-bold text-lg text-black flex items-center gap-2">
           <BookOpen className="w-5 h-5 text-zinc-600" />
           Estudo de Referência
        </div>
        <div className="w-[100px]"></div> {/* spacer for centering */}
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-white relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth z-10"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 md:gap-5 w-full max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm ${msg.role === 'assistant' ? 'bg-black border-black text-white' : 'bg-white border-zinc-300 text-black'}`}>
                {msg.role === 'assistant' ? <Piano className="w-4 h-4 md:w-5 md:h-5" /> : <User className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[13px] font-medium text-zinc-500">{msg.role === 'assistant' ? 'Mentor AI' : 'Você'}</span>
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed tracking-wide shadow-sm ${msg.role === 'assistant' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-black text-white font-medium'}`}>
                  {msg.content.split('\n').map((line, i) => {
                    let cleanLine = line.split('**').join('').split('$').join('');
                    if (cleanLine.trim() === '---') {
                      return <hr key={i} className={`my-4 border-${msg.role==='assistant'?'zinc-200':'zinc-700'}`} />;
                    }
                    if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
                      return <li key={i} className={`ml-4 list-disc mb-1 ${msg.role==='assistant'?'text-zinc-700':'text-zinc-300'}`}>{cleanLine.trim().substring(2).split('*').join('')}</li>;
                    }
                    if (cleanLine.trim().startsWith('#')) {
                      return <h3 key={i} className={`text-lg font-bold mt-4 mb-2 ${msg.role==='assistant'?'text-black':'text-white'}`}>{cleanLine.split('#').join('').trim().split('*').join('')}</h3>;
                    }
                    if (cleanLine.includes('[Anexo:')) {
                      return <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm my-2 ${msg.role==='assistant'?'bg-zinc-200 text-zinc-700':'bg-zinc-800 text-zinc-300'}`}><FileText className="w-4 h-4"/> {cleanLine.replace('[Anexo: ', '').replace(']', '')}</div>
                    }
                    return <p key={i} className={`mb-2 min-h-[1rem] ${msg.role==='assistant'?'text-zinc-700':'text-white'}`}>{cleanLine.split('*').join('')}</p>;
                  })}
                  
                  {msg.role === 'assistant' && idx > 0 && (
                    <div className="mt-4 flex justify-end gap-2">
                      <button 
                        onClick={() => exportToText(msg.content)} 
                        className="text-zinc-400 hover:text-black transition-colors p-1.5 rounded-md hover:bg-zinc-200"
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
            <div className="flex gap-4 md:gap-5 w-full max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 flex items-center justify-center border bg-black border-black text-white shadow-sm">
                <Piano className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[13px] font-medium text-zinc-500">Mentor AI</span>
                </div>
                <div className="px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 h-[52px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1.4s_infinite_0s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1.4s_infinite_0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-[bounce_1.4s_infinite_0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-6 bg-gradient-to-t from-white via-white to-transparent flex-shrink-0 pb-safe pt-10 z-20">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex flex-col gap-2">
            
            {attachedFile && (
              <div className="absolute -top-12 left-4 bg-white border border-zinc-200 rounded-xl p-2 px-3 flex items-center justify-between shadow-xl z-10 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-xs text-black font-medium">
                  {attachedFile.mimeType.includes('audio') ? <Mic className="w-4 h-4 text-zinc-600" /> : <FileText className="w-4 h-4 text-zinc-600" />}
                  <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                </div>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-zinc-500 hover:text-black ml-3 transition-colors bg-zinc-100 rounded-full p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`relative bg-white border border-zinc-300 rounded-2xl flex flex-col p-1.5 transition-all duration-300 ${isRecording ? 'border-red-500/50 ring-1 ring-red-500/20' : 'focus-within:border-black focus-within:ring-1 focus-within:ring-black'}`}>
              
              {isRecording ? (
                 <div className="flex-1 flex items-center justify-center py-5 text-red-500 font-medium animate-pulse text-sm">
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
                  placeholder="Pergunte algo sobre essa partitura..."
                  className="w-full bg-transparent border-none outline-none px-3 py-3 text-[15px] text-black placeholder-zinc-400 resize-none max-h-32 min-h-[52px]"
                  rows={1}
                  disabled={isTyping}
                />
              )}

              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
                  
                  <button type="button" onClick={toggleRecording} className={`p-2 transition-colors rounded-lg ${isRecording ? 'text-red-600 bg-red-600/10' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'}`} title="Gravar Áudio (Ex: Perguntar tocando teclado)">
                    <Mic className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isTyping || (!input.trim() && !attachedFile)}
                  className={`p-2 md:px-6 md:py-2 rounded-xl transition-all flex items-center justify-center flex-shrink-0 gap-2 font-semibold text-sm ${(!input.trim() && !attachedFile) ? 'bg-zinc-100 text-zinc-400' : 'bg-black text-white hover:bg-zinc-800 shadow-sm shadow-black/10'}`}
                >
                  <span className="hidden md:inline">Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ReferenceChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <ReferenceChatContent />
    </Suspense>
  );
}
