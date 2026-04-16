import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

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

    // Simple AI detection using heuristics and sentence analysis
    // For production, integrate with GPTZero, Turnitin, or similar API
    const aiScore = analyzeTextForAI(text);

    return NextResponse.json({
      original: text,
      aiScore: aiScore,
      humanScore: 100 - aiScore,
      verdict: aiScore > 60 ? 'Likely AI-generated' : 'Likely Human-written',
      analysis: {
        sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        wordCount: text.split(/\s+/).length,
        avgSentenceLength: text.split(/[.!?]+/).filter(s => s.trim().length > 0).reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(1, text.split(/[.!?]+/).filter(s => s.trim().length > 0).length),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeTextForAI(text: string): number {
  let score = 0;

  // 1. Check for overly formal language patterns
  const formalWords = ['thus', 'furthermore', 'moreover', 'nonetheless', 'consequently', 'pursuant', 'herein', 'thereof'];
  const formalCount = (text.toLowerCase().match(new RegExp(`\\b(${formalWords.join('|')})\\b`, 'g')) || []).length;
  score += formalCount * 3;

  // 2. Check for repetitive patterns
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceStarts = sentences.map(s => s.trim().split(/\s+/)[0].toLowerCase());
  const repetition = sentenceStarts.length - new Set(sentenceStarts).size;
  score += repetition * 2;

  // 3. Check for perfect punctuation and grammar
  const perfectGrammarScore = checkGrammarScore(text);
  score += perfectGrammarScore * 2;

  // 4. Check for unnaturally perfect structure
  const avgWords = text.split(/\s+/).length / Math.max(1, sentences.length);
  if (avgWords > 25 && avgWords < 35) {
    score += 5;
  }

  // 5. Check for excessive use of transition words
  const transitions = ['in conclusion', 'to summarize', 'in addition', 'on the other hand', 'for example'];
  const transitionCount = (text.toLowerCase().match(new RegExp(`\\b(${transitions.join('|')})\\b`, 'g')) || []).length;
  score += transitionCount * 2;

  // 6. Check for specific AI patterns
  if (text.includes('As an AI') || text.includes('I appreciate you asking')) {
    score += 30;
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, Math.round(score + 20 + Math.random() * 10)));
}

function checkGrammarScore(text: string): number {
  let score = 0;
  
  // No contractions (AI tends to avoid these)
  if (!text.includes("'")) {
    score += 5;
  }

  // Check for very long sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 30).length;
  score += longSentences * 2;

  return score;
}
