import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ChatRoom {
  id: string;
  quoteId: string;
  customerId: string;
  printerId: string;
  status: 'active' | 'closed';
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file';
  isRead: boolean;
  createdAt: string;
}

interface ChatProps {
  quoteId?: string;
  customerId?: string;
  printerId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Chat({ quoteId, customerId, printerId, isOpen, onClose }: ChatProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat rooms
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ['/api/chat/rooms'],
    enabled: isOpen && !!user,
  });

  // Fetch messages for current room
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/rooms', currentRoom?.id, 'messages'],
    enabled: !!currentRoom,
  });

  // Create or get chat room
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { quoteId: string; customerId: string; printerId: string }) => {
      return await apiRequest(`/api/chat/rooms`, 'POST', roomData) as ChatRoom;
    },
    onSuccess: (room: ChatRoom) => {
      setCurrentRoom(room);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('contract must be approved')) {
        alert('Mesajlaşma özelliği sadece sözleşme onaylandıktan sonra kullanılabilir.');
      } else {
        alert('Chat odası oluşturulamadı: ' + error.message);
      }
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/messages`, 'POST', {
        content,
        messageType: 'text',
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat/rooms', currentRoom?.id, 'messages'] 
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('contract must be approved')) {
        alert('Mesajlaşma özelliği sadece sözleşme onaylandıktan sonra kullanılabilir.');
      } else {
        alert('Mesaj gönderilemedi: ' + error.message);
      }
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/read`, 'PUT');
    },
  });

  // WebSocket setup
  useEffect(() => {
    if (!isOpen || !currentRoom) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'join_room',
        roomId: currentRoom.id
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/chat/rooms', currentRoom.id, 'messages'] 
          });
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message);
          if (data.message.includes('contract not approved')) {
            alert('Mesajlaşma özelliği sadece sözleşme onaylandıktan sonra kullanılabilir.');
          }
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };

    websocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'leave_room',
          roomId: currentRoom.id
        }));
      }
      websocket.close();
    };
  }, [currentRoom, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize room when props change
  useEffect(() => {
    if (isOpen && quoteId && customerId && printerId && !currentRoom) {
      createRoomMutation.mutate({ quoteId, customerId, printerId });
    }
  }, [isOpen, quoteId, customerId, printerId, currentRoom]);

  // Mark messages as read when room opens
  useEffect(() => {
    if (currentRoom && user) {
      markAsReadMutation.mutate(currentRoom.id);
    }
  }, [currentRoom, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    sendMessageMutation.mutate({
      roomId: currentRoom.id,
      content: newMessage.trim(),
    });
  };

  const selectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
  };

  const getUserInitials = (userId: string) => {
    // In a real app, you'd fetch user data
    return userId.slice(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[600px] flex">
        {/* Chat rooms sidebar */}
        <div className="w-80 border-r bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Konuşmalar</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-2">
              {rooms.map((room: ChatRoom) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentRoom?.id === room.id
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-background hover:bg-muted"
                  }`}
                  onClick={() => selectRoom(room)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(
                          user?.id === room.customerId ? room.printerId : room.customerId
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Teklif #{room.quoteId.slice(-6)}
                      </p>
                      {room.lastMessageAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(room.lastMessageAt), "dd MMM HH:mm", {
                            locale: tr,
                          })}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {room.status === 'active' ? 'Aktif' : 'Kapalı'}
                    </Badge>
                  </div>
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz konuşma yok</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 flex flex-col">
          {currentRoom ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">
                  Teklif #{currentRoom.quoteId.slice(-6)} - Konuşma
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message: ChatMessage) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.senderId === user?.id ? "justify-end" : ""
                      }`}
                    >
                      {message.senderId !== user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(message.senderId)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === user?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(message.createdAt), "HH:mm")}
                        </p>
                      </div>
                      {message.senderId === user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user?.id || "")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <CardContent className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Konuşma başlatmak için bir teklif seçin</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}