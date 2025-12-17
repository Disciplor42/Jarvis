
// Handles Audio Recording and Groq API calls

export const transcribeAudio = async (apiKey: string, modelId: string, audioBlob: Blob): Promise<string> => {
  if (!apiKey) throw new Error("Groq API Key missing.");
  // Default fallback if settings are empty, but UI should prevent this
  const modelToUse = modelId || 'whisper-large-v3';

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm'); 
  formData.append('model', modelToUse);
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Error: ${err}`);
  }

  const data = await response.json();
  return data.text;
};

// Helper for Browser Media Recording
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start();
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob([]));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];
        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
