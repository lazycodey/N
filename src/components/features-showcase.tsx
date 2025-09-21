'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Code, 
  Users, 
  Zap, 
  Bot, 
  FolderOpen, 
  Play,
  Globe,
  Database,
  Shield
} from 'lucide-react'

export function FeaturesShowcase() {
  const features = [
    {
      icon: Code,
      title: 'Multi-Language Support',
      description: 'Write code in JavaScript, Python, HTML/CSS, and more with syntax highlighting.',
      badges: ['JavaScript', 'Python', 'HTML', 'CSS', 'JSON']
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Code together with your team in real-time. See cursors, typing indicators, and live updates.',
      badges: ['Live Sync', 'Cursors', 'Typing', 'WebSocket']
    },
    {
      icon: Bot,
      title: 'AI Assistance',
      description: 'Get help from AI with code explanations, improvements, debugging, and documentation.',
      badges: ['Code Review', 'Debug', 'Explain', 'Improve']
    },
    {
      icon: Play,
      title: 'Code Execution',
      description: 'Run your code directly in the browser with support for multiple languages.',
      badges: ['Node.js', 'Python', 'Terminal', 'Output']
    },
    {
      icon: FolderOpen,
      title: 'File Management',
      description: 'Create, edit, delete, and organize files with an intuitive file explorer.',
      badges: ['Create', 'Edit', 'Delete', 'Organize']
    },
    {
      icon: Zap,
      title: 'Modern IDE',
      description: 'Professional code editor with line numbers, syntax highlighting, and keyboard shortcuts.',
      badges: ['Syntax', 'Line Numbers', 'Shortcuts', 'Themes']
    },
    {
      icon: Globe,
      title: 'Web-Based',
      description: 'Access your projects from anywhere. No installation required.',
      badges: ['Cloud', 'Browser', 'Cross-Platform', 'Mobile']
    },
    {
      icon: Database,
      title: 'Project Persistence',
      description: 'Your projects are automatically saved and can be accessed anytime.',
      badges: ['Auto-Save', 'Database', 'History', 'Versions']
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your code is secure with project-level privacy controls.',
      badges: ['Private', 'Secure', 'Encrypted', 'Safe']
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <Card key={index} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {feature.badges.map((badge, badgeIndex) => (
                  <Badge key={badgeIndex} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}