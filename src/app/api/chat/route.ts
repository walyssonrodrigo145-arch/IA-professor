import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

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
    const { messages, sessionId, attachedFile, deviceId } = body; 

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Formato de mensagens inválido.' }, { status: 400 });
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is obrigatório.' }, { status: 400 });
    }

    // Save user message to DB
    const userMessage = messages[messages.length - 1];
    let dbContent = userMessage.content;
    if (attachedFile) {
      dbContent = dbContent ? `${dbContent}\n\n[Anexo: ${attachedFile.name}]` : `[Anexo: ${attachedFile.name}]`;
    }

    await prisma.mentorMessage.create({
      data: {
        role: 'user',
        content: dbContent,
        session: {
          connectOrCreate: {
            where: { id: sessionId },
            create: { id: sessionId, deviceId: deviceId || 'unknown' },
          }
        }
      }
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // Map messages to Gemini's format
    const geminiHistory = messages.map((msg: any, index: number) => {
      const parts: any[] = [{ text: msg.content || '' }];
      
      if (index === messages.length - 1 && attachedFile) {
         parts.push({
           inlineData: {
             data: attachedFile.data,
             mimeType: attachedFile.mimeType
           }
         });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });

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
    
    // Send the latest message (array of parts to support multimodal)
    const result = await chat.sendMessage(latestMessage.parts);
    const responseText = result.response.text();

    // Save assistant message to DB
    await prisma.mentorMessage.create({
      data: {
        role: 'assistant',
        content: responseText,
        sessionId: sessionId,
      }
    });

    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error('Erro no Chat:', error);
    return NextResponse.json(
      { error: 'Erro ao conversar com a IA.', details: error.message },
      { status: 500 }
    );
  }
}
