import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import { Piano, Music } from 'lucide-react';
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#09090b',
};

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('Service Worker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Piano className="text-white w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg md:text-xl tracking-tight">Gospel Keys <span className="text-purple-400">AI</span></h1>
                <p className="hidden md:block text-xs text-zinc-400 font-medium tracking-wider uppercase">Masterclass & Voicings</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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
            <div className="md:hidden flex items-center">
               <Link href="/chat" className="text-purple-400 bg-purple-600/20 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                 Mentor
               </Link>
            </div>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
