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
  const tone = detectTone(text);
  let result = text;

  const phraseReplacements: Record<string, string[]> = tone === 'academic'
    ? {
        'in today\'s world': ['in contemporary contexts', 'today'],
        'it is important to note': ['it is worth noting', 'notably'],
        'it should be noted': ['it bears noting', 'notably'],
        'needless to say': ['as expected', 'unsurprisingly'],
        'in conclusion': ['to conclude', 'overall'],
      }
    : {
        'in today\'s world': ['today', 'currently'],
        'it is important to note': ['notably', 'it is worth noting'],
        'it should be noted': ['notably', 'worth noting'],
        'needless to say': ['as expected', 'of course'],
        'in conclusion': ['to conclude', 'overall'],
      };

  const vocabularyReplacements: Record<string, string[]> = tone === 'academic'
    ? {
        'furthermore': ['in addition', 'additionally'],
        'moreover': ['in addition', 'further'],
        'therefore': ['thus', 'as a result'],
        'however': ['nevertheless', 'still'],
        'utilize': ['use', 'employ'],
        'facilitate': ['support', 'enable'],
        'demonstrate': ['show', 'indicate'],
      }
    : {
        'furthermore': ['also', 'in addition'],
        'moreover': ['also', 'further'],
        'therefore': ['so', 'as a result'],
        'however': ['still', 'but'],
        'utilize': ['use'],
        'facilitate': ['help', 'support'],
        'demonstrate': ['show'],
      };

  result = applyPhraseReplacements(result, phraseReplacements);
  result = applyPhraseReplacements(result, vocabularyReplacements);
  result = removeCasualFillers(result);

  if (tone === 'general') {
    result = applySelectiveContractions(result, intensity);
  }

  return normalizeFormalStructure(result);
}

function detectTone(text: string): 'academic' | 'general' {
  const lower = text.toLowerCase();
  const academicMatches = (lower.match(/\b(furthermore|moreover|therefore|however|consequently|methodology|analysis|findings|study|research)\b/g) || []).length;
  const casualMatches = (lower.match(/\b(honestly|basically|you know|i mean|gonna|wanna|kinda|sorta|real talk)\b/g) || []).length;
  return academicMatches >= casualMatches + 2 ? 'academic' : 'general';
}

function applyPhraseReplacements(text: string, replacements: Record<string, string[]>): string {
  let result = text;
  const lowerResult = text.toLowerCase();
  Object.entries(replacements).forEach(([phrase, alternatives]) => {
    if (!lowerResult.includes(phrase.toLowerCase())) {
      return;
    }
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
    result = result.replace(regex, () => alternatives[Math.floor(Math.random() * alternatives.length)]);
  });
  return result;
}

function removeCasualFillers(text: string): string {
  return text
    .replace(/(^|[.!?]\s+)(look|honestly|basically|real talk|you know|i mean|frankly),\s+/gi, '$1')
    .replace(/\s,\s*(honestly|basically|you know|i mean|real talk)\b/gi, '')
    .replace(/\b(like),\s+/gi, '')
    .replace(/\s{2,}/g, ' ');
}

function applySelectiveContractions(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
  const contractionChance = intensity === 'aggressive' ? 0.5 : intensity === 'medium' ? 0.35 : 0.2;
  const contractions: Record<string, string> = {
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'cannot': "can't",
    'will not': "won't",
    'is not': "isn't",
    'are not': "aren't",
  };

  let result = text;
  Object.entries(contractions).forEach(([expanded, contracted]) => {
    const regex = new RegExp(`\\b${expanded}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() > contractionChance) {
        return match;
      }
      if (/^[A-Z]/.test(match)) {
        return contracted.charAt(0).toUpperCase() + contracted.slice(1);
      }
      return contracted;
    });
  });
  return result;
}

function normalizeFormalStructure(text: string): string {
  return text
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])([^\s])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
