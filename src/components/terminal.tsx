'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  Copy, 
  Maximize2,
  Minimize2,
  Play
} from 'lucide-react'

interface TerminalProps {
  output: string[]
  onCommand: (command: string) => void
}

export function Terminal({ output, onCommand }: TerminalProps) {
  const [input, setInput] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onCommand(input.trim())
      setCommandHistory(prev => [...prev, input.trim()])
      setHistoryIndex(-1)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < 0 ? commandHistory.length - 1 : historyIndex - 1
        if (newIndex >= 0) {
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex])
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex])
        } else {
          setHistoryIndex(-1)
          setInput('')
        }
      }
    }
  }

  const handleClear = () => {
    onCommand('clear')
  }

  const handleCopy = () => {
    const text = output.join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-medium">Terminal</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
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
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 font-mono text-sm space-y-1">
          {output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-words">
              {line}
            </div>
          ))}
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
            <span className="text-green-400">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-green-400"
              placeholder="Type a command..."
            />
          </form>
        </div>
      </ScrollArea>
    </div>
  )
}