declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  patterns: RegExp[];
}