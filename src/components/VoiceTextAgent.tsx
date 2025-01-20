import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { createVoiceCommands, matchVoiceCommand } from '@/utils/voiceCommands';

interface VoiceTextAgentProps {
  onMessage: (message: string) => void;
  isProcessing: boolean;
  onProcess: () => void;
  onViewDocument: () => void;
  onReset: () => void;
  onSend: () => void;
  className?: string;
}

export function VoiceTextAgent({
  onMessage,
  isProcessing,
  onProcess,
  onViewDocument,
  onReset,
  onSend,
  className
}: VoiceTextAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const commandsRef = useRef(createVoiceCommands({
    onProcess,
    onViewDocument,
    onReset,
    onSend
  }));

  useEffect(() => {
    // Check for browser support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';
      setIsVoiceSupported(true);
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      utteranceRef.current = new SpeechSynthesisUtterance();
      utteranceRef.current.lang = 'es-ES';
      setIsSpeechSupported(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          
          // Check for voice commands
          const command = matchVoiceCommand(transcript, commandsRef.current);
          if (command) {
            command.action();
            return;
          }
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setError(
        event.error === 'not-allowed'
          ? 'Permiso de micrófono denegado. Por favor, habilite el acceso al micrófono.'
          : 'Error en el reconocimiento de voz. Por favor, intente nuevamente.'
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };
  }, [isListening]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError('El reconocimiento de voz no está soportado en este navegador.');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error al acceder al micrófono. Por favor, verifique los permisos.');
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    if (!synthRef.current || !utteranceRef.current) {
      setError('La síntesis de voz no está soportada en este navegador.');
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onMessage(transcript);
      setTranscript('');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Escriba o hable su mensaje..."
            className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isVoiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
                title={isListening ? "Detener grabación" : "Iniciar grabación"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
            
            {isSpeechSupported && (
              <button
                type="button"
                onClick={toggleSpeech}
                disabled={isProcessing}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isSpeaking
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
                title={isSpeaking ? "Desactivar voz" : "Activar voz"}
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!transcript.trim() || isProcessing}
          className={cn(
            "px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors",
            "hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Enviar
        </button>
      </form>

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Escuchando...
        </div>
      )}
    </div>
  );
}