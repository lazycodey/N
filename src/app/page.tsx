'use client'

import { useState, useEffect, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { FileExplorer } from '@/components/file-explorer'
import { CodeEditor } from '@/components/code-editor'
import { Terminal } from '@/components/terminal'
import { Header } from '@/components/header'
import { ProjectDialog } from '@/components/project-dialog'
import { CollaborationIndicator } from '@/components/collaboration-indicator'
import { FeaturesShowcase } from '@/components/features-showcase'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Loader2, Github, Code } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface File {
  id: string
  name: string
  content: string
  language: string
  path: string
}

interface Project {
  id: string
  name: string
  description?: string
  language: string
  ownerId: string
  files: File[]
}

interface User {
  id: string
  name: string
  projectId: string
}

export default function Home() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [activeFile, setActiveFile] = useState<File | null>(null)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Welcome to Replit Clone!',
    'Create a new project to get started...',
    ''
  ])
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mock user for collaboration
  const currentUser: User = {
    id: 'user-1',
    name: 'You',
    projectId: currentProject?.id || ''
  }

  const {
    isConnected,
    onlineUsers,
    cursors,
    typingUsers,
    sendCodeChange,
    sendCursorMove,
    sendFileCreated,
    sendFileDeleted,
    sendFileRenamed,
    sendTerminalCommand,
    sendTypingStart,
    sendTypingStop
  } = useSocket(currentProject?.id || null, currentUser)

  useEffect(() => {
    if (currentProject) {
      setFiles(currentProject.files)
      setActiveFile(currentProject.files[0] || null)
      setTerminalOutput([
        `Project loaded: ${currentProject.name}`,
        `Language: ${currentProject.language}`,
        `Files: ${currentProject.files.length}`,
        isConnected ? 'Collaboration: Connected' : 'Collaboration: Disconnected',
        ''
      ])
    }
  }, [currentProject, isConnected])

  const handleCreateProject = async (projectData: {
    name: string
    description: string
    language: string
    files: File[]
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...projectData,
          ownerId: 'temp-user-id' // In real app, this would come from auth
        }),
      })

      if (response.ok) {
        const project = await response.json()
        setCurrentProject(project)
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setTerminalOutput(prev => [...prev, 'Error: Failed to create project', ''])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpdate = async (fileId: string, content: string) => {
    if (!currentProject) return

    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, content } : file
    ))
    
    if (activeFile?.id === fileId) {
      setActiveFile(prev => prev ? { ...prev, content } : null)
    }

    // Send collaboration update
    sendCodeChange(fileId, content, currentUser.id)

    try {
      await fetch(`/api/projects/${currentProject.id}/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const handleFileCreate = async (name: string) => {
    if (!currentProject) return

    const newFile: File = {
      id: Date.now().toString(),
      name,
      content: '',
      language: name.split('.').pop() || 'text',
      path: `/${name}`
    }

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFile),
      })

      if (response.ok) {
        const savedFile = await response.json()
        setFiles(prev => [...prev, savedFile])
        sendFileCreated(savedFile, currentUser.id)
      }
    } catch (error) {
      console.error('Error creating file:', error)
      setTerminalOutput(prev => [...prev, `Error: Failed to create ${name}`, ''])
    }
  }

  const handleRunCode = async () => {
    if (!currentProject || !activeFile) return

    const command = `node ${activeFile.name}`
    setTerminalOutput(prev => [...prev, `$ ${command}`, 'Running...'])
    sendTerminalCommand(command, currentUser.id)

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          files: files
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setTerminalOutput(prev => [...prev, result.output || 'No output', ''])
      } else {
        throw new Error('Execution failed')
      }
    } catch (error) {
      console.error('Error running code:', error)
      setTerminalOutput(prev => [...prev, 'Error: Failed to execute code', ''])
    }
  }

  const handleCursorMove = (line: number, column: number) => {
    if (activeFile) {
      sendCursorMove(activeFile.id, line, column, currentUser.id)
    }
  }

  const handleTypingStart = () => {
    if (activeFile) {
      sendTypingStart(activeFile.id, currentUser.id)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleTypingStop = () => {
    if (activeFile) {
      // Set a timeout to stop typing indicator after user stops typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop(activeFile.id, currentUser.id)
      }, 1000)
    }
  }

  const handleInsertCode = (code: string) => {
    if (activeFile) {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = 
          activeFile.content.substring(0, start) + 
          code + 
          activeFile.content.substring(end)
        
        handleFileUpdate(activeFile.id, newContent)
        
        // Set cursor position after inserted code
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + code.length
          textarea.focus()
        }, 0)
      }
    }
  }

  const handleReplaceCode = (code: string) => {
    if (activeFile) {
      handleFileUpdate(activeFile.id, code)
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Replit Clone</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
              <Button 
                onClick={() => setIsProjectDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Get Started
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Code Together, Build Faster
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A powerful online IDE with real-time collaboration, AI assistance, and multi-language support. 
                Build, share, and deploy code projects right from your browser.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setIsProjectDialogOpen(true)}
                size="lg"
                className="gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Your First Project
              </Button>
              <Button variant="outline" size="lg">
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Everything You Need to Build Amazing Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional-grade features that make coding collaborative, intelligent, and enjoyable.
            </p>
          </div>
          
          <FeaturesShowcase />
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Coding?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of developers who are already building amazing projects with Replit Clone.
              </p>
              <Button 
                onClick={() => setIsProjectDialogOpen(true)}
                size="lg"
                className="gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Free Project
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-medium">Replit Clone</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Built with Next.js, TypeScript, and ❤️
              </div>
            </div>
          </div>
        </footer>

        <ProjectDialog
          open={isProjectDialogOpen}
          onOpenChange={setIsProjectDialogOpen}
          onCreateProject={handleCreateProject}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        projectName={currentProject.name}
        onRun={handleRunCode}
        code={activeFile?.content || ''}
        language={activeFile?.language || ''}
        onInsertCode={handleInsertCode}
        onReplaceCode={handleReplaceCode}
      >
        <CollaborationIndicator
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          cursors={cursors}
          currentFileId={activeFile?.id}
        />
      </Header>
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <FileExplorer 
              files={files}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              onFileCreate={handleFileCreate}
            />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          
          <Panel defaultSize={60}>
            {activeFile ? (
              <CodeEditor
                file={activeFile}
                onContentChange={(content) => handleFileUpdate(activeFile.id, content)}
                onCursorMove={handleCursorMove}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to start editing
              </div>
            )}
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          
          <Panel defaultSize={20} minSize={15}>
            <Terminal 
              output={terminalOutput}
              onCommand={(command) => {
                setTerminalOutput(prev => [...prev, `$ ${command}`, ''])
                sendTerminalCommand(command, currentUser.id)
              }}
            />
          </Panel>
        </PanelGroup>
      </div>

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}