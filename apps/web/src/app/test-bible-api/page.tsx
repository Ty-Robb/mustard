'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestBibleApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://api.scripture.api.bible/v1/bibles', {
        headers: {
          'api-key': '432a2038ad6408df30e3eb67f0363cad',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult({
        success: true,
        bibleCount: data.data.length,
        firstBible: data.data[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Bible API</h1>
      
      <div className="space-y-4">
        <Button onClick={testDirectApi} disabled={loading}>
          {loading ? 'Testing...' : 'Test Direct Bible API'}
        </Button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 text-green-700 rounded">
            <p>✅ API Key is valid!</p>
            <p>Found {result.bibleCount} Bibles</p>
            {result.firstBible && (
              <p>First Bible: {result.firstBible.name} ({result.firstBible.abbreviation})</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
