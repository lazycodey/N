'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, FolderOpen } from 'lucide-react'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (project: {
    name: string
    description: string
    language: string
    files: Array<{
      name: string
      content: string
      language: string
      path: string
    }>
  }) => void
}

const languageTemplates = {
  javascript: [
    {
      name: 'index.js',
      content: `console.log('Hello, World!');

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Replit Clone'));`,
      language: 'javascript',
      path: '/index.js'
    },
    {
      name: 'package.json',
      content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A JavaScript project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`,
      language: 'json',
      path: '/package.json'
    }
  ],
  python: [
    {
      name: 'main.py',
      content: `def greet(name):
    return f"Hello, {name}!"

def main():
    print("Hello, World!")
    print(greet("Replit Clone"))

if __name__ == "__main__":
    main()`,
      language: 'python',
      path: '/main.py'
    },
    {
      name: 'requirements.txt',
      content: '# Add your Python dependencies here',
      language: 'text',
      path: '/requirements.txt'
    }
  ],
  html: [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Project</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .message {
            text-align: center;
            margin-top: 20px;
            font-size: 18px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <div class="message">
            Welcome to your Replit Clone project!
        </div>
    </div>
</body>
</html>`,
      language: 'html',
      path: '/index.html'
    }
  ]
}

export function ProjectDialog({ open, onOpenChange, onCreateProject }: ProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !language) return

    const templateFiles = languageTemplates[language as keyof typeof languageTemplates] || []
    
    onCreateProject({
      name,
      description,
      language,
      files: templateFiles
    })

    // Reset form
    setName('')
    setDescription('')
    setLanguage('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project with your preferred programming language.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    JavaScript
                  </div>
                </SelectItem>
                <SelectItem value="python">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Python
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    HTML/CSS
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !language}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}