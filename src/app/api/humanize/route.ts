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

  // Step 1: Aggressive word replacement
  const replacements: Record<string, string[]> = {
    'artificial intelligence': ['AI', 'machine intelligence'],
    'has revolutionized': ['completely changed', 'transformed', 'shaken up'],
    'numerous': ['many', 'tons of', 'a lot of'],
    'industries': ['sectors', 'fields', 'spaces'],
    'providing': ['offering', 'giving'],
    'sophisticated': ['complex', 'advanced', 'smart'],
    'solutions': ['answers', 'fixes', 'approaches'],
    'complex problems': ['hard challenges', 'tricky issues'],
    'algorithms': ['processes', 'systems', 'methods'],
    'enable': ['let', 'allow', 'help'],
    'systems': ['computers', 'tech', 'tools'],
    'learn patterns': ['pick up on patterns', 'figure out patterns'],
    'from data': ['by looking at data', 'through data'],
    'without explicit programming': ['without being programmed step-by-step', 'without coding each rule'],
    'facilitating': ['making possible', 'allowing for'],
    'autonomous decision-making': ['making decisions on their own', 'deciding things themselves'],
    'natural language processing': ['language understanding', 'understanding what people say'],
    'allows computers': ['lets computers', 'makes it possible for computers'],
    'increasingly': ['more and more', 'increasingly'],
    'integration': ['adding', 'putting'],
    'demonstrated': ['shown', 'proven'],
    'substantial': ['real', 'major', 'big'],
    'improvements': ['gains', 'boosts'],
    'efficiency': ['how fast things work', 'speed'],
    'productivity': ['output', 'how much gets done'],
    'across various sectors': ['in many fields', 'all over the place'],
  };

  // Apply replacements - choose random alternatives for variety
  Object.entries(replacements).forEach(([formal, alternatives]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    if (result.match(regex)) {
      const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
      result = result.replace(regex, alt);
    }
  });

  // Step 2: Aggressive contractions and casual speech
  const contractions: Record<string, string> = {
    'will not': "won't",
    'cannot': "can't",
    'can not': "can't",
    'is not': "isn't",
    'are not': "aren't",
    'do not': "don't",
    'does not': "doesn't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
    'would not': "wouldn't",
    'could not': "couldn't",
    'should not': "shouldn't",
    "I am": "I'm",
    "you are": "you're",
    "he is": "he's",
    "she is": "she's",
    "it is": "it's",
    "we are": "we're",
    "they are": "they're",
    "I have": "I've",
    "you have": "you've",
    "we have": "we've",
    "they have": "they've",
    "I would": "I'd",
    "you would": "you'd",
    "he would": "he'd",
    "she would": "she'd",
  };

  Object.entries(contractions).forEach(([expanded, contraction]) => {
    const regex = new RegExp(`\\b${expanded}\\b`, 'gi');
    result = result.replace(regex, contraction);
  });

  // Step 3: Restructure sentences completely
  result = restructureSentences(result, intensity);

  // Step 4: Add casual connectors and fillers
  if (intensity === 'aggressive' || intensity === 'medium') {
    result = addCasualConnectors(result);
  }

  // Step 5: Break up very long sentences
  result = breakUpSentences(result);

  // Step 6: Remove repetitive patterns
  result = removeRepetition(result);

  return result.trim();
}

function restructureSentences(text: string, intensity: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const casualOpeners = [
    'Look,',
    'Honestly,',
    'To be fair,',
    "Here's the thing:",
    'Basically,',
    'The point is,',
    'Think about it -',
  ];

  return sentences.map((sentence, idx) => {
    let modified = sentence.trim();
    
    // Add casual opener to first sentence
    if (idx === 0 && intensity === 'aggressive' && Math.random() > 0.3) {
      const opener = casualOpeners[Math.floor(Math.random() * casualOpeners.length)];
      modified = opener + ' ' + modified.charAt(0).toLowerCase() + modified.slice(1);
    }

    // Rearrange if too formal
    if (modified.match(/^the|^a[^a-z]/i)) {
      const words = modified.split(/\s+/);
      // Move some words to end for conversational flow
      if (words.length > 8 && Math.random() > 0.5) {
        const rearranged = [...words.slice(3), ...words.slice(0, 3)].join(' ');
        modified = rearranged;
      }
    }

    return modified;
  }).join(' ');
}

function addCasualConnectors(text: string): string {
  const connectors: Record<string, string[]> = {
    'and': ['and', 'plus', '—', ', plus'],
    'but': ['but', 'though', 'however', 'yet'],
    'because': ['because', "since", 'as'],
    'therefore': ['so', 'which means', 'that\'s why'],
  };

  Object.entries(connectors).forEach(([formal, alternatives]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    if (text.match(regex)) {
      const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
      text = text.replace(regex, alt);
    }
  });

  return text;
}

function breakUpSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  return sentences.map(sentence => {
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/);

    // Break very long sentences
    if (words.length > 22) {
      // Find best breaking point
      let breakIdx = Math.floor(words.length / 2);
      
      // Look for natural break points
      for (let i = breakIdx - 4; i < breakIdx + 4; i++) {
        if (i > 0 && i < words.length) {
          const word = words[i];
          if (word.match(/^(and|but|or|because|which|that|so|plus),?$/i)) {
            breakIdx = i + 1;
            break;
          }
        }
      }

      const part1 = words.slice(0, breakIdx).join(' ').replace(/,\s*$/, '');
      const part2 = words.slice(breakIdx).join(' ').trim();

      if (part1.length > 10 && part2.length > 10) {
        return part1 + '. ' + part2;
      }
    }

    return trimmed;
  }).join(' ');
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
