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
      const humanizedText = humanizeText(input, 'medium');
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
