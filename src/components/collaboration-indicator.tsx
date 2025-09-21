'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Users, Cursor } from 'lucide-react'

interface User {
  id: string
  name: string
  projectId: string
}

interface CollaborationIndicatorProps {
  onlineUsers: User[]
  typingUsers: { [userId: string]: string }
  cursors: { [userId: string]: { line: number; column: number } }
  currentFileId?: string
}

export function CollaborationIndicator({ 
  onlineUsers, 
  typingUsers, 
  cursors, 
  currentFileId 
}: CollaborationIndicatorProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  const isUserTypingInCurrentFile = (userId: string) => {
    return typingUsers[userId] === currentFileId
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {onlineUsers.length}
          </span>
        </div>
        
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className={`text-xs ${getUserColor(user.id)} text-white`}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isUserTypingInCurrentFile(user.id) && (
                    <div className="absolute -bottom-1 -right-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{user.name}</p>
                  {isUserTypingInCurrentFile(user.id) && (
                    <p className="text-xs text-green-500">Typing...</p>
                  )}
                  {cursors[user.id] && (
                    <p className="text-xs text-muted-foreground">
                      Line {cursors[user.id].line}, Col {cursors[user.id].column}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {onlineUsers.length > 5 && (
            <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                +{onlineUsers.length - 5}
              </span>
            </div>
          )}
        </div>
        
        {Object.keys(typingUsers).length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {Object.keys(typingUsers).length} typing
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}