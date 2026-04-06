import { io } from 'socket.io-client';

const socket = io("https://adverayze.onrender.com");

export const socket = io(SOCKET_URL, { autoConnect: false });
