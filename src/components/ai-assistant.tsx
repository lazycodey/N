'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Send, 
  Sparkles, 
  Code, 
  Lightbulb, 
  Bug,
  CheckCircle,
  Loader2,
  X,
  FileText,
  Zap,
  Target,
  Wrench,
  Plus,
  Download
} from 'lucide-react'

interface AIAssistantProps {
  code: string
  language: string
  onInsertCode: (code: string) => void
  onReplaceCode: (code: string) => void
  files?: Array<{ name: string; content: string; language: string }>
  projectId?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'code' | 'explanation' | 'suggestion' | 'fix' | 'completion'
  code?: string
  files?: Array<{ name: string; content: string; language: string }>
  suggestions?: string[]
  confidence?: number
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  task: 'generate' | 'improve' | 'debug' | 'explain' | 'refactor' | 'complete'
  query: string
  color: string
}

export function AIAssistant({ 
  code, 
  language, 
  onInsertCode, 
  onReplaceCode, 
  files = [], 
  projectId 
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<'generate' | 'improve' | 'debug' | 'explain' | 'refactor' | 'complete'>('explain')
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ name: string; content: string; language: string }>>([])

  const quickActions: QuickAction[] = [
    {
      id: 'explain',
      label: 'Explain Code',
      icon: <Lightbulb className="h-3 w-3" />,
      task: 'explain',
      query: 'Explain what this code does and how it works.',
      color: 'bg-blue-500'
    },
    {
      id: 'improve',
      label: 'Improve Code',
      icon: <Code className="h-3 w-3" />,
      task: 'improve',
      query: 'Suggest improvements to make this code more efficient and readable.',
      color: 'bg-green-500'
    },
    {
      id: 'debug',
      label: 'Debug Issues',
      icon: <Bug className="h-3 w-3" />,
      task: 'debug',
      query: 'Help me debug this code. Are there any potential issues or bugs?',
      color: 'bg-red-500'
    },
    {
      id: 'refactor',
      label: 'Refactor',
      icon: <Wrench className="h-3 w-3" />,
      task: 'refactor',
      query: 'Refactor this code to improve its structure and maintainability.',
      color: 'bg-purple-500'
    },
    {
      id: 'complete',
      label: 'Complete Code',
      icon: <Zap className="h-3 w-3" />,
      task: 'complete',
      query: 'Complete this code implementation.',
      color: 'bg-yellow-500'
    },
    {
      id: 'generate',
      label: 'Generate New',
      icon: <Plus className="h-3 w-3" />,
      task: 'generate',
      query: 'Generate a new implementation based on my requirements.',
      color: 'bg-indigo-500'
    }
  ]

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
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
          query: currentInput,
          context: messages.slice(-6), // Send last 6 messages for context
          task: selectedTask,
          files,
          projectId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          type: data.type,
          code: data.code,
          files: data.files,
          suggestions: data.suggestions,
          confidence: data.confidence
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Update generated files if any
        if (data.files) {
          setGeneratedFiles(data.files)
        }
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

  const handleQuickAction = (action: QuickAction) => {
    setSelectedTask(action.task)
    setInput(action.query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInsertGeneratedFile = (file: { name: string; content: string; language: string }) => {
    // This would typically trigger a file creation in the project
    console.log('Inserting file:', file.name)
    // For now, we'll just show the content
    alert(`File "${file.name}" would be created in your project.`)
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
            {/* Confidence indicator */}
            {!isUser && message.confidence && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex-1 bg-background/30 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${message.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs opacity-70">
                  {Math.round(message.confidence * 100)}%
                </span>
              </div>
            )}

            {/* Code block */}
            {message.code && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs opacity-70">Generated Code:</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onInsertCode(message.code || '')}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReplaceCode(message.code || '')}
                      className="h-6 w-6 p-0"
                    >
                      <Target className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <pre className="bg-background/50 rounded p-2 text-xs overflow-x-auto border">
                  <code>{message.code}</code>
                </pre>
              </div>
            )}

            {/* Generated files */}
            {message.files && message.files.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-70">Generated Files:</span>
                  <Badge variant="secondary" className="text-xs">
                    {message.files.length} files
                  </Badge>
                </div>
                <div className="space-y-2">
                  {message.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="bg-background/30 rounded p-2 border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInsertGeneratedFile(file)}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-xs opacity-70 overflow-x-auto">
                        {file.content.substring(0, 100)}{file.content.length > 100 ? '...' : ''}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mb-3">
                <span className="text-xs opacity-70 block mb-1">Suggestions:</span>
                <div className="space-y-1">
                  {message.suggestions.map((suggestion, suggestionIndex) => (
                    <div key={suggestionIndex} className="text-xs bg-background/30 rounded p-2 border-l-2 border-blue-500">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
          
          {/* Type badge */}
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
      
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Code Assistant
          </DialogTitle>
          <DialogDescription>
            Get help with your code using AI. Generate, improve, debug, or explain code with advanced AI assistance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Task Selection and Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={selectedTask === action.task ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="gap-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${action.color}`} />
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Task:</span>
                <Select value={selectedTask} onValueChange={(value: any) => setSelectedTask(value)}>
                  <SelectTrigger className="w-40 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explain">Explain Code</SelectItem>
                    <SelectItem value="improve">Improve Code</SelectItem>
                    <SelectItem value="debug">Debug Issues</SelectItem>
                    <SelectItem value="refactor">Refactor Code</SelectItem>
                    <SelectItem value="complete">Complete Code</SelectItem>
                    <SelectItem value="generate">Generate New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Messages */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm mb-2">
                    I'm your AI coding assistant! I can help you with:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {quickActions.slice(0, 3).map((action) => (
                      <Badge key={action.id} variant="outline" className="text-xs">
                        {action.label}
                      </Badge>
                    ))}
                  </div>
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
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
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
              placeholder={`Ask me to ${selectedTask} your code...`}
              className="flex-1 resize-none"
              rows={3}
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