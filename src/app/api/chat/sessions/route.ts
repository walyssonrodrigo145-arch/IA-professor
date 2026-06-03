import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.mentorSession.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          where: { role: 'user' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        }
      }
    });

    const formattedSessions = sessions.map(session => {
      let title = "Nova Conversa";
      if (session.messages && session.messages.length > 0) {
        const text = session.messages[0].content;
        title = text.length > 30 ? text.substring(0, 30) + "..." : text;
      }

      return {
        id: session.id,
        title,
        createdAt: session.createdAt
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Erro ao carregar sessoes", error);
    return NextResponse.json({ error: 'Erro ao carregar sessões' }, { status: 500 });
  }
}
