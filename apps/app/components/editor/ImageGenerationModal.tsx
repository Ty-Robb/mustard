'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Upload,
  Link,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, style?: string) => Promise<{ url: string; alt?: string }>;
  onUpload: (file: File) => Promise<{ url: string }>;
  onUrlSubmit: (url: string) => void;
  initialPrompt?: string;
}

export function ImageGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  onUpload,
  onUrlSubmit,
  initialPrompt = '',
}: ImageGenerationModalProps) {
  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState('realistic');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; alt?: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onGenerate(prompt, style);
      setGeneratedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onUpload(file);
      setGeneratedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    onUrlSubmit(imageUrl);
    handleClose();
  };

  const handleClose = () => {
    setPrompt(initialPrompt);
    setStyle('realistic');
    setImageUrl('');
    setError(null);
    setGeneratedImage(null);
    onClose();
  };

  const handleInsert = () => {
    if (generatedImage) {
      onUrlSubmit(generatedImage.url);
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Image to Slide</DialogTitle>
          <DialogDescription>
            Generate an AI image, upload from your device, or add from URL
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <RadioGroup value={style} onValueChange={setStyle} disabled={isLoading}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="realistic" id="realistic" />
                    <Label htmlFor="realistic" className="font-normal cursor-pointer">
                      Realistic Photo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="illustration" id="illustration" />
                    <Label htmlFor="illustration" className="font-normal cursor-pointer">
                      Illustration
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="diagram" id="diagram" />
                    <Label htmlFor="diagram" className="font-normal cursor-pointer">
                      Diagram
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="artistic" id="artistic" />
                    <Label htmlFor="artistic" className="font-normal cursor-pointer">
                      Artistic
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {generatedImage && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={generatedImage.url}
                  alt={generatedImage.alt || 'Generated image'}
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Choose a file</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>

            {generatedImage && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={generatedImage.url}
                  alt="Uploaded image"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isLoading}
              />
            </div>

            {imageUrl && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                  onError={() => setError('Failed to load image from URL')}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          {activeTab === 'generate' && !generatedImage && (
            <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          )}
          {activeTab === 'url' && (
            <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
              Add Image
            </Button>
          )}
          {(activeTab === 'generate' || activeTab === 'upload') && generatedImage && (
            <Button onClick={handleInsert}>
              Insert Image
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
