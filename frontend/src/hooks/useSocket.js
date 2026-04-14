/**
 * useSocket.js — Singleton Socket.IO hook
 *
 * BUGS FIXED:
 * 1. Duplicate 'connect' listeners were added on every render because the listener
 *    was never removed. Each re-render appended another 'connect' handler → rooms
 *    were joined multiple times and event handlers stacked up.
 * 2. `on()` callback captured a potentially-null socketRef.current at call time
 *    instead of always using the current ref value.
 * 3. Socket was never cleaned up on logout (user → null), causing stale connections.
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socketInstance = null;

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Disconnect any old socket when user logs out
    if (!user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      socketRef.current = null;
      return;
    }

    // Create singleton connection once
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
      });
    }
    socketRef.current = socketInstance;

    // FIX: Define the handler so we can remove it on cleanup
    const handleConnect = () => {
      socketInstance.emit('join_user_room', user._id);
      if (user.role === 'admin') {
        socketInstance.emit('join_admin_room');
      }
      if (user.role === 'department_officer' && user.department) {
        socketInstance.emit(
          'join_department_room',
          user.department._id || user.department
        );
      }
    };

    // If already connected, join rooms immediately
    if (socketInstance.connected) {
      handleConnect();
    }

    socketInstance.on('connect', handleConnect);

    // FIX: Clean up the specific listener on unmount/user-change
    return () => {
      socketInstance?.off('connect', handleConnect);
    };
  }, [user]);

  // FIX: Always read socketRef.current at call time (not at hook call time)
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, on, emit };
};
