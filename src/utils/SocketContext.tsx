import React, { createContext, useContext, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { getSocketServerUrl } from './socketUrl';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only create the socket once
  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io(getSocketServerUrl(), {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      transports: ['websocket', 'polling']
    });
  }
  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 