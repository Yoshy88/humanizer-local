import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, intensity = 'medium' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.split(/\s+/).length > 5000) {
      return NextResponse.json(
        { error: 'Text exceeds 5000 word limit' },
        { status: 400 }
      );
    }

    // Local humanization - no API needed!
    const humanized = humanizeText(text, intensity as 'light' | 'medium' | 'aggressive');

    return NextResponse.json({
      original: text,
      humanized: humanized,
      wordCount: text.split(/\s+/).length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function humanizeText(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
  let result = text;
  const preserveCase = (replacement: string, original: string) => {
    if (original === original.toUpperCase()) return replacement.toUpperCase();
    if (original[0] === original[0]?.toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  };

  const replacementRate = intensity === 'light' ? 0.35 : intensity === 'medium' ? 0.55 : 0.75;
  const contractionRate = intensity === 'light' ? 0.2 : intensity === 'medium' ? 0.35 : 0.5;

  // Step 1: Refine common AI-like phrases while preserving formal tone
  const replacements: Record<string, string[]> = {
    "in today's world": ['today', 'in contemporary contexts'],
    'it is important to note that': ['it is worth noting that'],
    'it is important to note': ['it is worth noting'],
    'it should be noted that': ['it is worth noting that'],
    'it should be noted': ['it is worth noting'],
    'needless to say': ['clearly', 'as expected'],
    'in this context': ['in this setting', 'within this context'],
    'in conclusion': ['in summary', 'to conclude'],
    'furthermore': ['in addition', 'additionally'],
    'moreover': ['further', 'in addition'],
    'therefore': ['thus', 'as a result'],
    'however': ['however', 'nevertheless'],
    'demonstrate': ['show', 'demonstrate'],
    'utilize': ['use', 'employ'],
    'facilitate': ['support', 'enable'],
    'significant': ['substantial', 'significant'],
    'numerous': ['many', 'numerous'],
  };

  Object.entries(replacements).forEach(([phrase, alternatives]) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() > replacementRate) return match;
      const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
      return preserveCase(replacement, match);
    });
  });

  // Step 2: Apply minimal, non-personal contractions
  const contractions: Record<string, string> = {
    'it is': "it's",
    'that is': "that's",
    'there is': "there's",
    'cannot': "can't",
    'will not': "won't",
    'is not': "isn't",
    'are not': "aren't",
    'does not': "doesn't",
  };

  Object.entries(contractions).forEach(([expanded, contraction]) => {
    const regex = new RegExp(`\\b${expanded}\\b`, 'gi');
    result = result.replace(regex, (match) =>
      Math.random() <= contractionRate ? preserveCase(contraction, match) : match
    );
  });

  // Step 3: Remove immediate word repetitions and normalize spacing
  result = removeRepetition(result);
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

function removeRepetition(text: string): string {
  // Remove repeated common words/patterns
  const repeated = text.match(/\b(\w+)\s+\1\b/gi);
  if (repeated) {
    repeated.forEach(rep => {
      const word = rep.split(/\s+/)[0];
      text = text.replace(new RegExp(`\\b${word}\\s+${word}\\b`, 'gi'), word);
    });
  }
  return text;
}
