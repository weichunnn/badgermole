'use client';

import { useState } from 'react';

interface IntentClassifierProps {
  mode?: 'STANDBY' | 'QUERY';
}

interface ClassificationResult {
  isAction: boolean;
  category: string;
  confidence: number;
}

export default function IntentClassifier({ mode = 'STANDBY' }: IntentClassifierProps) {
  const [sceneDescription, setSceneDescription] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifyIntent = async () => {
    if (!sceneDescription) {
      setError('Please provide a scene description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classify-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneDescription,
          userPrompt: mode === 'QUERY' ? userPrompt : null,
          mode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to classify intent');
      }

      setResult(data);
    } catch (err) {
      console.error('Classification error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Scene Description</label>
        <textarea
          className="w-full p-2 border rounded bg-background text-foreground"
          value={sceneDescription}
          onChange={(e) => setSceneDescription(e.target.value)}
          placeholder="Enter scene description..."
          rows={4}
        />
      </div>

      {mode === 'QUERY' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">User Prompt</label>
          <input
            type="text"
            className="w-full p-2 border rounded bg-background text-foreground"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter user prompt..."
          />
        </div>
      )}

      <button
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
        onClick={classifyIntent}
        disabled={loading || !sceneDescription}
      >
        {loading ? 'Classifying...' : 'Classify Intent'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-background/[.05] rounded">
          <h3 className="font-medium">Classification Result:</h3>
          <p>Is Action: {result.isAction.toString()}</p>
          <p>Category: {result.category}</p>
          <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
          <p className="mt-2">Processed Response: {result.processedText}</p>
        </div>
      )}
    </div>
  );
}