'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAIN_BIBLE_VERSIONS } from '@/config/bible-versions';

export default function TestBiblePage() {
  const { currentUser } = useAuth();
  const [bibles, setBibles] = useState<any[]>([]);
  const [selectedBible, setSelectedBible] = useState<string>('');
  const [verseId, setVerseId] = useState<string>('JHN.3.16');
  const [searchQuery, setSearchQuery] = useState<string>('love');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Fetch available Bibles on mount
  useEffect(() => {
    fetchBibles();
  }, [currentUser]);

  const fetchBibles = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/bibles?language=eng', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch Bibles');
      
      const data = await response.json();
      setBibles(data.bibles);
      if (data.bibles.length > 0) {
        const firstBible = data.bibles[0];
        setSelectedBible(firstBible.id);
        
        // Set the correct verse ID format based on the Bible version
        const bibleConfig = MAIN_BIBLE_VERSIONS.find(b => b.id === firstBible.id);
        if (bibleConfig?.verseIdExample) {
          setVerseId(bibleConfig.verseIdExample);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Bibles');
    } finally {
      setLoading(false);
    }
  };

  const testGetVerse = async () => {
    if (!currentUser || !selectedBible) return;
    
    try {
      setLoading(true);
      setError('');
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/bibles/${selectedBible}/verses/${verseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch verse');
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verse');
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    if (!currentUser || !selectedBible) return;
    
    try {
      setLoading(true);
      setError('');
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/bibles/${selectedBible}/search?query=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search');
      
      const data = await response.json();
      setResults(data);
      
      // If searching for John 3:16, show the correct verse ID
      if (searchQuery.toLowerCase().includes('john 3:16') && data.results && data.results.length > 0) {
        const johnVerse = data.results.find((v: any) => 
          v.reference && v.reference.includes('John 3:16')
        );
        if (johnVerse) {
          console.log('John 3:16 verse ID:', johnVerse.id);
          setError(`Tip: John 3:16 verse ID is "${johnVerse.id}"`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const testCachedSearch = async () => {
    if (!currentUser || !selectedBible) return;
    
    try {
      setLoading(true);
      setError('');
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/bibles/${selectedBible}/search?query=${searchQuery}&useCache=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search cached content');
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search cached content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Bible API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Bible</CardTitle>
          <CardDescription>Choose a Bible translation to test with</CardDescription>
        </CardHeader>
        <CardContent>
          <select 
            className="w-full p-2 border rounded"
            value={selectedBible}
            onChange={(e) => {
              setSelectedBible(e.target.value);
              // Update verse ID format when Bible changes
              const bibleConfig = MAIN_BIBLE_VERSIONS.find(b => b.id === e.target.value);
              if (bibleConfig?.verseIdExample) {
                setVerseId(bibleConfig.verseIdExample);
              }
            }}
            disabled={loading}
          >
            {bibles.map((bible) => (
              <option key={bible.id} value={bible.id}>
                {bible.name} ({bible.abbreviation})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Verse</CardTitle>
            <CardDescription>Fetch a specific verse by ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Verse ID (e.g., JHN.3.16)"
              value={verseId}
              onChange={(e) => setVerseId(e.target.value)}
            />
            <Button onClick={testGetVerse} disabled={loading}>
              Get Verse
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Bible</CardTitle>
            <CardDescription>Search for verses containing keywords</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={testSearch} disabled={loading}>
                API Search
              </Button>
              <Button onClick={testCachedSearch} disabled={loading} variant="outline">
                Cached Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
