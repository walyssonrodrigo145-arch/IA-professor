import React from 'react';

interface PianoKeyboardProps {
  activeNotes: string[]; // e.g. ['C3', 'E3', 'G3', 'B3']
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function PianoKeyboard({ activeNotes }: PianoKeyboardProps) {
  // Config
  const startOctave = 2;
  const numOctaves = 4; // C2 to B5
  
  // Parse active notes to a simple set like "C3", "F#4", etc.
  // We handle potential formatting issues from the AI (like spaces or lowercase).
  const normalizedActive = new Set(
    activeNotes.map(n => n.trim().toUpperCase())
  );

  const keys = [];
  let whiteKeyIndex = 0;

  for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
    for (let i = 0; i < 12; i++) {
      const noteName = NOTES[i];
      const isBlack = noteName.includes('#');
      const noteId = `${noteName}${octave}`;
      const isActive = normalizedActive.has(noteId);

      if (isBlack) {
        keys.push({
          type: 'black',
          id: noteId,
          isActive,
          // Black keys are positioned between white keys
          // The previous white key was whiteKeyIndex - 1
          left: (whiteKeyIndex - 1) * 100 / (numOctaves * 7) + (100 / (numOctaves * 7)) * 0.65,
          width: (100 / (numOctaves * 7)) * 0.7,
        });
      } else {
        keys.push({
          type: 'white',
          id: noteId,
          isActive,
          left: whiteKeyIndex * 100 / (numOctaves * 7),
          width: 100 / (numOctaves * 7),
        });
        whiteKeyIndex++;
      }
    }
  }

  // Separate white and black keys so black keys are rendered on top
  const whiteKeys = keys.filter(k => k.type === 'white');
  const blackKeys = keys.filter(k => k.type === 'black');

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[600px] h-32 md:h-48 relative select-none rounded-t-md overflow-hidden border-t border-l border-r border-zinc-800 shadow-2xl">
        {whiteKeys.map(key => (
          <div
            key={key.id}
            className={`absolute top-0 bottom-0 border-r border-zinc-300 rounded-b-md transition-colors duration-300 ${
              key.isActive 
                ? 'bg-gradient-to-b from-purple-400 to-blue-500 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.3)]' 
                : 'bg-zinc-100 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1)]'
            }`}
            style={{
              left: `${key.left}%`,
              width: `${key.width}%`,
            }}
          >
            {key.isActive && (
              <div className="absolute bottom-2 w-full text-center text-[10px] md:text-xs font-bold text-white drop-shadow-md">
                {key.id}
              </div>
            )}
          </div>
        ))}
        
        {blackKeys.map(key => (
          <div
            key={key.id}
            className={`absolute top-0 h-[60%] rounded-b-md z-10 transition-colors duration-300 shadow-[2px_2px_5px_rgba(0,0,0,0.5)] ${
              key.isActive 
                ? 'bg-gradient-to-b from-purple-400 to-blue-500 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5)]' 
                : 'bg-zinc-900 border-x border-b border-zinc-950'
            }`}
            style={{
              left: `${key.left}%`,
              width: `${key.width}%`,
            }}
          >
             {key.isActive && (
              <div className="absolute bottom-2 w-full text-center text-[9px] md:text-[10px] font-bold text-white drop-shadow-md">
                {key.id}
              </div>
            )}
          </div>
        ))}
        
        {/* Top wood/plastic bar effect */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-zinc-900 z-20 shadow-md border-b border-zinc-950" />
      </div>
    </div>
  );
}
