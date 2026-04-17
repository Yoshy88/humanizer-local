'use client';

import { useState } from 'react';
import TextInput from './TextInput';
import ResultsPanel from './ResultsPanel';
import LoadingSpinner from './LoadingSpinner';

interface DetectionResult {
  aiScore: number;
  humanScore: number;
  verdict: string;
  analysis: {
    sentenceCount: number;
    wordCount: number;
    avgSentenceLength: number;
  };
}

// Direct algorithms - no API needed
function analyzeTextForAI(text: string): number {
  let score = 0;

  // BASE SCORE: Start low, only add for STRONG AI indicators
  
  // 1. Detect overly formal/academic language (minor weight)
  const formalWords = ['thus', 'furthermore', 'moreover', 'nonetheless', 'consequently', 'pursuant', 'herein', 'thereof'];
  const formalCount = (text.toLowerCase().match(new RegExp(`\\b(${formalWords.join('|')})\\b`, 'g')) || []).length;
  score += formalCount * 0.5;

  // 2. Detect repetitive sentence starts
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) return 15; // Too short, can't judge
  
  const sentenceStarts = sentences.map(s => s.trim().split(/\s+/)[0].toLowerCase());
  const uniqueStarts = new Set(sentenceStarts).size;
  const repetitionRatio = uniqueStarts / sentenceStarts.length;
  if (repetitionRatio < 0.4) {
    // Very repetitive sentence starts = strong AI signal
    score += 15;
  }

  // 3. Detect perfect grammar (no contractions, no typos)
  const hasContractions = (/n't|'m|'re|'ve|'ll|'d|'s/gi).test(text);
  const hasColloquialisms = (/\blike\b|kinda|sorta|gonna|wanna|gotta|y'all|dunno|coulda|woulda|shoulda/gi).test(text);
  
  if (!hasContractions && !hasColloquialisms && text.length > 150) {
    score += 8;
  }

  // 4. Detect perfectly uniform sentence length (AI signature)
  const wordCounts = sentences.map(s => s.split(/\s+/).length);
  const avgLength = wordCounts.reduce((a, b) => a + b, 0) / Math.max(1, wordCounts.length);
  const lengthVariance = wordCounts.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / wordCounts.length;
  
  // Only flag if VERY uniform
  if (lengthVariance < 8 && sentences.length > 4) {
    score += 12;
  }

  // 5. Detect overuse of transition words
  const transitions = ['in conclusion', 'to summarize', 'in addition', 'on the other hand', 'for example', 'furthermore', 'however', 'moreover', 'therefore'];
  const transitionCount = (text.toLowerCase().match(new RegExp(`\\b(${transitions.join('|')})\\b`, 'g')) || []).length;
  const transitionDensity = transitionCount / sentences.length;
  if (transitionDensity > 0.3) {
    // Too many transitions = textbook AI writing
    score += 10;
  }

  // 6. Detect cliché AI phrases (strong indicator)
  const cliches = ['in today\'s world', 'it is important to note', 'it should be noted', 'needless to say', 'as mentioned', 'in this context'];
  const clicheCount = cliches.filter(cliche => text.toLowerCase().includes(cliche.toLowerCase())).length;
  score += clicheCount * 5;

  // 7. Detect overly generic statements
  const vaguePhrases = ['people say', 'many believe', 'it is widely known', 'most would agree', 'one could argue', 'it may be noted'];
  const vagueCount = (text.toLowerCase().match(new RegExp(`\\b(${vaguePhrases.join('|')})\\b`, 'gi')) || []).length;
  score += vagueCount * 3;

  // 8. STRONG: Detect "As an AI" statements
  if (text.includes('As an AI') || text.includes('I appreciate you asking') || text.includes('I\'m an AI')) {
    return 95; // Definitely AI
  }

  // ========== HUMAN WRITING BONUSES (reduce score) ==========
  
  // Contractions = strong human signal
  if (hasContractions) score -= 8;
  
  // Colloquialisms = very human
  if (hasColloquialisms) score -= 10;
  
  // Good variety in sentence starts
  if (repetitionRatio > 0.7) score -= 8;
  
  // Varied sentence length
  if (lengthVariance > 25) score -= 8;
  
  // Personal touches everywhere
  const personalCount = (text.match(/I think|I feel|I've|I'm|we're|honestly|frankly|actually|you know|I mean|that said|to be fair|kinda|sorta|pretty|super|really|like/gi) || []).length;
  score -= Math.min(15, personalCount * 0.8);
  
  // Emotional language
  if (/\bfeel\b|\blove\b|\bhate\b|\bamazing\b|\bawesome\b|\bawful\b|\bcrazy\b|\binsane\b/gi.test(text)) {
    score -= 6;
  }

  // Questions in text (human-like)
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 0) score -= 4;
  
  // Exclamation marks (human-like)
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 0) score -= 4;

  // Ellipsis (human hesitation)
  if (/\.{2,}/.test(text)) score -= 5;

  // Dashes (natural pauses)
  const dashCount = (text.match(/--|-(?!\w)/g) || []).length;
  if (dashCount > 2) score -= 4;

  // FINAL: Cap between 0-100 and ensure it's reasonable
  let finalScore = Math.min(100, Math.max(0, Math.round(score)));
  
  // If text is very short, lower confidence
  if (text.length < 100) {
    finalScore = Math.round(finalScore * 0.5);
  }
  
  return finalScore;
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

  // 1. Replace AI-cliché phrases with natural academic alternatives
  const clicheReplacements: Record<string, string[]> = {
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

  Object.entries(clicheReplacements).forEach(([cliche, alternatives]) => {
    const escaped = cliche.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() > replacementRate) return match;
      const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
      return preserveCase(replacement, match);
    });
  });

  // 2. Use minimal, non-personal contractions
  const forceContractions: Record<string, string> = {
    'it is': "it's",
    'that is': "that's",
    'there is': "there's",
    'will not': "won't",
    'cannot': "can't",
    'does not': "doesn't",
    'is not': "isn't",
    'are not': "aren't",
  };

  Object.entries(forceContractions).forEach(([formal, contracted]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    result = result.replace(regex, (match) =>
      Math.random() <= contractionRate ? preserveCase(contracted, match) : match
    );
  });

  // 3. Preserve sentence structure and remove immediate repetition only
  result = result.replace(/\b(\w+)\s+\1\b/gi, '$1');
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [humanized, setHumanized] = useState('');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHumanize = () => {
    if (!input.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const humanizedText = humanizeText(input, 'aggressive');
      setHumanized(humanizedText);
      setInput(humanizedText);
      
      // Analyze the humanized text
      setTimeout(() => {
        const sentences = humanizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const wordCount = humanizedText.split(/\s+/).length;
        const avgSentenceLength = wordCount / Math.max(1, sentences.length);
        const aiScore = analyzeTextForAI(humanizedText);

        setDetection({
          aiScore,
          humanScore: 100 - aiScore,
          verdict: aiScore > 60 ? 'Likely AI-generated' : 'Likely Human-written',
          analysis: {
            sentenceCount: sentences.length,
            wordCount,
            avgSentenceLength,
          },
        });
        setLoading(false);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Humanization failed');
      setLoading(false);
    }
  };

  const wordCount = input.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500"></div>
            <h1 className="text-2xl font-bold">AI Humanizer</h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Transform AI-generated text into natural human writing
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Panel - Input */}
          <div className="space-y-4">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Your Text</h2>
              <TextInput
                value={input}
                onChange={setInput}
                placeholder="Paste AI-generated text here..."
                maxWords={5000}
              />
              <div className="mt-2 flex justify-between text-sm text-slate-400">
                <span>{wordCount} / 5000 words</span>
                {wordCount > 5000 && (
                  <span className="text-red-400">Exceeds limit</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleHumanize}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <LoadingSpinner /> : '✨'}
                Humanize
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-700 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg bg-green-900/30 border border-green-700 p-3 text-sm text-green-300">
              ✅ Humanization works locally - no API key needed!
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-4">
            {detection && <ResultsPanel detection={detection} />}
            {humanized && (
              <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-6">
                <h3 className="mb-4 text-lg font-semibold">Humanized Text</h3>
                <p className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                  {humanized}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(humanized);
                  }}
                  className="mt-4 w-full rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-500 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            )}
            {!detection && !humanized && (
              <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-12 text-center">
                <p className="text-slate-400">
                  Results will appear here after detection or humanization
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
