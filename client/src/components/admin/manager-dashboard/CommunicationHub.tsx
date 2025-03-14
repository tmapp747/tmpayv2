import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Send, 
  BellRing, 
  Users, 
  Clock,
  CheckCheck,
  User
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { casinoApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Notification {
  id: string;
  type: 'system' | 'transaction' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
}

interface CommunicationHubProps {
  manager: string;
  users: Array<{ id: number; username: string; type: string }>;
  messages: Message[];
  notifications: Notification[];
  isLoading?: boolean;
}

export default function CommunicationHub({
  manager,
  users,
  messages,
  notifications,
  isLoading = false,
}: CommunicationHubProps) {
  const { toast } = useToast();
  const [messageTab, setMessageTab] = useState<'compose' | 'inbox'>('compose');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get the initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!recipient || !subject || !content) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all message fields",
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Send message using the Casino API
      await casinoApi.sendMessage({
        username: recipient,
        subject,
        message: content
      });
      
      toast({
        title: "Message sent",
        description: `Message to ${recipient} sent successfully`,
      });
      
      // Reset form
      setRecipient('');
      setSubject('');
      setContent('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Display notification badge
  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'system':
        return <Badge variant="outline">System</Badge>;
      case 'transaction':
        return <Badge className="bg-green-500">Transaction</Badge>;
      case 'user':
        return <Badge className="bg-blue-500">User</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Communication Hub</CardTitle>
          <CardDescription>Loading messages and notifications...</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse w-full h-60 bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Communication Hub</CardTitle>
        <CardDescription>
          Manage messages and notifications for {manager}'s network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messages">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="messages">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <BellRing className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={messageTab === 'compose' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageTab('compose')}
              >
                <Send className="h-4 w-4 mr-1" />
                Compose
              </Button>
              <Button
                variant={messageTab === 'inbox' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageTab('inbox')}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Inbox {messages.filter(m => !m.isRead).length > 0 && (
                  <Badge className="ml-1">
                    {messages.filter(m => !m.isRead).length}
                  </Badge>
                )}
              </Button>
            </div>
            
            {messageTab === 'compose' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Agents</SelectLabel>
                        {users
                          .filter(user => user.type === 'agent')
                          .map(user => (
                            <SelectItem key={user.id} value={user.username}>
                              {user.username} (Agent)
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Players</SelectLabel>
                        {users
                          .filter(user => user.type === 'player')
                          .map(user => (
                            <SelectItem key={user.id} value={user.username}>
                              {user.username} (Player)
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Enter message subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Enter your message here"
                    className="min-h-[120px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleSendMessage}
                  disabled={!recipient || !subject || !content || isSending}
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border ${
                        !message.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="font-semibold">{message.subject}</h4>
                              <p className="text-sm text-muted-foreground">
                                From: {message.sender}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(message.timestamp)}
                              </span>
                              {!message.isRead && (
                                <Badge variant="default" className="ml-2">New</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm mt-2">{message.content}</p>
                          <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm">
                              <CheckCheck className="h-4 w-4 mr-1" />
                              Mark as Read
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <BellRing className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No notifications found</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      !notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        {notification.type === 'system' && (
                          <BellRing className="h-5 w-5 text-orange-500" />
                        )}
                        {notification.type === 'transaction' && (
                          <Users className="h-5 w-5 text-green-500" />
                        )}
                        {notification.type === 'user' && (
                          <User className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{notification.title}</h4>
                            {getNotificationBadge(notification.type)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm mt-1">{notification.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground w-full text-center">
          Messages are delivered directly to the 747 Casino system
        </p>
      </CardFooter>
    </Card>
  );
}