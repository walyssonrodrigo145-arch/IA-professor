import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is obrigatório.' }, { status: 400 });
    }

    const messages = await prisma.mentorMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
      }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Erro ao buscar historico:', error);
    return NextResponse.json({ error: 'Erro ao buscar historico.' }, { status: 500 });
  }
}
