'use client'

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Copy, 
  Download, 
  Maximize2,
  Minimize2
} from 'lucide-react'

interface File {
  id: string
  name: string
  content: string
  language: string
  path: string
}

interface CodeEditorProps {
  file: File
  onContentChange: (content: string) => void
  onCursorMove?: (line: number, column: number) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
}

interface Cursor {
  userId: string
  userName: string
  line: number
  column: number
  color: string
}

export function CodeEditor({ 
  file, 
  onContentChange, 
  onCursorMove,
  onTypingStart,
  onTypingStop 
}: CodeEditorProps) {
  const [content, setContent] = useState(file.content)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cursors, setCursors] = useState<Cursor[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setContent(file.content)
  }, [file])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onContentChange(newContent)
    
    // Handle typing indicators
    if (onTypingStart) {
      onTypingStart()
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop()
      }
    }, 1000)
  }

  const handleSelectionChange = () => {
    if (textareaRef.current && onCursorMove) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const textBefore = textarea.value.substring(0, start)
      const lines = textBefore.split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      
      onCursorMove(line, column)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = 
          content.substring(0, start) + 
          '  ' + 
          content.substring(end)
        
        setContent(newContent)
        onContentChange(newContent)
        
        // Set cursor position after the inserted tabs
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    }
  }

  const getLanguageClass = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'language-javascript'
      case 'typescript':
      case 'ts':
        return 'language-typescript'
      case 'python':
      case 'py':
        return 'language-python'
      case 'html':
        return 'language-html'
      case 'css':
        return 'language-css'
      case 'json':
        return 'language-json'
      case 'markdown':
      case 'md':
        return 'language-markdown'
      default:
        return 'language-text'
    }
  }

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    const index = parseInt(userId.slice(-4), 16) % colors.length
    return colors[index]
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderCursors = () => {
    const lines = content.split('\n')
    
    return cursors.map((cursor) => {
      if (cursor.line > lines.length) return null
      
      const lineText = lines[cursor.line - 1] || ''
      const maxColumn = lineText.length + 1
      const column = Math.min(cursor.column, maxColumn)
      
      return (
        <div
          key={cursor.userId}
          className="absolute flex items-center pointer-events-none"
          style={{
            top: `${(cursor.line - 1) * 24}px`,
            left: `${48 + (column - 1) * 8.4}px`,
            zIndex: 10
          }}
        >
          <div className={`w-0.5 h-6 ${cursor.color.replace('bg-', 'bg-')}`} />
          <Avatar className="h-5 w-5 ml-1 border-2 border-background">
            <AvatarFallback className={`text-xs ${cursor.color} text-white`}>
              {getInitials(cursor.userName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )
    })
  }

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {file.language.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-7 w-7 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="h-7 w-7 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="relative h-full">
          {/* Collaborative cursors */}
          {renderCursors()}
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onClick={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="w-full h-full p-4 font-mono text-sm resize-none border-none bg-transparent focus:outline-none"
            style={{
              tabSize: 2,
              lineHeight: 1.5,
              paddingLeft: '48px'
            }}
            spellCheck={false}
            placeholder="Start coding..."
          />
          
          {/* Line numbers */}
          <div className="absolute left-0 top-0 w-12 h-full pointer-events-none bg-muted/30 border-r">
            <div className="font-mono text-xs text-right pr-2 pt-4 select-none">
              {content.split('\n').map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}