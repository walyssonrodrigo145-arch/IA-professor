import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all references for a given deviceId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const references = await prisma.referenceFile.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        fileName: true,
        mimeType: true,
        deviceId: true,
        createdAt: true,
        sessionId: true,
        // We omit fileData here to keep the payload lightweight
      }
    });

    return NextResponse.json({ references });
  } catch (error: any) {
    console.error('Error fetching references:', error);
    return NextResponse.json({ error: 'Erro ao buscar referências' }, { status: 500 });
  }
}

// POST: Upload a new reference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, fileName, mimeType, fileData, deviceId } = body;

    if (!title || !fileName || !fileData || !deviceId) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    // 1. Create a dedicated MentorSession for this reference
    const session = await prisma.mentorSession.create({
      data: {
        deviceId: deviceId,
      }
    });

    // 2. Add an initial system/greeting message to the session
    await prisma.mentorMessage.create({
      data: {
        role: 'assistant',
        content: `Referência carregada com sucesso! \nEu analisei o arquivo **${fileName}** e ele já está na minha memória para esta conversa. O que você gostaria de explorar sobre essa partitura/áudio?`,
        sessionId: session.id,
      }
    });

    // 3. Save the reference file with the linked sessionId
    const reference = await prisma.referenceFile.create({
      data: {
        title,
        fileName,
        mimeType,
        fileData,
        deviceId,
        sessionId: session.id,
      }
    });

    return NextResponse.json({ reference });
  } catch (error: any) {
    console.error('Error creating reference:', error);
    return NextResponse.json({ error: 'Erro ao criar referência' }, { status: 500 });
  }
}
