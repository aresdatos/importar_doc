import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getDeepSeekClient } from '@/utils/deepseek/config';
import { DocumentData, DetailItem } from '@/types/document';
import { VoiceTextAgent } from './VoiceTextAgent';

interface ChatAgentProps {
  documentData: DocumentData;
  onUpdateDocumentData: (updates: Partial<DocumentData>) => void;
  onNewDocument: () => void;
}

export function ChatAgent({ documentData, onUpdateDocumentData, onNewDocument }: ChatAgentProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputContent, setInputContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hola, soy tu asistente para procesar documentos. ¿Qué deseas hacer?\n\n' +
                'Puedes:\n' +
                '1. Crear un nuevo documento\n' +
                '2. Modificar el documento actual\n' +
                '3. Agregar o editar ítems'
      }]);
    }
  }, [messages.length]);

  const processJsonResponse = useCallback((content: string) => {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) return;

    try {
      const jsonData = JSON.parse(jsonMatch[1]);

      // Handle new document initialization
      if (jsonData.newDocument) {
        onNewDocument();
        onUpdateDocumentData({
          header: {
            name: '',
            taxId: '',
            date: new Date().toISOString().split('T')[0],
            documentNumber: ''
          },
          details: []
        });
        return;
      }

      // Handle header updates
      if (jsonData.header) {
        onUpdateDocumentData({ header: jsonData.header });
      }

      // Handle adding new items
      if (jsonData.updateType === 'add' && Array.isArray(jsonData.details)) {
        const newDetails = jsonData.details.map((item: any) => ({
          itemCode: String(item.itemCode || ''),
          description: String(item.description || ''),
          unitOfMeasure: String(item.unitOfMeasure || 'UND'),
          quantity: Number(item.quantity) || 0,
          grossPrice: Number(item.grossPrice) || 0,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
          netValue: calculateNetValue(item),
        }));

        onUpdateDocumentData({
          details: [...documentData.details, ...newDetails],
        });
      }

      // Handle updating existing items
      if (jsonData.updateType === 'update' && typeof jsonData.index === 'number') {
        const updatedDetails = [...documentData.details];
        const currentItem = updatedDetails[jsonData.index];
        if (currentItem) {
          updatedDetails[jsonData.index] = {
            ...currentItem,
            ...jsonData.item,
            netValue: calculateNetValue({
              ...currentItem,
              ...jsonData.item,
            }),
          };
          onUpdateDocumentData({ details: updatedDetails });
        }
      }

      // Handle removing items
      if (jsonData.updateType === 'remove' && typeof jsonData.index === 'number') {
        const updatedDetails = documentData.details.filter((_, i) => i !== jsonData.index);
        onUpdateDocumentData({ details: updatedDetails });
      }
    } catch (error) {
      console.error('Error processing JSON response:', error);
    }
  }, [documentData.details, onUpdateDocumentData, onNewDocument]);

  const calculateNetValue = useCallback((item: Partial<DetailItem>) => {
    const quantity = Number(item.quantity) || 0;
    const grossPrice = Number(item.grossPrice) || 0;
    const discount = Number(item.discount) || 0;
    const tax = Number(item.tax) || 0;

    const base = quantity * grossPrice;
    const discountAmount = base * (discount / 100);
    const subtotal = base - discountAmount;
    const taxAmount = subtotal * (tax / 100);
    
    return subtotal + taxAmount;
  }, []);

  const handleSubmit = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isProcessing) return;

    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: trimmedContent }]);

    try {
      const client = await getDeepSeekClient();
      const systemPrompt = `You are a document processing assistant that helps users manage document data through natural language.

Current document data:
${JSON.stringify(documentData, null, 2)}

Instructions for processing user input:

1. For a new document request:
   - Return JSON with "newDocument": true
   - Guide user to enter header information

2. For existing documents, handle:
   - Header updates: Update any header field when mentioned
   - Adding items: Create new line items with provided details
   - Modifying items: Update existing items by index or description
   - Removing items: Remove items by index or description

3. Always respond with:
   - Confirmation of changes
   - Next steps or suggestions
   - JSON updates in one of these formats:

   For new document:
   \`\`\`json
   {
     "newDocument": true
   }
   \`\`\`

   For header updates:
   \`\`\`json
   {
     "header": {
       "name": "new name",
       "taxId": "new tax id",
       "date": "new date",
       "documentNumber": "new number"
     }
   }
   \`\`\`

   For adding items:
   \`\`\`json
   {
     "updateType": "add",
     "details": [{
       "itemCode": "code",
       "description": "description",
       "unitOfMeasure": "unit",
       "quantity": number,
       "grossPrice": number,
       "discount": number,
       "tax": number
     }]
   }
   \`\`\`

   For updating items:
   \`\`\`json
   {
     "updateType": "update",
     "index": number,
     "item": {
       "description": "new description",
       "quantity": number,
       ...other fields
     }
   }
   \`\`\`

   For removing items:
   \`\`\`json
   {
     "updateType": "remove",
     "index": number
   }
   \`\`\`

4. Always respond in Spanish
5. Be helpful and guide the user through the process
6. Validate and format data appropriately
7. Calculate netValue when quantity and price change
8. Keep track of item indices (starting from 0)
9. Confirm changes with specific details
10. Always wrap JSON in triple backticks with json type`;

      const response = await client.createCompletion({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: trimmedContent }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const assistantMessage = response.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      processJsonResponse(assistantMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        },
      ]);
    } finally {
      setIsProcessing(false);
      setInputContent('');
    }
  }, [documentData, isProcessing, messages, processJsonResponse]);

  const handleNewDocument = useCallback(() => {
    onNewDocument();
    setMessages([{
      role: 'assistant',
      content: 'He iniciado un nuevo documento. Por favor, dime la información del encabezado:\n\n' +
               '- Nombre o razón social\n' +
               '- RNC/NIT (identificación fiscal)\n' +
               '- Número de documento\n' +
               '- Fecha del documento'
    }]);
  }, [onNewDocument]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Asistente de Documentos</h3>
        </div>
        <button className="p-1 hover:bg-gray-200 rounded-full">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="h-64 overflow-y-auto space-y-4 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 text-sm",
                  message.role === 'assistant' ? "flex-row" : "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === 'assistant'
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-500 text-white"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <VoiceTextAgent
            onMessage={handleSubmit}
            isProcessing={isProcessing}
            onProcess={() => {}}
            onViewDocument={() => {}}
            onReset={handleNewDocument}
            onSend={() => handleSubmit(inputContent)}
          />
        </div>
      )}
    </div>
  );
}