'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AIAssistant } from '@/components/ai-assistant'
import { AIAgent } from '@/components/ai-agent'
import { 
  Play, 
  Save, 
  Share2, 
  Settings, 
  MoreVertical,
  FolderOpen,
  Plus
} from 'lucide-react'

interface HeaderProps {
  projectName: string
  onRun: () => void
  children?: React.ReactNode
  code?: string
  language?: string
  files?: Array<{ name: string; content: string; language: string }>
  projectId?: string
  onInsertCode?: (code: string) => void
  onReplaceCode?: (code: string) => void
  onFilesChange?: (files: Array<{ name: string; content: string; language: string }>) => void
  onRunCommand?: (command: string) => void
}

export function Header({ 
  projectName, 
  onRun, 
  children, 
  code = '', 
  language = '', 
  files = [],
  projectId,
  onInsertCode,
  onReplaceCode,
  onFilesChange,
  onRunCommand
}: HeaderProps) {
  return (
    <header className="h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <Input 
              value={projectName}
              className="h-8 w-48 border-none bg-transparent p-0 focus-visible:ring-0"
              readOnly
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onRun}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Run
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            
            {onInsertCode && onReplaceCode && (
              <>
                <AIAssistant
                  code={code}
                  language={language}
                  files={files}
                  projectId={projectId}
                  onInsertCode={onInsertCode}
                  onReplaceCode={onReplaceCode}
                />
                <AIAgent
                  files={files}
                  projectId={projectId}
                  onFilesChange={onFilesChange}
                  onRunCommand={onRunCommand}
                />
              </>
            )}
          </div>
          
          {children}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}