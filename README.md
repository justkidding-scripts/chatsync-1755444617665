# ChatGPT Conversation Logger

A comprehensive web application that captures, stores, and automatically backs up your ChatGPT conversations to GitHub. Features a beautiful GUI with an installation wizard and automated scheduling system.

## Features

### 🎯 Core Functionality
- **Real-time Chat Interface**: Send messages to ChatGPT and receive responses through the OpenAI API
- **Automatic Logging**: All conversations are automatically saved with timestamps and model information
- **Daily Organization**: Chat logs are organized by date for easy retrieval
- **Local Storage**: Conversations are stored locally in your browser
- **Export Functionality**: Download daily chat logs as JSON files
- **Morning Prompt**: Automatic prompt each morning to copy yesterday's conversations
- **JSON Import**: Import existing ChatGPT conversation exports with chunked processing
- **Trial Mode**: Test your configuration to verify OpenAI and GitHub connectivity

### 🔧 Setup & Configuration
- **Installation Wizard**: Guided setup process with progress indicators
- **API Key Management**: Secure handling of OpenAI and GitHub credentials
- **Multiple Configuration Options**: Set up via environment variables or in-app interface
- **Model Selection**: Choose between GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo

### 📊 GitHub Integration
- **Automatic Backups**: Schedule daily uploads of chat histories to GitHub repositories
- **Manual Uploads**: Instantly upload current day's conversations
- **Repository Management**: Organize logs in a structured format in your GitHub repo
- **Upload Tracking**: Monitor last upload dates and scheduler status

### ⏰ Scheduling System
- **Automated Daily Uploads**: Set custom time for automatic GitHub uploads
- **Scheduler Management**: Start/stop scheduler with real-time status updates
- **Background Processing**: Non-intrusive automatic operations
- **Upload History**: Track when uploads were last performed

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and professional styling
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Real-time Notifications**: Toast messages for all user actions
- **Progress Tracking**: Visual feedback for installations and uploads
- **Intuitive Navigation**: Clean, organized interface with clear sections

## Quick Start

### 1. Environment Setup (Optional)
You can configure API keys via environment variables or through the application interface:

```bash
# Optional: Set environment variables
OPENAI_API_KEY=sk-your-openai-key
GITHUB_TOKEN=ghp_your-github-token
GITHUB_REPO=username/repository-name
```

### 2. Installation
```bash
# Install dependencies
npm install
# or
bun install

# Run development server
npm run dev
# or
bun dev
```

### 3. Configuration
1. Open the application in your browser
2. Complete the installation wizard:
   - Enter your OpenAI API key
   - Add your GitHub Personal Access Token
   - Specify your GitHub repository
   - Set your preferred upload time
3. Click "Install Dependencies & Configure"
4. Save your configuration

### 4. Usage
- **Send Messages**: Type in the chat interface and get responses from ChatGPT
- **View History**: Browse today's conversations in the history panel
- **Upload to GitHub**: Use manual upload or enable automatic scheduling
- **Export Data**: Download conversation logs as JSON files
- **Import Conversations**: Upload ChatGPT export JSON files to import historical conversations
- **Morning Workflow**: Each morning, get prompted to copy yesterday's conversations to today
- **Trial Testing**: Run connectivity tests to verify your OpenAI and GitHub configuration
- **Manage Settings**: Update configuration anytime through the settings panel

## API Endpoints

### Chat API
- `POST /api/chat` - Send prompts to OpenAI and receive responses
- Requires: `prompt`, `apiKey`, `model`
- Returns: `response`, `model`, `timestamp`

### GitHub Upload API
- `POST /api/github/upload` - Upload chat history to GitHub
- Requires: `chatHistory`, `githubToken`, `githubRepo`
- Returns: `success`, `url`, `message`, `date`

### Scheduler API
- `GET /api/scheduler` - Get scheduler status
- `POST /api/scheduler` - Control scheduler (start/stop/status)
- Actions: `start`, `stop`, `status`

## New Features

### 📅 Morning Prompt
Each morning when you open the application, you'll be prompted to copy yesterday's conversations:
- Automatically detects if you have conversations from the previous day
- One-click copying of all yesterday's conversations to today's session
- Can be enabled/disabled in settings
- Remembers if you've already been prompted today

### 📂 ChatGPT JSON Import
Import your existing ChatGPT conversation history:
- Supports ChatGPT export JSON format
- Handles both new mapping format and legacy message format
- Chunked processing to prevent UI freezing on large files
- Configurable chunk size (1-50 conversations per batch)
- Progress indicator during import
- Automatically organizes imported conversations by date

### 🧪 Trial Mode
Test your configuration before regular use:
- Tests OpenAI API connectivity with a sample prompt
- Verifies GitHub upload functionality if configured
- Provides clear success/failure feedback
- Helps troubleshoot configuration issues

## Configuration Options

### OpenAI API Key
Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys):
1. Create a new secret key
2. Copy the `sk-...` key
3. Add to environment variables or app interface

### GitHub Token
Create a Personal Access Token from [GitHub Settings](https://github.com/settings/tokens):
1. Generate new token
2. Select 'repo' scope for repository access
3. Copy the `ghp_...` token
4. Add to environment variables or app interface

### GitHub Repository
Specify repository in format `username/repository-name`:
- Example: `john/chat-history`
- Repository must exist and token must have write access
- Logs will be stored in `logs/YYYY-MM-DD.json` format

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **APIs**: OpenAI API, GitHub API
- **Storage**: Local Storage (browser-based)

## File Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # OpenAI integration
│   │   ├── github/upload/route.ts  # GitHub upload functionality
│   │   └── scheduler/route.ts      # Automated scheduling
│   ├── layout.tsx                  # Root layout with toaster
│   └── page.tsx                    # Main application interface
├── lib/
│   └── env-config.ts              # Environment variable configuration
└── components/ui/                  # UI component library
```

## Data Format

Chat entries are stored in the following format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "prompt": "User's question or message",
  "response": "ChatGPT's response",
  "model": "gpt-3.5-turbo"
}
```

## Security Notes

- API keys are handled securely and never exposed in client-side code
- All API calls are routed through secure server endpoints
- Local storage is used for client-side data persistence
- GitHub uploads use authenticated API calls with proper error handling

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check environment variables
# Visit /env-check in your browser
```

## Production Deployment

For production deployment, consider:
1. Setting up proper environment variables
2. Implementing database storage instead of localStorage
3. Adding user authentication and authorization
4. Setting up actual cron jobs for scheduled uploads
5. Adding rate limiting and error monitoring

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, create an issue in the GitHub repository or refer to the documentation above.

## 📚 Comprehensive User Guide

### Getting Your API Keys and Tokens

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign in to your account or create one
3. Navigate to "API Keys" in the sidebar
4. Click "Create new secret key"
5. Give it a descriptive name (e.g., "ChatGPT Logger")
6. Copy the entire key (starts with "sk-")
7. **Important**: Store this key securely - you won't be able to see it again

#### GitHub Personal Access Token
1. Go to [GitHub Token Settings](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name like "ChatGPT Logger"
4. Set expiration (recommend "No expiration" for convenience)
5. Select scopes:
   - ✅ **repo** (Full control of private repositories) - This is required
6. Click "Generate token"
7. Copy the token immediately (starts with "ghp_")

#### GitHub Repository Setup
1. Create a new repository on GitHub or use an existing one
2. The repository can be private or public
3. Note the format: `username/repository-name` (e.g., `john/chat-history`)
4. Your GitHub token must have write access to this repository

### Interface Guide

#### Dark Theme Interface
The application features a modern dark theme with:
- **Gray/Black Color Scheme**: Professional dark background with blue accents
- **High Contrast Text**: White text on dark backgrounds for excellent readability
- **Color-Coded Elements**: Blue for actions, green for success, yellow for warnings, red for errors

#### Button Tooltips
Every button in the interface includes helpful tooltips when you hover over them:
- **Guide Button**: Opens this comprehensive user guide
- **Import JSON**: Import ChatGPT conversation history from exported files
- **Run Trial**: Test your configuration to ensure everything works
- **Send Message**: Send your message to ChatGPT and log the conversation
- **Export**: Download today's conversations as a JSON file
- **Upload Now**: Immediately upload conversations to GitHub
- **Edit Configuration**: Update API keys and settings
- **Reset Application**: Clear all data and start fresh

### Feature Deep Dive

#### 💬 Chat Interface
- **Real-time Communication**: Direct connection to OpenAI's API
- **Model Selection**: Choose between GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo
- **Automatic Logging**: Every conversation is saved with timestamps
- **Response Display**: See ChatGPT's response immediately below your message

#### 📥 Import Functionality
- **Supported Formats**: ChatGPT export JSON files (both new and legacy formats)
- **Chunked Processing**: Large files are processed in configurable chunks (1-50 conversations)
- **Progress Tracking**: Real-time progress bar during import
- **Date Organization**: Imported conversations are automatically sorted by their original dates
- **Smart Parsing**: Automatically detects conversation structure

#### 🧪 Trial Mode
- **OpenAI Test**: Sends a test message to verify API connectivity
- **GitHub Test**: Tests upload functionality if configured
- **Visual Feedback**: Clear success/failure indicators
- **Non-destructive**: Tests don't affect your regular conversation history

#### 📅 Morning Prompt System
- **Automatic Detection**: Checks for conversations from the previous day
- **Smart Prompting**: Only shows if yesterday had conversations and you haven't been prompted today
- **One-Click Copy**: Copy all of yesterday's conversations to today
- **Configurable**: Can be enabled/disabled in settings

#### ☁️ GitHub Backup
- **Automatic Scheduling**: Set a daily time for automatic uploads
- **Manual Upload**: Upload current conversations immediately
- **Structured Storage**: Files are saved as `logs/YYYY-MM-DD.json`
- **Upload Tracking**: See when you last uploaded and scheduler status

### Configuration Options Explained

#### OpenAI Model Selection
- **GPT-3.5 Turbo**: Fastest and most cost-effective option
- **GPT-4**: More capable but slower and more expensive
- **GPT-4 Turbo**: Latest version with improved capabilities

#### Import Settings
- **Chunk Size (1-50)**: Number of conversations processed at once during import
- Lower values (1-10): Slower but prevents browser freezing with very large files
- Higher values (20-50): Faster processing for smaller files

#### Schedule Settings
- **Upload Time**: Set the daily time for automatic GitHub uploads
- **Automatic Upload Toggle**: Enable/disable the scheduler
- **Morning Prompt**: Enable/disable the daily prompt to copy yesterday's conversations

### Troubleshooting Guide

#### Common Issues and Solutions

**❌ "Invalid API Key" Error**
- **Cause**: Incorrect or expired OpenAI API key
- **Solution**: 
  1. Verify your API key starts with "sk-"
  2. Check your OpenAI account billing and usage limits
  3. Generate a new API key if needed
  4. Ensure you have sufficient credits in your OpenAI account

**❌ GitHub Upload Fails**
- **Cause**: Incorrect GitHub token or repository settings
- **Solution**:
  1. Verify your token starts with "ghp_"
  2. Check the repository format is "username/repo-name"
  3. Ensure the repository exists
  4. Verify your token has "repo" scope permissions
  5. Check if the repository is private and your token has access

**❌ Import Not Working**
- **Cause**: Invalid JSON file or browser memory issues
- **Solution**:
  1. Ensure you're using a ChatGPT export file
  2. Try reducing chunk size to 5-10 for large files
  3. Check the JSON file isn't corrupted
  4. Close other browser tabs to free memory

**❌ Conversations Disappeared**
- **Cause**: Looking at wrong date or browser data cleared
- **Solution**:
  1. Check you're viewing the correct date
  2. Use export feature regularly for backups
  3. Check if browser storage was cleared
  4. Import from GitHub backup if available

**❌ Scheduler Not Working**
- **Cause**: Browser tab closed or system sleeping
- **Solution**:
  1. Keep the browser tab open at scheduled time
  2. Check scheduler toggle is enabled
  3. Verify upload time is set correctly
  4. Consider manual uploads as backup

#### Performance Tips
- **Large Imports**: Use chunk size 5-10 for files over 10MB
- **Memory Management**: Close other browser tabs during large operations
- **Backup Strategy**: Export conversations regularly and enable GitHub backup
- **Browser Compatibility**: Works best in Chrome, Firefox, Safari, or Edge

### Data Management

#### Local Storage
- Conversations are stored in your browser's local storage
- Data is organized by date (YYYY-MM-DD format)
- Each day's conversations are stored separately
- Browser storage has size limits (usually 5-10MB)

#### Export Options
- **JSON Format**: Standard format compatible with other tools
- **Daily Export**: Download specific day's conversations
- **Backup Strategy**: Regular exports recommended for data safety

#### GitHub Integration
- **File Structure**: `logs/YYYY-MM-DD.json` in your repository
- **Version Control**: Track changes to your conversation history
- **Cloud Backup**: Secure offsite storage of your data
- **Access Control**: Use private repositories for sensitive conversations

### Security and Privacy

#### Data Protection
- **Local Storage**: Conversations stored locally in your browser
- **API Keys**: Never exposed in client-side code
- **Secure Transmission**: All API calls use HTTPS
- **No Server Storage**: No conversations stored on external servers

#### Best Practices
- **API Key Security**: Never share your OpenAI API key
- **Repository Privacy**: Use private GitHub repositories for sensitive data
- **Regular Backups**: Export data regularly in case of browser issues
- **Token Management**: Rotate GitHub tokens periodically for security