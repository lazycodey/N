'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  File, 
  Folder, 
  FolderOpen, 
  Trash2, 
  Edit2,
  X
} from 'lucide-react'

interface File {
  id: string
  name: string
  content: string
  language: string
  path: string
}

interface FileExplorerProps {
  files: File[]
  activeFile: File
  onFileSelect: (file: File) => void
  onFileCreate: (name: string) => void
}

export function FileExplorer({ 
  files, 
  activeFile, 
  onFileSelect, 
  onFileCreate 
}: FileExplorerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim())
      setNewFileName('')
      setIsCreating(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <File className="h-4 w-4 text-yellow-500" />
      case 'json':
        return <File className="h-4 w-4 text-green-500" />
      case 'py':
        return <File className="h-4 w-4 text-blue-500" />
      case 'html':
        return <File className="h-4 w-4 text-orange-500" />
      case 'css':
        return <File className="h-4 w-4 text-purple-500" />
      case 'md':
        return <File className="h-4 w-4 text-gray-500" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Files</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCreating(true)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {isCreating && (
          <div className="flex gap-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.js"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewFileName('')
                }
              }}
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCreateFile}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsCreating(false)
                setNewFileName('')
              }}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <span className="text-sm">My Project</span>
          </div>
          
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer group ${
                activeFile.id === file.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onFileSelect(file)}
            >
              {getFileIcon(file.name)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle rename
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle delete
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}