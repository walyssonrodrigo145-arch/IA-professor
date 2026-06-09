"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, FileText, Music, ChevronRight, Activity, Plus } from 'lucide-react';
import Link from 'next/link';

interface Reference {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sessionId: string;
  createdAt: string;
}

export default function ReferencesPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReferences = async () => {
    try {
      setIsLoading(true);
      const devId = localStorage.getItem('deviceId') || 'unknown';
      const res = await fetch(`/api/references?deviceId=${devId}`);
      const data = await res.json();
      if (data.references) {
        setReferences(data.references);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let devId = localStorage.getItem('deviceId');
    if (!devId) {
      devId = crypto.randomUUID();
      localStorage.setItem('deviceId', devId);
    }
    fetchReferences();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo de 10MB.');
      return;
    }

    const title = prompt("Dê um título para essa referência (ex: Partitura Ivan Lins - Novo Tempo):", file.name.split('.')[0]);
    if (!title) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Url = event.target?.result as string;
        const base64Data = base64Url.split(',')[1];
        
        const devId = localStorage.getItem('deviceId') || 'unknown';

        const res = await fetch('/api/references', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            fileData: base64Data,
            deviceId: devId
          })
        });

        if (res.ok) {
          fetchReferences();
        } else {
          alert('Erro ao fazer upload da referência.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black/10 selection:text-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-zinc-700" /> Minhas Referências
            </h1>
            <p className="text-zinc-500 mt-2">
              Seu acervo permanente de partituras e áudios para estudar com a IA.
            </p>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,audio/*" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold shadow-sm shadow-black/10 disabled:opacity-70 whitespace-nowrap w-fit"
          >
            {isUploading ? <Activity className="w-5 h-5 animate-pulse" /> : <Plus className="w-5 h-5" />}
            {isUploading ? 'Adicionando...' : 'Nova Referência'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Activity className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
        ) : references.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Acervo Vazio</h2>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
              Adicione PDFs de partituras ou áudios para criar uma sessão de estudo dedicada para cada um.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-black hover:bg-zinc-800 text-white px-8 py-3 rounded-full transition-all font-semibold"
            >
              Começar Agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {references.map((ref) => (
              <Link href={`/references/${ref.id}?sessionId=${ref.sessionId}`} key={ref.id}>
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-black hover:shadow-lg hover:shadow-black/5 transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {ref.mimeType.includes('audio') ? <Music className="w-24 h-24" /> : <FileText className="w-24 h-24" />}
                  </div>
                  
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4 border border-zinc-200 z-10">
                    {ref.mimeType.includes('audio') ? <Music className="w-6 h-6 text-zinc-700" /> : <FileText className="w-6 h-6 text-zinc-700" />}
                  </div>
                  
                  <h3 className="text-lg font-bold text-black mb-2 z-10 leading-snug line-clamp-2">
                    {ref.title}
                  </h3>
                  
                  <p className="text-xs text-zinc-500 mb-6 z-10 truncate" title={ref.fileName}>
                    {ref.fileName}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between z-10">
                    <span className="text-xs font-medium text-zinc-400">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-semibold text-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Estudar <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
