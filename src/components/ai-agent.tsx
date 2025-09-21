'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Send, 
  Sparkles, 
  Code, 
  FileText,
  Terminal,
  Play,
  Pause,
  Loader2,
  X,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface AIAgentProps {
  files?: Array<{ name: string; content: string; language: string }>
  projectId?: string
  onFilesChange?: (files: Array<{ name: string; content: string; language: string }>) => void
  onRunCommand?: (command: string) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Array<{
    type: 'create_file' | 'edit_file' | 'delete_file' | 'run_command' | 'create_project' | 'explain'
    target?: string
    content?: string
    command?: string
    reasoning: string
    status: 'pending' | 'executing' | 'completed' | 'error'
  }>
  output?: string
}

interface FileChange {
  name: string
  type: 'created' | 'modified' | 'deleted'
  content?: string
  timestamp: Date
}

export function AIAgent({ 
  files = [], 
  projectId, 
  onFilesChange,
  onRunCommand 
}: AIAgentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [mode, setMode] = useState<'chat' | 'autonomous'>('autonomous')
  const [fileChanges, setFileChanges] = useState<FileChange[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [terminalOutput])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          projectId,
          files,
          context: messages.slice(-10), // Send last 10 messages for context
          mode
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          actions: data.actions?.map((action: any) => ({
            ...action,
            status: 'pending' as const
          })),
          output: data.output
        }
        
        setMessages(prev => [...prev, assistantMessage])
        
        // Execute actions if in autonomous mode
        if (mode === 'autonomous' && data.actions && data.actions.length > 0) {
          await executeActions(data.actions, assistantMessage)
        }
        
        // Update files if they changed
        if (data.files && onFilesChange) {
          onFilesChange(data.files)
          
          // Track file changes
          const newChanges: FileChange[] = []
          data.files.forEach((file: any) => {
            const existingFile = files.find(f => f.name === file.name)
            if (!existingFile) {
              newChanges.push({
                name: file.name,
                type: 'created',
                content: file.content,
                timestamp: new Date()
              })
            } else if (existingFile.content !== file.content) {
              newChanges.push({
                name: file.name,
                type: 'modified',
                content: file.content,
                timestamp: new Date()
              })
            }
          })
          
          // Check for deleted files
          files.forEach(existingFile => {
            if (!data.files.find((f: any) => f.name === existingFile.name)) {
              newChanges.push({
                name: existingFile.name,
                type: 'deleted',
                timestamp: new Date()
              })
            }
          })
          
          setFileChanges(prev => [...prev, ...newChanges])
        }
        
        // Add terminal output if any
        if (data.output) {
          setTerminalOutput(prev => [...prev, data.output])
        }
      } else {
        throw new Error('AI agent request failed')
      }
    } catch (error) {
      console.error('Error with AI agent:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const executeActions = async (actions: any[], message: Message) => {
    setIsExecuting(true)
    
    // Update message to show actions are executing
    setMessages(prev => prev.map(msg => 
      msg === message 
        ? { 
            ...msg, 
            actions: msg.actions?.map(action => ({ ...action, status: 'executing' as const }))
          }
        : msg
    ))

    // Simulate action execution with delays
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      
      // Update action status to executing
      setMessages(prev => prev.map(msg => 
        msg === message 
          ? { 
              ...msg, 
              actions: msg.actions?.map((a, index) => 
                index === i ? { ...a, status: 'executing' as const } : a
              )
            }
          : msg
      ))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Update action status to completed
      setMessages(prev => prev.map(msg => 
        msg === message 
          ? { 
              ...msg, 
              actions: msg.actions?.map((a, index) => 
                index === i ? { ...a, status: 'completed' as const } : a
              )
            }
          : msg
      ))

      // Add terminal output for the action
      let output = ''
      switch (action.type) {
        case 'create_file':
          output = `✅ Created file: ${action.target}`
          break
        case 'edit_file':
          output = `✅ Modified file: ${action.target}`
          break
        case 'delete_file':
          output = `✅ Deleted file: ${action.target}`
          break
        case 'run_command':
          output = `⚡ Executed: ${action.command}`
          if (onRunCommand) {
            onRunCommand(action.command)
          }
          break
      }
      
      if (output) {
        setTerminalOutput(prev => [...prev, output])
      }
    }

    setIsExecuting(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setFileChanges([])
    setTerminalOutput([])
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
            {/* Actions */}
            {message.actions && message.actions.length > 0 && (
              <div className="mb-3 space-y-2">
                <span className="text-xs opacity-70">Actions:</span>
                {message.actions.map((action, actionIndex) => (
                  <div key={actionIndex} className="bg-background/30 rounded p-2 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {action.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {action.status === 'pending' && (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )}
                        {action.status === 'executing' && (
                          <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                        )}
                        {action.status === 'completed' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {action.status === 'error' && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                    {action.target && (
                      <div className="text-xs opacity-70">
                        Target: {action.target}
                      </div>
                    )}
                    {action.command && (
                      <div className="text-xs opacity-70 font-mono">
                        Command: {action.command}
                      </div>
                    )}
                    <div className="text-xs opacity-60 mt-1">
                      {action.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Output */}
            {message.output && (
              <div className="mb-3">
                <span className="text-xs opacity-70 block mb-1">Output:</span>
                <pre className="bg-background/50 rounded p-2 text-xs overflow-x-auto border">
                  {message.output}
                </pre>
              </div>
            )}
            
            {/* Main content */}
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
          
          {/* Timestamp */}
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
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
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          AI Agent
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Coding Agent
          </DialogTitle>
          <DialogDescription>
            Autonomous AI agent that can create, edit, and manage files. Like Bolt.new or Z.ai for your projects.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Mode Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agent Mode</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant={mode === 'autonomous' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('autonomous')}
                  className="gap-1"
                >
                  <Play className="h-3 w-3" />
                  Autonomous
                </Button>
                <Button
                  variant={mode === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('chat')}
                  className="gap-1"
                >
                  <Bot className="h-3 w-3" />
                  Chat Only
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </Button>
              </div>
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  {mode === 'autonomous' 
                    ? '🤖 AI will autonomously create, edit, and execute files and commands'
                    : '💬 AI will provide guidance without making changes'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Main Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            {/* Chat */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="border rounded-lg flex-1 flex flex-col">
                <div className="p-3 border-b bg-muted/30">
                  <h3 className="text-sm font-medium">Conversation</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm mb-2">
                          I'm your autonomous AI coding agent!
                        </p>
                        <p className="text-xs">
                          Ask me to create, edit, or build anything. I'll handle the files and commands automatically.
                        </p>
                      </div>
                    )}
                    
                    {messages.map(renderMessage)}
                    
                    {(isLoading || isExecuting) && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">
                              {isLoading ? 'AI is thinking...' : 'Executing actions...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me to create, edit, or build anything..."
                      className="flex-1 resize-none"
                      rows={2}
                      disabled={isLoading || isExecuting}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading || isExecuting}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* File Changes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    File Changes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-32">
                    {fileChanges.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No changes yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {fileChanges.slice(-10).reverse().map((change, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {change.type === 'created' && <Plus className="h-3 w-3 text-green-500" />}
                            {change.type === 'modified' && <Edit className="h-3 w-3 text-blue-500" />}
                            {change.type === 'deleted' && <Trash2 className="h-3 w-3 text-red-500" />}
                            <span className="truncate">{change.name}</span>
                            <span className="opacity-50">
                              {change.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Terminal Output */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Terminal className="h-4 w-4" />
                    Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-48" ref={scrollRef}>
                    <div className="font-mono text-xs space-y-1">
                      {terminalOutput.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          <Terminal className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No terminal output</p>
                        </div>
                      ) : (
                        terminalOutput.map((output, index) => (
                          <div key={index} className="whitespace-pre-wrap break-words">
                            {output}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}