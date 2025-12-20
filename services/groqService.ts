
// Handles Audio Recording and Groq API calls

export const transcribeAudio = async (apiKey: string, modelId: string, audioBlob: Blob): Promise<string> => {
  if (!apiKey) throw new Error("Groq API Key missing.");
  // Default fallback if settings are empty, but UI should prevent this
  const modelToUse = modelId || 'whisper-large-v3-turbo';

  // Determine correct file extension based on MIME type for API compatibility
  let extension = 'webm';
  if (audioBlob.type.includes('mp4')) extension = 'mp4';
  else if (audioBlob.type.includes('wav')) extension = 'wav';
  else if (audioBlob.type.includes('ogg')) extension = 'ogg';
  else if (audioBlob.type.includes('mpeg')) extension = 'mp3';
  else if (audioBlob.type.includes('m4a')) extension = 'm4a';

  const formData = new FormData();
  formData.append('file', audioBlob, `recording.${extension}`); 
  formData.append('model', modelToUse);
  formData.append('response_format', 'json');

  // Add timeout to prevent "stuck" state
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s hard timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Transcription timed out.");
    }
    throw error;
  }
};

// Helper for Browser Media Recording
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      
      // Prefer standard MIME types if supported
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.start();
    } catch (e) {
      console.error("Mic Error:", e);
      throw e;
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(new Blob([], { type: 'audio/webm' }));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.chunks = [];
        
        // Stop all tracks to release microphone hardware
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        this.mediaRecorder = null;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
