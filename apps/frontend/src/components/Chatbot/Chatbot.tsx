import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Chat, Send, Close } from '@mui/icons-material';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// 🔧 Create a Groq provider using environment variable
const groq = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    console.log('API Key available:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);

    if (apiKey) {
      setIsApiReady(true);
      console.log('AI SDK ready to use');
    } else {
      console.error('GROQ API key not found in environment variables');
      setIsApiReady(false);
    }
  }, []);

  const getAIResponse = async (userMessage: string) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ API key not found');
    }

    console.log('Sending request to GROQ AI SDK...');

    // Build conversation context
    const conversationHistory = messages
      .slice(-10) // Keep only last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `You are a helpful AI assistant for a task management application. Be concise and helpful.

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ''}
User: ${userMessage}

Please provide a helpful response:`;

    console.log('Prompt:', fullPrompt);

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: fullPrompt,
      // removed maxTokens to satisfy current installed types
      temperature: 0.7,
    });

    return text;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      console.log('Attempting to send message:', currentInput);

      if (!isApiReady) {
        throw new Error('AI service not available. Please check your API key.');
      }

      const response = await getAIResponse(currentInput);
      console.log('Received response:', response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || "Sorry, I couldn't process your request.",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Detailed error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);

      let errorMsg = "Sorry, I'm having trouble connecting right now. Please try again later.";

      if (error?.message) {
        if (error.message.includes('API key') || error.message.includes('unauthorized')) {
          errorMsg = "API key error. Please check the configuration.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg = "Network error. Please check your internet connection.";
        } else if (error.message.includes('rate limit')) {
          errorMsg = "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes('model')) {
          errorMsg = "Model error. Trying alternative model...";
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `${errorMsg}\n\nDebug info: ${error?.message || 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const testConnection = async () => {
    if (!isApiReady) {
      alert('API not ready - check console for details');
      return;
    }

    try {
      console.log('Testing connection...');
      const response = await getAIResponse('Hello, just testing the connection. Please respond with "Connection successful!"');
      alert(`Test successful: ${response}`);
    } catch (error: any) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error?.message || error}`);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(!open)}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 1300,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        }}
      >
        <Chat />
      </Fab>

      {/* Sliding Chat Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -400,
          width: 400,
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: open ? '4px 0 12px rgba(0,0,0,0.15)' : 'none',
          transition: 'left 0.3s ease-in-out',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e0e0e0',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Adevi's AI Assistant
          </Typography>
          <Box>
            <IconButton onClick={clearChat} size="small" sx={{ color: 'white', mr: 1 }}>
              <Typography variant="caption">Clear</Typography>
            </IconButton>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1, backgroundColor: '#f8f9fa' }}>
          {messages.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                👋 Hello! I'm Adevi's AI assistant. How can I help you today?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Status: {isApiReady ? '🟢 Online' : '🔴 Offline'}
              </Typography>
            </Box>
          ) : (
            <Box>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      maxWidth: '85%',
                      backgroundColor: message.role === 'user' ? '#1976d2' : 'white',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      borderRadius: message.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: '0.7rem',
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="caption" sx={{ ml: 1 }}>
                AI is typing...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading || !isApiReady}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: '#f5f5f5',
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading || !isApiReady}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                },
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Backdrop */}
      {open && (
        <Box
          onClick={handleClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1100,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </>
  );
};

export default Chatbot;
