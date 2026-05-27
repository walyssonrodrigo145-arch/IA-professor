"use client";

import React, { useState } from 'react';
import { 
  Piano, Music, Sparkles, Send, Activity, 
  Layers, Key, Hash, LayoutList, Fingerprint, 
  Ear, Lightbulb, ArrowRightLeft, Spline
} from 'lucide-react';

export default function VoicingsPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const suggestions = [
    "Gere um voicing gospel para Cmaj9",
    "Crie um voicing neo soul para Dm11",
    "Voicings para II-V-I em Fá Maior",
    "Acorde denso e emocional no estilo Cory Henry",
    "Voicing Worship moderno com Pads para A(add9)"
  ];

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    generateVoicing(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      generateVoicing(prompt);
    }
  };

  const generateVoicing = async (text: string) => {
    setIsGenerating(true);
    setResults([]);

    try {
      const res = await fetch('/api/generate-voicing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      const parsedSections = parseMarkdownToSections(data.result as string);
      setResults(parsedSections);

    } catch (err: any) {
      alert("Erro ao gerar voicing: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseMarkdownToSections = (markdown: string) => {
    const sectionsRaw = markdown.split(/##\s+/).filter(Boolean);
    return sectionsRaw.map(section => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    });
  };

  const getIconForSection = (index: number) => {
    const icons = [
      <Key className="w-5 h-5 text-blue-400" />,          // 1. Nome do acorde
      <Hash className="w-5 h-5 text-purple-400" />,       // 2. Estrutura
      <Fingerprint className="w-5 h-5 text-emerald-400" />,// 3. Mão esquerda
      <Fingerprint className="w-5 h-5 text-indigo-400" />, // 4. Mão direita
      <Layers className="w-5 h-5 text-pink-400" />,        // 5. Tensões usadas
      <Ear className="w-5 h-5 text-cyan-400" />,           // 6. Tipo de sonoridade
      <Lightbulb className="w-5 h-5 text-amber-400" />,    // 7. Aplicação prática
      <ArrowRightLeft className="w-5 h-5 text-orange-400" />,// 8. Possíveis resoluções
      <Spline className="w-5 h-5 text-rose-400" />         // 9. Voice leading sugerido
    ];
    return icons[index] || <LayoutList className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" /> Inteligência Harmônica
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Gerador de Voicings
        </h2>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Peça qualquer acorde, progressão ou estilo. A IA montará a estrutura perfeita separando mão esquerda e direita.
        </p>
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto mb-12">
        <form onSubmit={handleSubmit} className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl transition-all duration-300 opacity-50" />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center p-2 shadow-2xl focus-within:border-purple-500/50 transition-colors">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Crie um voicing neo soul para Dm11"
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg text-white placeholder-zinc-500"
              disabled={isGenerating}
            />
            <button 
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
            >
              {isGenerating ? <Activity className="w-6 h-6 animate-pulse" /> : <Send className="w-6 h-6" />}
            </button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((sug, i) => (
            <button 
              key={i}
              onClick={() => handleSuggestion(sug)}
              disabled={isGenerating}
              className="text-sm bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50 rounded-full px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Music className="w-3 h-3 text-purple-400" /> {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      {results.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-800">
            <Piano className="w-8 h-8 text-purple-400" />
            <h3 className="text-2xl font-bold">Estrutura do Acorde</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((section, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors ${i >= 2 && i <= 3 ? 'bg-gradient-to-br from-zinc-900 to-purple-900/10 border-purple-500/20' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    {getIconForSection(i)}
                  </div>
                  <h4 className="text-lg font-bold text-white">{section.title}</h4>
                </div>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  {section.content.split('\n').map((line: string, idx: number) => {
                    let cleanLine = line.replace(/\*\*/g, '');
                    if (cleanLine.trim().startsWith('- ') || cleanLine.trim().startsWith('* ')) {
                      return <li key={idx} className="ml-4 list-disc mb-1">{cleanLine.substring(2)}</li>;
                    }
                    return <p key={idx} className="mb-2">{cleanLine}</p>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
