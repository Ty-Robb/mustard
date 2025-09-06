'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';

interface SearchResult {
  reference: string;
  text: string;
  translation: string;
  score: number;
  themes?: string[];
}

export default function TestBibleSearchPublicPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [minScore, setMinScore] = useState('0.0');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bible-vectors/search?q=${encodeURIComponent(query)}&limit=10&minScore=${minScore}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/bible-vectors/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        const errorData = await response.json();
        console.error('Stats error:', errorData);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bible Vector Search Test (Public)</CardTitle>
          <CardDescription>
            Search the Bible semantically using AI-powered vector embeddings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for verses by meaning (e.g., 'love your neighbor', 'forgiveness')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm text-muted-foreground">
              Min Score: {minScore}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">
              (Lower = more results)
            </span>
          </div>

          {stats && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Database contains {stats.totalVerses} verses from{' '}
                {Object.keys(stats.byBook).join(', ')} in{' '}
                {Object.keys(stats.byTranslation).join(', ')} translation(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Search Results ({results.length})
          </h2>
          
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{result.reference}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{result.translation}</Badge>
                    <Badge variant="outline">
                      Score: {(result.score * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.text}</p>
                {result.themes && result.themes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {result.themes.map((theme, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && !error && query && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No results found. Try a different search query.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">Example searches:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>love your neighbor</li>
          <li>kingdom of heaven</li>
          <li>forgiveness and mercy</li>
          <li>faith like a mustard seed</li>
          <li>blessed are the poor</li>
          <li>creation of the world</li>
          <li>Abraham's faith</li>
        </ul>
      </div>
    </div>
  );
}
