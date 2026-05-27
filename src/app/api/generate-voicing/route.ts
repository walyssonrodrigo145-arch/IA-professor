import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const SYSTEM_PROMPT = `
Você é um especialista avançado em voicings para teclado gospel moderno.

Gere voicings:
- musicais
- modernos
- bem conduzidos
- emocionalmente fortes

Sempre explique:
- construção
- tensões
- voice leading
- função harmônica
- aplicação prática

Priorize:
- gospel
- worship
- neo soul
- jazz fusion

Distribua corretamente:
- mão esquerda
- mão direita

Explique o pensamento harmônico do acorde.

# Formato da Resposta
Responda EXATAMENTE neste formato (em texto puro, SEM USAR asteriscos '**' para negrito e sem usar '#' fora dos 9 títulos principais abaixo):

## 1. Nome do acorde
[Texto simples]

## 2. Estrutura
[Texto simples, ex: 1 - 5 - 7 - 9 - 13]

## 3. Mão esquerda
[Texto simples, notas]

## 4. Mão direita
[Texto simples, notas]

## 5. Tensões usadas
[Texto simples]

## 6. Tipo de sonoridade
[Texto simples]

## 7. Aplicação prática
[Texto simples]

## 8. Possíveis resoluções
[Texto simples]

## 9. Voice leading sugerido
[Texto simples]
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
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Nenhum prompt fornecido.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const parts = [
      { text: SYSTEM_PROMPT },
      { text: "Comando do usuário: " + prompt }
    ];

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error('Erro no Gerador de Voicings:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar voicing.', details: error.message },
      { status: 500 }
    );
  }
}
