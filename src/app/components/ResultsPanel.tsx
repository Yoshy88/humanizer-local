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

interface ResultsPanelProps {
  detection: DetectionResult;
}

export default function ResultsPanel({ detection }: ResultsPanelProps) {
  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-red-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score > 70) return 'bg-red-900/20 border-red-700';
    if (score > 40) return 'bg-yellow-900/20 border-yellow-700';
    return 'bg-green-900/20 border-green-700';
  };

  return (
    <div className="space-y-4">
      {/* Detection Score */}
      <div
        className={`rounded-lg border p-6 ${getScoreBgColor(detection.aiScore)}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-2">Detection Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(detection.aiScore)}`}>
              {detection.aiScore}%
            </p>
            <p className="mt-2 text-sm text-slate-300">{detection.verdict}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Human Score</p>
            <p className="text-3xl font-bold text-green-400">
              {detection.humanScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Sentences
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-200">
              {detection.analysis.sentenceCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Words
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-200">
              {detection.analysis.wordCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Avg Length
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-200">
              {detection.analysis.avgSentenceLength.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-6">
        <h3 className="mb-3 font-semibold">What This Means</h3>
        {detection.aiScore > 70 ? (
          <p className="text-sm text-slate-300">
            🚨 This text has strong indicators of AI generation. Consider humanizing
            it before use.
          </p>
        ) : detection.aiScore > 40 ? (
          <p className="text-sm text-slate-300">
            ⚠️ This text shows some AI characteristics. Humanizing it would be
            beneficial.
          </p>
        ) : (
          <p className="text-sm text-slate-300">
            ✅ This text appears naturally human-written and should pass most AI
            detectors.
          </p>
        )}
      </div>
    </div>
  );
}
