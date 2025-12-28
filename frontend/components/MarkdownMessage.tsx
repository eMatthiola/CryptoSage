'use client'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  // Enhanced markdown-to-HTML conversion
  const formatContent = (text: string) => {
    if (!text) return ''

    // Split into lines for better processing
    let lines = text.split('\n')
    let html = ''
    let inList = false

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // Headers (must be at start of line)
      if (line.match(/^######\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h6 class="text-base font-semibold mt-4 mb-2 text-[#1d1e22]">${line.replace(/^######\s+/, '')}</h6>`
      } else if (line.match(/^#####\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h5 class="text-lg font-semibold mt-4 mb-2 text-[#1d1e22]">${line.replace(/^#####\s+/, '')}</h5>`
      } else if (line.match(/^####\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h4 class="text-lg font-semibold mt-4 mb-2 text-[#1d1e22]">${line.replace(/^####\s+/, '')}</h4>`
      } else if (line.match(/^###\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h3 class="text-xl font-semibold mt-4 mb-2 text-[#1d1e22]">${line.replace(/^###\s+/, '')}</h3>`
      } else if (line.match(/^##\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h2 class="text-xl font-semibold mt-5 mb-3 text-[#1d1e22]">${line.replace(/^##\s+/, '')}</h2>`
      } else if (line.match(/^#\s+(.+)$/)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h1 class="text-2xl font-bold mt-5 mb-3 text-[#1d1e22]">${line.replace(/^#\s+/, '')}</h1>`
      }
      // Bullet lists
      else if (line.match(/^[-*]\s+(.+)$/)) {
        if (!inList) { html += '<ul class="list-none space-y-1 my-2">'; inList = true }
        const content = line.replace(/^[-*]\s+/, '')
        html += `<li class="ml-4 flex items-start"><span class="mr-2 text-gray-500">•</span><span>${formatInline(content)}</span></li>`
      }
      // Numbered lists
      else if (line.match(/^(\d+)\.\s+(.+)$/)) {
        if (inList && html.includes('<ul')) { html += '</ul>'; inList = false }
        if (!inList) { html += '<ol class="list-none space-y-1 my-2">'; inList = true }
        const match = line.match(/^(\d+)\.\s+(.+)$/)
        if (match) {
          html += `<li class="ml-4 flex items-start"><span class="mr-2 text-gray-500 font-medium">${match[1]}.</span><span>${formatInline(match[2])}</span></li>`
        }
      }
      // Empty line
      else if (line.trim() === '') {
        if (inList) { html += inList ? (html.includes('<ol') ? '</ol>' : '</ul>') : ''; inList = false }
        html += '<div class="h-3"></div>'
      }
      // Regular paragraph
      else {
        if (inList) { html += inList ? (html.includes('<ol') ? '</ol>' : '</ul>') : ''; inList = false }
        html += `<p class="my-2 leading-7">${formatInline(line)}</p>`
      }
    }

    // Close any open list
    if (inList) {
      html += html.includes('<ol') ? '</ol>' : '</ul>'
    }

    return html
  }

  // Format inline elements (bold, code, etc.)
  const formatInline = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#1d1e22]">$1</strong>')

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-[#f6f4f2] text-[#ff8e5e] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')

    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-[#ff8e5e] hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')

    return text
  }

  return (
    <div
      className={`message-content ${isUser ? 'user-message' : 'ai-message'} text-eleken-text`}
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      style={{
        lineHeight: '1.7',
        wordBreak: 'break-word',
        fontSize: '16px'
      }}
    />
  )
}

export default MarkdownMessage
