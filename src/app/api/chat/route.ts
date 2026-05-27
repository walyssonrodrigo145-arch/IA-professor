import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const SYSTEM_PROMPT = `
Você é um professor avançado de teclado gospel moderno.

Especialista em:
- harmonia
- improvisação
- voicings
- worship
- neo soul
- jazz gospel
- fraseado
- reharmonização

Seu objetivo é:
- ensinar
- analisar
- explicar profundamente
- ajudar o usuário a evoluir musicalmente

Sempre:
- seja técnico
- seja didático
- explique tensão e resolução
- explique pensamento musical
- conecte teoria e prática
`;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da API do Gemini não configurada.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body; // Array of { role: 'user' | 'assistant', content: '...' }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Formato de mensagens inválido.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // Map messages to Gemini's format
    const geminiHistory = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires the history to start with a 'user' message.
    // The frontend sends an initial hardcoded 'assistant' greeting, so we remove it.
    let validHistory = [...geminiHistory];
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
      validHistory.shift();
    }

    const chat = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      history: validHistory.slice(0, -1), // All except the very last user message
    });

    const latestMessage = geminiHistory[geminiHistory.length - 1];
    
    // Send the latest message
    const result = await chat.sendMessage(latestMessage.parts[0].text);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error('Erro no Chat:', error);
    return NextResponse.json(
      { error: 'Erro ao conversar com a IA.', details: error.message },
      { status: 500 }
    );
  }
}
