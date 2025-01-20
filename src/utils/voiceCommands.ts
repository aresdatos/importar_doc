import { VoiceCommand } from '@/types/voice';

export function matchVoiceCommand(text: string, commands: VoiceCommand[]): VoiceCommand | null {
  const normalizedText = text.toLowerCase().trim();
  
  for (const command of commands) {
    if (command.patterns.some(pattern => pattern.test(normalizedText))) {
      return command;
    }
  }
  
  return null;
}

export function createVoiceCommands(actions: {
  onProcess: () => void;
  onViewDocument: () => void;
  onReset: () => void;
  onSend: () => void;
}): VoiceCommand[] {
  return [
    {
      command: 'procesar',
      action: actions.onProcess,
      patterns: [
        /^procesar$/i,
        /^procesar\s+documento$/i,
        /^analizar$/i,
        /^analizar\s+documento$/i,
      ]
    },
    {
      command: 'ver',
      action: actions.onViewDocument,
      patterns: [
        /^ver$/i,
        /^ver\s+documento$/i,
        /^mostrar$/i,
        /^mostrar\s+documento$/i,
        /^mostrar\s+pdf$/i,
      ]
    },
    {
      command: 'reiniciar',
      action: actions.onReset,
      patterns: [
        /^reiniciar$/i,
        /^reiniciar\s+documento$/i,
        /^limpiar$/i,
        /^limpiar\s+documento$/i,
      ]
    },
    {
      command: 'enviar',
      action: actions.onSend,
      patterns: [
        /^enviar$/i,
        /^enviar\s+documento$/i,
        /^guardar$/i,
        /^guardar\s+documento$/i,
      ]
    }
  ];
}