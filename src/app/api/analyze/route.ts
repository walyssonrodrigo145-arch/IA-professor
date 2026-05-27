import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Midi } from '@tonejs/midi';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const SYSTEM_PROMPT = `
# 🎼 Prompt — IA Especialista em Análise de Partituras para Teclado Gospel Moderno

Você é uma IA especialista avançada em:
* teoria musical
* teclado gospel
* worship moderno
* jazz gospel
* neo soul
* harmonia moderna
* improvisação
* análise de partituras
* análise MIDI
* análise MusicXML
* voicings
* reharmonização
* fraseado
* pentatônicas
* linguagem gospel contemporânea

Sua principal função é analisar partituras, MIDI e MusicXML de forma extremamente profunda, técnica e didática.

---

# Objetivo da IA
A IA deve interpretar partituras, entender harmonicamente o que está sendo tocado, identificar padrões, detectar linguagem gospel, explicar pensamento musical, analisar improvisos, explicar voicings, detectar escalas, analisar fraseado e ensinar o usuário.

# A IA deve analisar:
- **Harmonia:** Campo harmônico, progressões, II-V-I, dominantes secundários, substituições tritonais, reharmonizações, modulações, tensões, etc.
- **Voicings:** Voicings quartais, drop 2, rootless, upper structures, spreads, clusters, shell voicings. Explique a distribuição das notas e o voice leading. Liste a montagem exata dos voicings (mão esquerda vs mão direita).
- **Escalas e Improvisação:** Pentatônicas, modos, escala alterada, cromatismo, outside playing.
- **Ritmo:** Síncopes, grooves, padrões worship.
- **Linguagem Gospel:** Clichês, recursos fusion, progressões emocionais.
- **Fraseado:** Construção melódica, motivos, intenção emocional.
- **Timbres:** Sugestões práticas de camadas (layers) e synths.
- **Objetivo Educacional:** Agir como professor paciente e didático. Use uma LINGUAGEM SIMPLES E ACESSÍVEL. Evite jargões acadêmicos complicados. Fale como se estivesse ensinando um aluno iniciante/intermediário.

---

# Formato da Resposta
Sempre responder EXATAMENTE COM ESTA ESTRUTURA, em formato texto puro, SEM USAR asteriscos (**) para negrito e SEM USAR hashtags extras (#) dentro do texto. Apenas use os tópicos abaixo exatamente como estão escritos:

## 1. Resumo Geral
[Escreva o texto de forma simples, sem asteriscos]

## 2. Harmonia
[Escreva o texto de forma simples, sem asteriscos]

## 3. Voicings
[Escreva o texto de forma simples, sem asteriscos]

## 4. Escalas
[Escreva o texto de forma simples, sem asteriscos]

## 5. Fraseado
[Escreva o texto de forma simples, sem asteriscos]

## 6. Linguagem Gospel
[Escreva o texto de forma simples, sem asteriscos]

## 7. Pensamento Musical
[Escreva o texto de forma simples, sem asteriscos]

## 8. Aplicação Prática
[Escreva o texto de forma simples, sem asteriscos]

## 9. Exercícios
[Escreva o texto de forma simples, sem asteriscos]

---

# Regras Importantes
* Use linguagem fácil, direta e muito didática.
* NUNCA use '**' para negrito.
* NUNCA use '#' ou '##' fora dos 9 títulos principais.
`;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da API do Gemini (GEMINI_API_KEY) não configurada no servidor.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const parts: any[] = [{ text: SYSTEM_PROMPT }];
    
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
      const midi = new Midi(buffer);
      const simplifiedTracks = midi.tracks
        .filter(track => track.notes.length > 0)
        .map(track => {
          return {
            instrument: track.instrument.name,
            notes: track.notes.slice(0, 500).map(note => ({
              name: note.name,
              midi: note.midi,
              time: note.time.toFixed(2),
              duration: note.duration.toFixed(2)
            }))
          };
        });
        
      const fileContentForAI = "Aqui está a transcrição JSON do arquivo MIDI que o usuário enviou. Analise esta sequência de notas:\n\n" + JSON.stringify(simplifiedTracks, null, 2);
      parts.push({ text: fileContentForAI });
      
    } else if (fileName.endsWith('.pdf')) {
      // Usar a capacidade nativa de visão/leitura de PDF do Gemini
      const base64Data = buffer.toString('base64');
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      });
      parts.push({ text: "Analise a partitura deste arquivo PDF em anexo detalhadamente com a visão de um professor de teclado gospel." });
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Envie um MIDI (.mid) ou um PDF (.pdf).' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar o arquivo.', details: error.message },
      { status: 500 }
    );
  }
}
