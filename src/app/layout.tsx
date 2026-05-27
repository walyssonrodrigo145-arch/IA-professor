import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import { Piano, Music } from 'lucide-react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gospel Keys AI",
  description: "IA Masterclass & Voicings Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
        <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Piano className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight">Gospel Keys <span className="text-purple-400">AI</span></h1>
                <p className="text-xs text-zinc-400 font-medium tracking-wider uppercase">Masterclass & Voicings</p>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                 Análise de Partituras
              </Link>
              <Link href="/voicings" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                 Gerador de Voicings
              </Link>
              <Link href="/chat" className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                <Music className="w-4 h-4" /> Mentor Musical
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
