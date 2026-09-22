import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinQueue: (queueId: string) => void;
  leaveQueue: (queueId: string) => void;
  lastEvent: { type: string; data: any; timestamp: number } | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any; timestamp: number } | null>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
      setIsConnected(true);
      if (user?.id) {
        socket.emit('join_user', user.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Listen to all queue synchronization events
    const eventNames = [
      'queue:updated',
      'queue:reordered',
      'queue:called',
      'queue:user_joined',
      'queue:user_left',
      'queue:service_started',
      'queue:service_completed',
      'user:turn_called',
    ];

    eventNames.forEach((ev) => {
      socket.on(ev, (data) => {
        setLastEvent({ type: ev, data, timestamp: Date.now() });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // When user logs in or changes, join their private notification room
  useEffect(() => {
    if (socketRef.current && isConnected && user?.id) {
      socketRef.current.emit('join_user', user.id);
    }
  }, [user, isConnected]);

  const joinQueue = (queueId: string) => {
    if (socketRef.current && queueId) {
      socketRef.current.emit('join_queue', queueId);
    }
  };

  const leaveQueue = (queueId: string) => {
    if (socketRef.current && queueId) {
      socketRef.current.emit('leave_queue', queueId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinQueue,
        leaveQueue,
        lastEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
