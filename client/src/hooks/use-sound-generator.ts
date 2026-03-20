import { useRef, useCallback } from 'react';

// Hook for generating ambient sounds using Web Audio API
const useSoundGenerator = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Generate Om sound using oscillators
  const generateOmSound = useCallback((options: { duration?: number; volume?: number } = {}) => {
    const { duration = 5000, volume = 0.5 } = options;
    
    try {
      // Initialize or resume Audio Context (needed because of autoplay policies)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      
      // Create oscillator for the base frequency (136.1 Hz - Om frequency)
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 136.1; // Om fundamental frequency
      
      // Create gain node to control volume and fade in/out
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      
      // Create filter for a warmer sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;
      
      // Connect the audio graph
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Schedule gain (volume) changes for smooth fade in/out
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 2); // 2-second fade in
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + duration / 1000 - 2); // Slight decrease
      gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // 2-second fade out
      
      // Start oscillator
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
      
      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      
      // Clean up when complete
      oscillator.onended = () => {
        oscillator.disconnect();
        filter.disconnect();
        gainNode.disconnect();
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };
      
      return true;
    } catch (error) {
      console.error('Error generating Om sound:', error);
      return false;
    }
  }, []);
  
  // Generate temple bell / singing bowl sound
  const generateBellSound = useCallback((options: { duration?: number; volume?: number } = {}) => {
    const { duration = 3000, volume = 0.5 } = options;
    
    try {
      // Initialize or resume Audio Context (needed because of autoplay policies)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      
      // Create oscillator for bell sound (use multiple frequencies for rich harmonics)
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // Base frequency
      
      // Create gain node to control volume and fade in/out
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      
      // Create a biquad filter for resonance to simulate the bowl/bell
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 440;
      filter.Q.value = 50; // High Q for a resonant bell sound
      
      // Create a second oscillator for the harmonic
      const harmonic = ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.value = 440 * 2.756; // Harmonic frequency
      
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = 0;
      
      // Connect the audio graph
      oscillator.connect(filter);
      filter.connect(gainNode);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Schedule gain (volume) changes for authentic bell sound
      const now = ctx.currentTime;
      
      // Main tone
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.02); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000); // Long decay
      
      // Harmonic
      harmonicGain.gain.setValueAtTime(0, now);
      harmonicGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.02); // Quick attack
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000) * 0.75); // Faster decay
      
      // Start oscillators
      oscillator.start(now);
      harmonic.start(now);
      oscillator.stop(now + duration / 1000);
      harmonic.stop(now + duration / 1000);
      
      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      
      // Clean up when complete
      oscillator.onended = () => {
        oscillator.disconnect();
        harmonic.disconnect();
        filter.disconnect();
        gainNode.disconnect();
        harmonicGain.disconnect();
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };
      
      return true;
    } catch (error) {
      console.error('Error generating bell sound:', error);
      return false;
    }
  }, []);

  // Stop any currently playing sound
  const stopSound = useCallback(() => {
    try {
      if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        
        // Quick fade out (0.2 seconds)
        gainNodeRef.current.gain.cancelScheduledValues(now);
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
        gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.2);
        
        // Stop the oscillator after the fade out
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current = null;
          }
        }, 200);
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping sound:', error);
      return false;
    }
  }, []);
  
  return {
    generateOmSound,
    generateBellSound,
    stopSound
  };
};

export default useSoundGenerator;