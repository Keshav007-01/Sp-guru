import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Deity, Mantra } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const YouTubeAudioManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedDeity, setSelectedDeity] = useState<string>('');
  const [selectedMantra, setSelectedMantra] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch deities and mantras
  const { data: deities } = useQuery<Deity[]>({ 
    queryKey: ['/api/deities'],
  });

  const { data: mantras } = useQuery<Mantra[]>({ 
    queryKey: ['/api/mantras', selectedDeity],
    enabled: !!selectedDeity,
  });

  const handleDeityChange = (value: string) => {
    setSelectedDeity(value);
    setSelectedMantra('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      // Verify inputs
      if (!selectedMantra) {
        toast({
          title: 'Error',
          description: 'Please select a mantra',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!youtubeUrl) {
        toast({
          title: 'Error',
          description: 'Please enter a YouTube URL',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Extract mantra id from selectedMantra
      const mantraId = selectedMantra;
      
      // Get mantra details for the filename
      const selectedMantraDetails = mantras?.find(m => m.id === mantraId);
      if (!selectedMantraDetails) {
        throw new Error('Mantra details not found');
      }

      // Use mantra ID as the output filename
      const outputFileName = mantraId;

      // Call the API to download YouTube audio
      const response = await fetch('/api/youtube-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: youtubeUrl,
          outputFileName,
          mantraId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to download audio');
      }

      // Show success message
      setSuccessMessage(`Successfully processed audio for ${selectedMantraDetails.title}. Audio URL: ${data.audioUrl}`);
      
      // Clear form
      setYoutubeUrl('');
      
      toast({
        title: 'Success',
        description: 'Audio successfully downloaded and linked to mantra',
      });
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download audio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">YouTube Audio Manager</h1>
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add YouTube Audio to Mantras</CardTitle>
          <CardDescription>
            Extract audio from YouTube videos and link them to mantras
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deity">Deity</Label>
              <Select value={selectedDeity} onValueChange={handleDeityChange}>
                <SelectTrigger id="deity">
                  <SelectValue placeholder="Select a deity" />
                </SelectTrigger>
                <SelectContent>
                  {deities?.map((deity) => (
                    <SelectItem key={deity.id} value={deity.id}>
                      {deity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mantra">Mantra</Label>
              <Select 
                value={selectedMantra} 
                onValueChange={setSelectedMantra}
                disabled={!selectedDeity || !mantras?.length}
              >
                <SelectTrigger id="mantra">
                  <SelectValue placeholder={!selectedDeity ? "First select a deity" : "Select a mantra"} />
                </SelectTrigger>
                <SelectContent>
                  {mantras?.map((mantra) => (
                    <SelectItem key={mantra.id} value={mantra.id}>
                      {mantra.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {successMessage && (
              <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !selectedMantra || !youtubeUrl} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Download and Process Audio'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-md max-w-2xl mx-auto">
        <h3 className="font-medium text-amber-800 mb-2">Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
          <li>Select a deity from the dropdown</li>
          <li>Select the specific mantra you want to add audio for</li>
          <li>Paste a YouTube URL containing the mantra chant</li>
          <li>Click "Download and Process Audio" and wait for the process to complete</li>
          <li>Once finished, the audio will be linked to the mantra automatically</li>
        </ol>
      </div>
    </div>
  );
};

export default YouTubeAudioManager;