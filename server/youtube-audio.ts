import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { Express, Request, Response } from 'express';
import { storage } from './storage';

// Function to download audio from YouTube and save as MP3
export async function downloadYoutubeAudio(
  videoUrl: string,
  outputFileName: string,
  mantraId?: string
): Promise<string> {
  try {
    // Create audio directory if it doesn't exist
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Full path for output file
    const outputPath = path.join(audioDir, `${outputFileName}.mp3`);
    
    // Get video info
    const info = await ytdl.getInfo(videoUrl);
    console.log(`Downloading audio from: ${info.videoDetails.title}`);
    
    // Create write stream for temporary file
    const tempFile = path.join(audioDir, `${outputFileName}.temp`);
    const writeStream = fs.createWriteStream(tempFile);
    
    // Download audio only
    ytdl(videoUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
    }).pipe(writeStream);
    
    // Convert to MP3 when download completes
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        ffmpeg(tempFile)
          .audioBitrate(128)
          .save(outputPath)
          .on('end', () => {
            // Clean up temp file
            fs.unlinkSync(tempFile);
            
            // If mantraId is provided, update the mantra's audioUrl
            if (mantraId) {
              updateMantraAudioUrl(mantraId, `/audio/${outputFileName}.mp3`);
            }
            
            console.log(`Successfully saved audio to ${outputPath}`);
            resolve(`/audio/${outputFileName}.mp3`);
          })
          .on('error', (err: any) => {
            console.error('Error converting audio:', err);
            reject(err);
          });
      });
      
      writeStream.on('error', (err: any) => {
        console.error('Error downloading video:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error in downloadYoutubeAudio:', error);
    throw error;
  }
}

// Function to update a mantra's audioUrl in the database
async function updateMantraAudioUrl(mantraId: string, audioUrl: string): Promise<void> {
  try {
    const mantra = await storage.getMantra(mantraId);
    if (mantra) {
      // Update the mantra object with the new audioUrl
      const updatedMantra = {
        ...mantra,
        audioUrl,
      };
      
      // Since we're using in-memory storage, we need to update the Map directly
      // This is a workaround since our storage doesn't have an updateMantra method
      (storage as any).mantras.set(mantraId, updatedMantra);
      
      console.log(`Updated audioUrl for mantra ${mantraId} to ${audioUrl}`);
    } else {
      console.error(`Mantra with ID ${mantraId} not found`);
    }
  } catch (error) {
    console.error('Error updating mantra audioUrl:', error);
  }
}

// Function to register the YouTube download API routes
export function registerYoutubeRoutes(app: Express): void {
  // Route to download YouTube audio and associate with a mantra
  app.post('/api/youtube-audio', async (req: Request, res: Response) => {
    try {
      const { videoUrl, outputFileName, mantraId } = req.body;
      
      if (!videoUrl || !outputFileName) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Validate YouTube URL
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }
      
      const audioUrl = await downloadYoutubeAudio(videoUrl, outputFileName, mantraId);
      
      res.status(200).json({ 
        success: true, 
        audioUrl,
        message: 'Audio successfully downloaded and processed' 
      });
    } catch (error: unknown) {
      console.error('Error in /api/youtube-audio endpoint:', error);
      res.status(500).json({ 
        error: 'Failed to download and process audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to get all mantras with their audio URLs
  app.get('/api/mantras-with-audio', async (_req: Request, res: Response) => {
    try {
      // Get all deities
      const deities = await storage.getDeities();
      
      // For each deity, get its mantras and include audio URLs
      const deitiesWithMantras = await Promise.all(
        deities.map(async (deity) => {
          const mantras = await storage.getMantras(deity.id);
          return {
            ...deity,
            mantras,
          };
        })
      );
      
      res.status(200).json(deitiesWithMantras);
    } catch (error: unknown) {
      console.error('Error getting mantras with audio:', error);
      res.status(500).json({ error: 'Failed to get mantras with audio' });
    }
  });
}