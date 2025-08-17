"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Github, MessageSquare, Settings, Download, Upload, CheckCircle, AlertCircle, Play, Square, FileText, Copy, TestTube, History, HelpCircle, Book, Info } from 'lucide-react'
import { toast } from 'sonner'

interface ChatEntry {
  timestamp: string
  prompt: string
  response: string
  model: string
}

interface Config {
  openaiApiKey: string
  githubToken: string
  githubRepo: string
  uploadTime: string
  autoUpload: boolean
  model: string
  maxChunkSize: number
  morningPromptEnabled: boolean
}

interface ImportedChat {
  title?: string
  create_time?: number
  mapping?: any
  messages?: any[]
  conversation_id?: string
}

export default function ChatGPTLogger() {
  const [config, setConfig] = useState<Config>({
    openaiApiKey: '',
    githubToken: '',
    githubRepo: '',
    uploadTime: '22:00',
    autoUpload: true,
    model: 'gpt-3.5-turbo',
    maxChunkSize: 10,
    morningPromptEnabled: true
  })
  
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isConfigured, setIsConfigured] = useState(false)
  const [setupStep, setSetupStep] = useState(0)
  const [installProgress, setInstallProgress] = useState(0)
  const [isInstalling, setIsInstalling] = useState(false)
  const [lastUpload, setLastUpload] = useState<string | null>(null)
  const [schedulerRunning, setSchedulerRunning] = useState(false)
  const [showMorningPrompt, setShowMorningPrompt] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [showTrialMode, setShowTrialMode] = useState(false)
  const [yesterdayCount, setYesterdayCount] = useState(0)
  const [showGuide, setShowGuide] = useState(false)

  const setupSteps = [
    'Installing Dependencies',
    'Configuring OpenAI API',
    'Setting up GitHub Integration',
    'Configuring Scheduler',
    'Final Setup'
  ]

  useEffect(() => {
    loadConfig()
    loadChatHistory()
    checkLastUpload()
    checkMorningPrompt()
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && prompt.trim() && !isLoading) {
        e.preventDefault()
        sendPrompt()
      }
      // Escape to clear prompt
      if (e.key === 'Escape' && prompt) {
        setPrompt('')
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [prompt, isLoading])

  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('chatgpt-logger-config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        // Ensure new properties have defaults
        const configWithDefaults = {
          ...config,
          ...parsed,
          maxChunkSize: parsed.maxChunkSize || 10,
          morningPromptEnabled: parsed.morningPromptEnabled !== undefined ? parsed.morningPromptEnabled : true
        }
        setConfig(configWithDefaults)
        setIsConfigured(!!configWithDefaults.openaiApiKey && !!configWithDefaults.githubToken && !!configWithDefaults.githubRepo)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Failed to load configuration. Using defaults.')
    }
  }

  const saveConfig = (newConfig: Config) => {
    try {
      localStorage.setItem('chatgpt-logger-config', JSON.stringify(newConfig))
      setConfig(newConfig)
      setIsConfigured(!!newConfig.openaiApiKey && !!newConfig.githubToken && !!newConfig.githubRepo)
      toast.success('Configuration saved successfully!')
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    }
  }

  const loadChatHistory = () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const savedHistory = localStorage.getItem(`chat-history-${today}`)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) {
          setChatHistory(parsed)
        } else {
          console.warn('Invalid chat history format, resetting to empty array')
          setChatHistory([])
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      setChatHistory([])
      toast.error('Failed to load chat history')
    }
  }

  const saveChatEntry = (entry: ChatEntry) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const newHistory = [...chatHistory, entry]
      setChatHistory(newHistory)
      localStorage.setItem(`chat-history-${today}`, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error saving chat entry:', error)
      toast.error('Failed to save conversation')
    }
  }

  const checkLastUpload = () => {
    const lastUploadDate = localStorage.getItem('last-github-upload')
    setLastUpload(lastUploadDate)
  }

  const checkMorningPrompt = () => {
    const today = new Date().toISOString().split('T')[0]
    const lastPrompt = localStorage.getItem('last-morning-prompt')
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayHistory = localStorage.getItem(`chat-history-${yesterday}`)
    
    if (yesterdayHistory) {
      const yesterdayChats = JSON.parse(yesterdayHistory)
      setYesterdayCount(yesterdayChats.length)
      
      if (config.morningPromptEnabled && lastPrompt !== today && yesterdayChats.length > 0) {
        setShowMorningPrompt(true)
      }
    }
  }

  const copyYesterdayConversations = () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayHistory = localStorage.getItem(`chat-history-${yesterday}`)
    
    if (yesterdayHistory) {
      const yesterdayChats = JSON.parse(yesterdayHistory)
      const newHistory = [...chatHistory, ...yesterdayChats]
      setChatHistory(newHistory)
      
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`chat-history-${today}`, JSON.stringify(newHistory))
      localStorage.setItem('last-morning-prompt', today)
      
      setShowMorningPrompt(false)
      toast.success(`Copied ${yesterdayChats.length} conversations from yesterday!`)
    }
  }

  const dismissMorningPrompt = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('last-morning-prompt', today)
    setShowMorningPrompt(false)
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
  }

  const processImportFile = async () => {
    if (!importFile) {
      toast.error('No file selected')
      return
    }
    
    setIsImporting(true)
    setImportProgress(0)
    
    try {
      const text = await importFile.text()
      
      if (!text.trim()) {
        throw new Error('File is empty')
      }
      
      const data = JSON.parse(text)
      
      let conversations: ImportedChat[] = []
      
      // Handle different ChatGPT export formats
      if (Array.isArray(data)) {
        conversations = data
      } else if (data.conversations) {
        conversations = data.conversations
      } else if (data.mapping) {
        conversations = [data]
      } else {
        throw new Error('Unrecognized file format')
      }
      
      if (conversations.length === 0) {
        throw new Error('No conversations found in file')
      }
      
      const totalConversations = conversations.length
      const chunkSize = Math.max(1, Math.min(config.maxChunkSize, 50)) // Ensure valid chunk size
      let processedCount = 0
      let importedCount = 0
      
      for (let i = 0; i < conversations.length; i += chunkSize) {
        const chunk = conversations.slice(i, i + chunkSize)
        
        for (const conv of chunk) {
          try {
            const chatEntries = extractChatEntries(conv)
            if (chatEntries.length > 0) {
              const convDate = conv.create_time 
                ? new Date(conv.create_time * 1000).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
              
              const existingHistory = localStorage.getItem(`chat-history-${convDate}`)
              const existing = existingHistory ? JSON.parse(existingHistory) : []
              const combined = [...existing, ...chatEntries]
              
              localStorage.setItem(`chat-history-${convDate}`, JSON.stringify(combined))
              importedCount++
            }
          } catch (convError) {
            console.warn('Failed to process conversation:', convError)
          }
          
          processedCount++
          setImportProgress((processedCount / totalConversations) * 100)
        }
        
        // Add delay between chunks to prevent UI freezing
        if (i + chunkSize < conversations.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      loadChatHistory() // Refresh current day's history
      setShowImportDialog(false)
      setImportFile(null)
      toast.success(`Successfully imported ${importedCount} conversations from ${processedCount} processed!`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import file. Please check the format.')
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const extractChatEntries = (conversation: ImportedChat): ChatEntry[] => {
    const entries: ChatEntry[] = []
    
    if (conversation.mapping) {
      // Handle new ChatGPT export format
      Object.values(conversation.mapping).forEach((node: any) => {
        if (node.message?.content?.parts?.length > 0) {
          const message = node.message
          const content = message.content.parts.join('')
          const timestamp = conversation.create_time 
            ? new Date(conversation.create_time * 1000).toISOString()
            : new Date().toISOString()
          
          if (message.author.role === 'user') {
            // Store user message to pair with assistant response
            const userMessage = content
            // Find corresponding assistant response
            const assistantNode = Object.values(conversation.mapping).find((n: any) => 
              n.parent === node.id && n.message?.author?.role === 'assistant'
            ) as any
            
            if (assistantNode?.message?.content?.parts?.length > 0) {
              entries.push({
                timestamp,
                prompt: userMessage,
                response: assistantNode.message.content.parts.join(''),
                model: assistantNode.message.metadata?.model_slug || 'unknown'
              })
            }
          }
        }
      })
    } else if (conversation.messages) {
      // Handle older format
      for (let i = 0; i < conversation.messages.length - 1; i += 2) {
        const userMsg = conversation.messages[i]
        const assistantMsg = conversation.messages[i + 1]
        
        if (userMsg?.role === 'user' && assistantMsg?.role === 'assistant') {
          entries.push({
            timestamp: conversation.create_time 
              ? new Date(conversation.create_time * 1000).toISOString()
              : new Date().toISOString(),
            prompt: userMsg.content,
            response: assistantMsg.content,
            model: 'imported'
          })
        }
      }
    }
    
    return entries
  }

  const runTrial = async () => {
    setShowTrialMode(true)
    
    // Test OpenAI connection
    const testPrompt = "Say 'Hello, this is a test!' to confirm the connection is working."
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          apiKey: config.openaiApiKey,
          model: config.model
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      toast.success('✅ OpenAI connection test successful!')
      
      // Test GitHub upload if configured
      if (config.githubToken && config.githubRepo) {
        const testEntry: ChatEntry = {
          timestamp: new Date().toISOString(),
          prompt: testPrompt,
          response: data.response,
          model: data.model
        }
        
        try {
          const githubResponse = await fetch('/api/github/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatHistory: [testEntry],
              githubToken: config.githubToken,
              githubRepo: config.githubRepo
            }),
          })

          if (githubResponse.ok) {
            toast.success('✅ GitHub upload test successful!')
          } else {
            toast.error('❌ GitHub upload test failed')
          }
        } catch (error) {
          toast.error('❌ GitHub upload test failed')
        }
      }
      
      toast.success('Trial completed! All systems are working.')
    } catch (error) {
      toast.error('❌ OpenAI connection test failed. Check your API key.')
    } finally {
      setShowTrialMode(false)
    }
  }

  const simulateInstallation = async () => {
    setIsInstalling(true)
    setInstallProgress(0)
    
    for (let i = 0; i <= 4; i++) {
      setSetupStep(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setInstallProgress((i + 1) * 20)
    }
    
    setIsInstalling(false)
    toast.success('Installation completed successfully!')
  }

  const sendPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a message')
      return
    }
    
    if (!config.openaiApiKey) {
      toast.error('Please configure your OpenAI API key')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          apiKey: config.openaiApiKey,
          model: config.model
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      if (!data.response) {
        throw new Error('No response received from ChatGPT')
      }
      
      const entry: ChatEntry = {
        timestamp: data.timestamp,
        prompt: prompt.trim(),
        response: data.response,
        model: data.model
      }
      
      saveChatEntry(entry)
      setResponse(data.response)
      setPrompt('')
      toast.success('Message sent and logged successfully!')
    } catch (error) {
      console.error('Send prompt error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please check your API key.')
    } finally {
      setIsLoading(false)
    }
  }

  const uploadToGitHub = async () => {
    if (!config.githubToken || !config.githubRepo) {
      toast.error('GitHub configuration is missing')
      return
    }

    if (chatHistory.length === 0) {
      toast.error('No chat history to upload')
      return
    }

    try {
      const response = await fetch('/api/github/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory,
          githubToken: config.githubToken,
          githubRepo: config.githubRepo
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to GitHub')
      }
      
      localStorage.setItem('last-github-upload', data.date)
      setLastUpload(data.date)
      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload to GitHub')
    }
  }

  const toggleScheduler = async () => {
    try {
      const action = schedulerRunning ? 'stop' : 'start'
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          uploadTime: config.uploadTime,
          config: action === 'start' ? {
            githubToken: config.githubToken,
            githubRepo: config.githubRepo
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle scheduler')
      }

      setSchedulerRunning(data.isRunning)
      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle scheduler')
    }
  }

  const exportLogs = () => {
    const today = new Date().toISOString().split('T')[0]
    const dataStr = JSON.stringify(chatHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-logs-${today}.json`
    link.click()
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 text-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <MessageSquare className="w-16 h-16 mx-auto text-blue-400" />
            <h1 className="text-3xl font-bold text-white">ChatGPT Conversation Logger</h1>
            <p className="text-gray-300">Capture, store, and backup your ChatGPT conversations</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-blue-400" />
                Initial Setup
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure your API keys and preferences to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isInstalling && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold">{setupSteps[setupStep]}</h3>
                    <Progress value={installProgress} className="mt-2" />
                  </div>
                </div>
              )}

              {!isInstalling && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={config.openaiApiKey}
                        onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                      <Input
                        id="github-token"
                        type="password"
                        placeholder="ghp_..."
                        value={config.githubToken}
                        onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="github-repo">GitHub Repository</Label>
                      <Input
                        id="github-repo"
                        placeholder="username/chat-history"
                        value={config.githubRepo}
                        onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="upload-time">Daily Upload Time</Label>
                      <Input
                        id="upload-time"
                        type="time"
                        value={config.uploadTime}
                        onChange={(e) => setConfig({ ...config, uploadTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={simulateInstallation} className="flex-1">
                      Install Dependencies & Configure
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => saveConfig(config)}
                      disabled={!config.openaiApiKey || !config.githubToken || !config.githubRepo}
                      className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save Configuration
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Morning Prompt Dialog */}
        {showMorningPrompt && (
          <Alert className="border-blue-600 bg-gray-800 text-white">
            <History className="h-4 w-4 text-blue-400" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Good morning! You have {yesterdayCount} conversations from yesterday. 
                Would you like to copy them to today?
              </span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" onClick={copyYesterdayConversations}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Yesterday's Chats
                </Button>
                <Button size="sm" variant="outline" onClick={dismissMorningPrompt} className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors">
                  Skip
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">ChatGPT Logger</h1>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowGuide(true)}
                    className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    Guide
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open comprehensive user guide and help documentation</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowImportDialog(true)}
                    className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import ChatGPT conversation history from exported JSON files</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={runTrial}
                    disabled={showTrialMode || !config.openaiApiKey}
                    className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {showTrialMode ? 'Testing...' : 'Run Trial'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test your OpenAI and GitHub configuration to ensure everything works</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant={schedulerRunning ? "default" : "secondary"}>
              {schedulerRunning ? "Scheduler Active" : "Scheduler Inactive"}
            </Badge>
            {lastUpload && (
              <Badge variant="outline">
                Last upload: {lastUpload}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-gray-300">Your Message</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Type your message here... (Ctrl/Cmd + Enter to send, Escape to clear)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={sendPrompt} 
                        disabled={!prompt.trim() || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send your message to ChatGPT and automatically log the conversation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {response && (
                  <div className="p-4 bg-gray-900 border border-gray-600 rounded-lg">
                    <Label className="text-sm text-gray-400">Response:</Label>
                    <p className="mt-1 text-white">{response}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Today's Conversations ({chatHistory.length})
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={exportLogs} className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download today's conversations as a JSON file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No conversations yet today</p>
                  ) : (
                    chatHistory.map((entry, index) => (
                      <div key={index} className="border border-gray-600 bg-gray-900 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          {new Date(entry.timestamp).toLocaleTimeString()}
                          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">{entry.model}</Badge>
                        </div>
                        <div className="space-y-1 text-white">
                          <p><strong className="text-blue-400">You:</strong> {entry.prompt}</p>
                          <p><strong className="text-green-400">ChatGPT:</strong> {entry.response}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Github className="w-5 h-5 text-blue-400" />
                  GitHub Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-gray-900 border-gray-600 text-white">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription>
                    Auto-upload scheduled for {config.uploadTime} daily
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="scheduler" className="text-gray-300">Automatic Upload</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          id="scheduler"
                          checked={schedulerRunning}
                          onCheckedChange={toggleScheduler}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enable/disable automatic daily uploads to GitHub at the scheduled time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={uploadToGitHub} 
                        variant="outline" 
                        className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={chatHistory.length === 0}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Now
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Immediately upload today's conversations to your GitHub repository</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {lastUpload && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Last uploaded: {lastUpload}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="model" className="text-gray-300">OpenAI Model</Label>
                  <select
                    id="model"
                    className="w-full p-2 border rounded bg-gray-900 border-gray-600 text-white"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 transition-colors">
                            Edit Configuration
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Update API keys, GitHub settings, upload schedule, and other preferences</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Configuration Settings</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Update your API keys and settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-openai-key" className="text-gray-300">OpenAI API Key</Label>
                        <Input
                          id="edit-openai-key"
                          type="password"
                          value={config.openaiApiKey}
                          onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                          className="bg-gray-900 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-github-token" className="text-gray-300">GitHub Token</Label>
                        <Input
                          id="edit-github-token"
                          type="password"
                          value={config.githubToken}
                          onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                          className="bg-gray-900 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-github-repo" className="text-gray-300">GitHub Repository</Label>
                        <Input
                          id="edit-github-repo"
                          value={config.githubRepo}
                          onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                          className="bg-gray-900 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-upload-time" className="text-gray-300">Upload Time</Label>
                        <Input
                          id="edit-upload-time"
                          type="time"
                          value={config.uploadTime}
                          onChange={(e) => setConfig({ ...config, uploadTime: e.target.value })}
                          className="bg-gray-900 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-chunk-size" className="text-gray-300">Import Chunk Size</Label>
                        <Input
                          id="edit-chunk-size"
                          type="number"
                          min="1"
                          max="50"
                          value={config.maxChunkSize}
                          onChange={(e) => setConfig({ ...config, maxChunkSize: parseInt(e.target.value) || 10 })}
                          className="bg-gray-900 border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">Number of conversations to process at once during import</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="edit-morning-prompt" className="text-gray-300">Morning Prompt</Label>
                        <Switch
                          id="edit-morning-prompt"
                          checked={config.morningPromptEnabled}
                          onCheckedChange={(checked) => setConfig({ ...config, morningPromptEnabled: checked })}
                        />
                      </div>
                      <Button onClick={() => saveConfig(config)} className="w-full bg-blue-600 hover:bg-blue-700">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          localStorage.clear()
                          setIsConfigured(false)
                          setChatHistory([])
                          toast.success('Configuration reset successfully')
                        }}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        Reset Application
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear all data including configuration, chat history, and preferences</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-md bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Import ChatGPT Conversations</DialogTitle>
              <DialogDescription className="text-gray-300">
                Upload your ChatGPT export JSON file to import conversations. Large files will be processed in chunks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!isImporting && (
                <>
                  <div>
                    <Label htmlFor="import-file" className="text-gray-300">Select JSON File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  {importFile && (
                    <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg text-sm">
                      <p><strong className="text-blue-400">File:</strong> {importFile.name}</p>
                      <p><strong className="text-blue-400">Size:</strong> {Math.round(importFile.size / 1024)} KB</p>
                      <p><strong className="text-blue-400">Chunk Size:</strong> {config.maxChunkSize} conversations per batch</p>
                    </div>
                  )}
                </>
              )}
              
              {isImporting && (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-300">Importing conversations...</p>
                    <Progress value={importProgress} className="mt-2" />
                    <p className="text-xs text-gray-400 mt-1">{Math.round(importProgress)}% complete</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={processImportFile}
                  disabled={!importFile || isImporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? 'Importing...' : 'Import Conversations'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                    setImportProgress(0)
                  }}
                  disabled={isImporting}
                  className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comprehensive User Guide Dialog */}
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-blue-400" />
                ChatGPT Logger - Complete User Guide
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Everything you need to know to use the ChatGPT Conversation Logger effectively
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-900">
                  <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">Overview</TabsTrigger>
                  <TabsTrigger value="setup" className="text-white data-[state=active]:bg-blue-600">Setup</TabsTrigger>
                  <TabsTrigger value="features" className="text-white data-[state=active]:bg-blue-600">Features</TabsTrigger>
                  <TabsTrigger value="config" className="text-white data-[state=active]:bg-blue-600">Configuration</TabsTrigger>
                  <TabsTrigger value="troubleshooting" className="text-white data-[state=active]:bg-blue-600">Help</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">What is ChatGPT Logger?</h3>
                    <p>ChatGPT Logger is a comprehensive web application that automatically captures, stores, and backs up your ChatGPT conversations. It provides a seamless interface to interact with ChatGPT while ensuring all your conversations are preserved locally and optionally backed up to GitHub.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Key Benefits</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-blue-400">Automatic Logging:</strong> Every conversation is saved automatically with timestamps</li>
                      <li><strong className="text-blue-400">GitHub Backup:</strong> Schedule daily uploads to preserve your data in the cloud</li>
                      <li><strong className="text-blue-400">Import History:</strong> Bring in your existing ChatGPT conversations from exports</li>
                      <li><strong className="text-blue-400">Daily Organization:</strong> Conversations are organized by date for easy browsing</li>
                      <li><strong className="text-blue-400">Multiple Models:</strong> Support for GPT-3.5, GPT-4, and GPT-4 Turbo</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">How It Works</h3>
                    <p>The application connects directly to OpenAI's API, allowing you to send messages to ChatGPT while automatically logging every conversation. Your data is stored locally in your browser and can be backed up to GitHub for safekeeping.</p>
                  </div>
                </TabsContent>

                <TabsContent value="setup" className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Initial Setup Process</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      <li><strong className="text-blue-400">OpenAI API Key:</strong> Get your API key from <a href="https://platform.openai.com/api-keys" className="text-blue-400 underline" target="_blank">OpenAI Platform</a>. Create a new secret key and copy the full key starting with "sk-"</li>
                      <li><strong className="text-blue-400">GitHub Token (Optional):</strong> Create a Personal Access Token from <a href="https://github.com/settings/tokens" className="text-blue-400 underline" target="_blank">GitHub Settings</a>. Select 'repo' scope for repository access</li>
                      <li><strong className="text-blue-400">GitHub Repository:</strong> Specify your repository in format "username/repository-name". The repository must exist and your token must have write access</li>
                      <li><strong className="text-blue-400">Upload Schedule:</strong> Choose when you want daily automatic uploads to occur (default: 22:00)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Where to Find Configuration Items</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">OpenAI API Key</h4>
                        <p>1. Visit <a href="https://platform.openai.com" className="text-blue-400 underline" target="_blank">OpenAI Platform</a></p>
                        <p>2. Sign in to your account</p>
                        <p>3. Navigate to "API Keys" in the sidebar</p>
                        <p>4. Click "Create new secret key"</p>
                        <p>5. Copy the key (starts with "sk-")</p>
                      </div>
                      
                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">GitHub Personal Access Token</h4>
                        <p>1. Go to <a href="https://github.com/settings/tokens" className="text-blue-400 underline" target="_blank">GitHub Token Settings</a></p>
                        <p>2. Click "Generate new token" → "Generate new token (classic)"</p>
                        <p>3. Give it a descriptive name like "ChatGPT Logger"</p>
                        <p>4. Select "repo" scope (full control of private repositories)</p>
                        <p>5. Click "Generate token" and copy the token (starts with "ghp_")</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Core Features</h3>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Chat Interface
                        </h4>
                        <p>Send messages directly to ChatGPT and receive responses. All conversations are automatically logged with timestamps and model information.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Import JSON
                        </h4>
                        <p>Import your existing ChatGPT conversation history from exported JSON files. Large files are processed in chunks to prevent browser freezing.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          Trial Mode
                        </h4>
                        <p>Test your OpenAI and GitHub configuration to ensure everything is working correctly before regular use.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Morning Prompt
                        </h4>
                        <p>Each morning, automatically get prompted to copy yesterday's conversations to today's session for continuity.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <Github className="w-4 h-4" />
                          GitHub Backup
                        </h4>
                        <p>Automatically upload your daily conversations to GitHub for cloud backup and version control.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Export Data
                        </h4>
                        <p>Download your conversation history as JSON files for backup or analysis purposes.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Configuration Options</h3>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">OpenAI Model Selection</h4>
                        <p>Choose between GPT-3.5 Turbo (faster, cheaper), GPT-4 (more capable), or GPT-4 Turbo (latest version) based on your needs and budget.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">Import Chunk Size</h4>
                        <p>Control how many conversations are processed at once during import (1-50). Lower values prevent browser freezing with large files.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">Morning Prompt</h4>
                        <p>Enable or disable the daily prompt to copy yesterday's conversations. Useful for maintaining conversation context across days.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">Upload Schedule</h4>
                        <p>Set the time for automatic daily uploads to GitHub. The scheduler runs in the background and uploads your conversations automatically.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-blue-400">Automatic Upload Toggle</h4>
                        <p>Enable or disable the scheduler. When enabled, conversations are automatically uploaded to GitHub at the scheduled time.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="troubleshooting" className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Common Issues & Solutions</h3>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-red-400">OpenAI API Error</h4>
                        <p><strong>Problem:</strong> "API key is invalid" or connection errors</p>
                        <p><strong>Solution:</strong> Verify your API key is correct and starts with "sk-". Check your OpenAI account has sufficient credits.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-red-400">GitHub Upload Failed</h4>
                        <p><strong>Problem:</strong> Upload to GitHub fails or returns errors</p>
                        <p><strong>Solution:</strong> Ensure your GitHub token has 'repo' permissions and the repository exists. Check the repository name format is "username/repo-name".</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-red-400">Import Not Working</h4>
                        <p><strong>Problem:</strong> JSON import fails or doesn't load conversations</p>
                        <p><strong>Solution:</strong> Ensure you're using a valid ChatGPT export file. Try reducing the chunk size in settings if the file is very large.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-red-400">Missing Conversations</h4>
                        <p><strong>Problem:</strong> Previous conversations disappeared</p>
                        <p><strong>Solution:</strong> Conversations are stored by date. Check if you're looking at the correct day. Use the export feature to backup your data regularly.</p>
                      </div>

                      <div className="p-3 bg-gray-900 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-red-400">Scheduler Not Working</h4>
                        <p><strong>Problem:</strong> Automatic uploads aren't happening</p>
                        <p><strong>Solution:</strong> Ensure the scheduler is enabled (toggle switch) and your browser tab remains open at the scheduled time. For reliable scheduling, consider keeping the application open.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900 border border-blue-600 rounded-lg">
                    <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Need More Help?
                    </h4>
                    <p>Use the <strong className="text-blue-400">Run Trial</strong> button to test your configuration. This will verify both OpenAI and GitHub connectivity and help identify any setup issues.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
