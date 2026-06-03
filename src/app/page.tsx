"use client";

import React, { useState, useRef } from 'react';
import { 
  Upload, Music, FileAudio, FileText, PlayCircle, Piano, Layers,
  Activity, MessageSquare, BookOpen, Sparkles, ChevronRight, ListVideo
} from 'lucide-react';

export default function Home() {
  const [isHovering, setIsHovering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisSections, setAnalysisSections] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = ['.mid', '.midi', '.pdf'];
    const lowerName = file.name.toLowerCase();
    
    if (!validExtensions.some(ext => lowerName.endsWith(ext))) {
      alert("Por favor envie um arquivo MIDI (.mid) ou uma Partitura (.pdf)");
      return;
    }

    setFileName(file.name);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Parse the markdown string into sections
      const text = data.result as string;
      const parsedSections = parseMarkdownToSections(text);
      setAnalysisSections(parsedSections);
      setShowResults(true);

    } catch (err: any) {
      alert("Erro ao analisar: " + err.message);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Helper to parse the prompt's strict 9-section markdown
  const parseMarkdownToSections = (markdown: string) => {
    const sectionsRaw = markdown.split(/##\s+/).filter(Boolean);
    const sections = sectionsRaw.map(section => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    });
    return sections;
  };

  const getIconForSection = (index: number) => {
    const icons = [
      <PlayCircle className="w-5 h-5 text-zinc-300" />,
      <Layers className="w-5 h-5 text-zinc-300" />,
      <Piano className="w-5 h-5 text-zinc-300" />,
      <Music className="w-5 h-5 text-zinc-300" />,
      <Activity className="w-5 h-5 text-zinc-300" />,
      <Sparkles className="w-5 h-5 text-zinc-300" />,
      <MessageSquare className="w-5 h-5 text-zinc-300" />,
      <ListVideo className="w-5 h-5 text-zinc-300" />,
      <BookOpen className="w-5 h-5 text-zinc-300" />
    ];
    return icons[index] || <Layers className="w-5 h-5 text-zinc-300" />;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/30 selection:text-black">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".mid,.midi,.pdf" 
        className="hidden" 
      />


      <main className="max-w-5xl mx-auto px-6 py-12">
        {!showResults && (
          <div className="text-center max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Análise Harmônica Profunda
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Faça upload de seu arquivo MIDI ou Partitura (PDF). Nossa IA especialista vai destrinchar cada detalhe da harmonia, voicings e linguagem.
            </p>
          </div>
        )}

        {!showResults && (
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={() => setIsHovering(false)}
            className={`
              relative group overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out flex flex-col items-center justify-center p-16
              ${isHovering ? 'border-white bg-white/5 scale-[1.02]' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900'}
              ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-md rotate-[-6deg] group-hover:rotate-0 transition-all duration-300">
                  <FileText className="text-zinc-400 w-7 h-7" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg z-10 group-hover:-translate-y-2 transition-all duration-300 border border-zinc-200">
                  <Music className="text-black w-8 h-8" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 text-white">
                {isHovering ? 'Solte para analisar!' : 'Arraste seu PDF ou MIDI aqui'}
              </h3>
              <p className="text-zinc-400 mb-8 max-w-sm text-center">
                Suporta arquivos .mid, .midi e partituras em .pdf
              </p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="relative overflow-hidden rounded-full bg-white text-black px-8 py-3 font-semibold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 group/btn shadow-sm shadow-white/10"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    Lendo a Partitura com Gemini...
                  </>
                ) : (
                  <>
                    Procurar no Computador
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-md">Análise Concluída</span>
                  <span className="text-zinc-500 text-sm">{fileName}</span>
                </div>
                <h2 className="text-3xl font-bold text-white">Resultado da Masterclass</h2>
              </div>
              <button 
                onClick={() => setShowResults(false)}
                className="text-sm font-medium text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" /> Novo Upload
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="hidden md:block col-span-3">
                <div className="sticky top-28 flex flex-col gap-3 border-l-2 border-zinc-800/80 pl-6">
                  {analysisSections.map((item, i) => (
                    <a 
                      key={item.title} 
                      href={`#section-${i}`} 
                      className="text-[15px] py-2 px-3 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-zinc-900 hover:pl-4 font-medium"
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>

              <div className="col-span-1 md:col-span-9 space-y-6">
                {analysisSections.map((section, i) => (
                  <SectionCard 
                    key={section.title}
                    id={`section-${i}`}
                    icon={getIconForSection(i)}
                    title={section.title}
                    content={section.content}
                    highlight={i === analysisSections.length - 1} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionCard({ id, icon, title, content, highlight = false }: { id: string, icon: React.ReactNode, title: string, content: string, highlight?: boolean }) {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Remove asteriscos que a IA pode gerar acidentalmente
      let cleanLine = line.replace(/\*\*/g, ''); 
      if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
        return <li key={idx} className="ml-5 list-disc mb-2 text-zinc-300">{cleanLine.substring(2)}</li>;
      }
      return <p key={idx} className="mb-4 text-zinc-300 leading-relaxed">{cleanLine}</p>;
    });
  };

  return (
    <div id={id} className={`p-6 rounded-2xl border ${highlight ? 'bg-zinc-900 border-zinc-600 shadow-lg shadow-white/5' : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 transition-colors'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      </div>
      <div className="text-zinc-400 leading-relaxed text-[15px]">
        {formatContent(content)}
      </div>
    </div>
  );
}
