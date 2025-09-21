'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Bot, 
  Send, 
  Sparkles, 
  Code, 
  Lightbulb, 
  Bug,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react'

interface AIAssistantProps {
  code: string
  language: string
  onInsertCode: (code: string) => void
  onReplaceCode: (code: string) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'code' | 'explanation' | 'suggestion' | 'fix'
  code?: string
}

export function AIAssistant({ code, language, onInsertCode, onReplaceCode }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          query: input,
          context: messages.slice(-4) // Send last 4 messages for context
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          type: data.type,
          code: data.code
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('AI request failed')
      }
    } catch (error) {
      console.error('Error getting AI assistance:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        type: 'explanation'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    const actionQueries = {
      explain: 'Explain what this code does and how it works.',
      improve: 'Suggest improvements to make this code more efficient and readable.',
      debug: 'Help me debug this code. Are there any potential issues or bugs?',
      document: 'Add comprehensive documentation and comments to this code.',
      optimize: 'Optimize this code for better performance.'
    }

    setInput(actionQueries[action as keyof typeof actionQueries])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user'
    
    return (
      <div
        key={index}
        className={`flex gap-3 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
          <div
            className={`rounded-lg p-3 ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {message.type === 'code' && message.code && (
              <div className="mb-2">
                <pre className="bg-background/50 rounded p-2 text-xs overflow-x-auto">
                  <code>{message.code}</code>
                </pre>
              </div>
            )}
            
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
            
            {message.type === 'code' && message.code && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onInsertCode(message.code || '')}
                  className="text-xs"
                >
                  Insert
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReplaceCode(message.code || '')}
                  className="text-xs"
                >
                  Replace
                </Button>
              </div>
            )}
          </div>
          
          {message.type && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {message.type}
              </Badge>
            </div>
          )}
        </div>
        
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">You</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Code Assistant
          </DialogTitle>
          <DialogDescription>
            Get help with your code using AI. Ask questions, request improvements, or get debugging assistance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('explain')}
                  className="gap-1"
                >
                  <Lightbulb className="h-3 w-3" />
                  Explain
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('improve')}
                  className="gap-1"
                >
                  <Code className="h-3 w-3" />
                  Improve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('debug')}
                  className="gap-1"
                >
                  <Bug className="h-3 w-3" />
                  Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('document')}
                  className="gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('optimize')}
                  className="gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Optimize
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Messages */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    I'm here to help you with your code! Ask me anything about your {language} code.
                  </p>
                </div>
              )}
              
              {messages.map(renderMessage)}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your code..."
              className="flex-1 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}