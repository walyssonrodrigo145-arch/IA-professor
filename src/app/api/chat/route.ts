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

    // Check if this session belongs to a Reference
    let fileToInject = attachedFile;
    if (!fileToInject) {
      const ref = await prisma.referenceFile.findUnique({
        where: { sessionId: sessionId }
      });
      if (ref) {
        fileToInject = {
          data: ref.fileData,
          mimeType: ref.mimeType,
          name: ref.fileName
        };
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Map messages to Gemini's format
    const geminiHistory = messages.map((msg: any, index: number) => {
      const parts: any[] = [{ text: msg.content || '' }];
      
      // Inject the file either if it was just attached, or if it belongs to the reference
      // We inject it in the last message so Gemini processes it with the current prompt
      if (index === messages.length - 1 && fileToInject) {
         parts.push({
           inlineData: {
             data: fileToInject.data,
             mimeType: fileToInject.mimeType
           }
         });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });

    let rawHistory = geminiHistory.slice(0, -1);
    
    // We must ensure the history starts with 'user' and alternates.
    let cleanedHistory: any[] = [];
    let nextExpectedRole = 'user';
    
    for (const msg of rawHistory) {
      if (msg.role === nextExpectedRole) {
        cleanedHistory.push(msg);
        nextExpectedRole = nextExpectedRole === 'user' ? 'model' : 'user';
      }
    }
    
    // If cleanedHistory ends with 'user', we need to remove it so it ends with 'model' 
    // because the very next message we send is 'user'
    if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === 'user') {
      cleanedHistory.pop();
    }

    const chat = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      history: cleanedHistory,
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
