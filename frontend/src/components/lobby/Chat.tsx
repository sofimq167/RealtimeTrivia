'use client';

// Componente de chat — funciona tanto en el lobby como durante la partida
// El scroll automático al fondo es importante: si no lo hago, el usuario
// tendría que bajar manualmente cada vez que llega un mensaje.

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/hooks/useSound';

interface ChatMessage {
  userId: number | null;
  username: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatProps {
  roomCode: string;
  initialMessages?: ChatMessage[];
}

export default function Chat({ roomCode, initialMessages = [] }: ChatProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { playChatMessage } = useSound();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático cuando llega un mensaje nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    function onMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev, msg]);
      // Solo reproduzco sonido si el mensaje es de otro usuario (no el mío)
      if (msg.userId !== user?.id && !msg.isSystem) {
        playChatMessage();
      }
    }

    function onHistory({ messages: history }: { messages: ChatMessage[] }) {
      setMessages(history);
    }

    socket.on('chat_message', onMessage);
    socket.on('chat_history', onHistory);

    return () => {
      socket.off('chat_message', onMessage);
      socket.off('chat_history', onHistory);
    };
  }, [socket, user?.id, playChatMessage]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!socket || !input.trim()) return;
    socket.emit('send_chat', { roomCode, message: input.trim() });
    setInput('');
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-brown mb-3 px-1">Chat</h3>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-brown/40 text-sm text-center py-4">
            Nadie ha hablado todavía... ¡di algo!
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;

          if (msg.isSystem) {
            return (
              <div key={i} className="text-center">
                <span className="text-xs text-brown/40 bg-beige-100 px-3 py-1 rounded-full">
                  {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div key={i} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-xs text-brown/50 px-1 font-medium">{msg.username}</span>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${isMe
                    ? 'bg-brown text-cream-50 rounded-br-md'
                    : 'bg-white border border-beige-100 text-brown-dark rounded-bl-md'
                  }`}
              >
                {msg.message}
              </div>
              <span className="text-[10px] text-brown/30 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de envío */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={200}
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-beige-200
                     text-sm text-brown-dark placeholder-sand
                     focus:outline-none focus:border-sand transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl bg-brown text-cream-50 flex items-center justify-center
                     hover:bg-brown-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
