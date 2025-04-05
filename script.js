document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const modelSelect = document.getElementById('model-select');
    
    // OpenRouter API key and endpoint
    const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
    // You'll need to replace this with your actual API key
    const API_KEY = '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';
    
    // Model information
    const modelInfo = {
        'qwen/qwen-2.5-coder-32b-instruct:free': {
            displayName: 'Qwen 2.5 Coder',
            description: 'Specialized for coding tasks and technical discussions.',
            themeClass: 'qwen-theme'
        },
        'deepseek/deepseek-r1:free': {
            displayName: 'DeepSeek R1',
            description: 'General purpose AI assistant with strong reasoning capabilities.',
            themeClass: 'deepseek-theme'
        }
    };
    
    // Set initial theme
    updateModelTheme(modelSelect.value);
    
    // Auto-resize textarea based on content
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.scrollHeight > 150) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
    
    // Send message when Enter key is pressed (without Shift)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send message when Send button is clicked
    sendButton.addEventListener('click', sendMessage);
    
    // Handle model change
    modelSelect.addEventListener('change', function() {
        const selectedModel = this.value;
        updateModelTheme(selectedModel);
        showModelInfo(selectedModel);
    });
    
    // Update UI theme based on selected model
    function updateModelTheme(model) {
        // Remove all theme classes
        for (const key in modelInfo) {
            document.body.classList.remove(modelInfo[key].themeClass);
        }
        
        // Add current theme class
        document.body.classList.add(modelInfo[model].themeClass);
    }
    
    // Show model info message
    function showModelInfo(model) {
        const info = modelInfo[model];
        
        addMessageToChat('bot', `<div class="model-info-content">
            <p><strong>Model switched to:</strong> ${info.displayName}</p>
            <p><i class="fas fa-info-circle"></i> ${info.description}</p>
        </div>`, 'model-info-message');
    }
    
    // Function to send message
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input field and reset height
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Show typing indicator
        addTypingIndicator();
        
        // Get selected model
        const selectedModel = modelSelect.value;
        
        // Send message to OpenRouter API
        fetchAIResponse(message, selectedModel);
    }
    
    // Function to add message to chat
    function addMessageToChat(sender, content, extraClass = '') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        
        // Format message content (detect code blocks with ```code```)
        const formattedContent = formatMessageContent(content);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        if (extraClass) {
            messageContent.classList.add(extraClass);
        }
        messageContent.innerHTML = formattedContent;
        
        // Add copy button for AI responses
        if (sender === 'bot') {
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-button');
            copyButton.innerText = 'Copy';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(content).then(() => {
                    alert('Copied to clipboard!');
                });
            };
            messageContent.appendChild(copyButton);
        }
        
        messageElement.appendChild(messageContent);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Function to format message content
    function formatMessageContent(content) {
        // Check if content already has HTML (for model info messages)
        if (content.startsWith('<div class="model-info-content">')) {
            return content;
        }
        
        // Basic Markdown-like formatting
        
        // Replace code blocks (```code```)
        content = content.replace(/```([\s\S]*?)```/g, function(match, codeBlock) {
            // Try to detect language from the first line
            const firstLine = codeBlock.trim().split('\n')[0].toLowerCase();
            const codeContent = firstLine.match(/^(javascript|python|java|html|css|c\+\+|c#|ruby|php|go|rust|swift|kotlin|typescript)$/i) 
                ? codeBlock.substring(firstLine.length).trim() 
                : codeBlock;
                
            return `<pre>${codeContent}</pre>`;
        });
        
        // Replace inline code (`code`)
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Replace line breaks with <br>
        content = content.replace(/\n/g, '<br>');
        
        // If no HTML tags were added, wrap in paragraph
        if (!content.includes('<pre>') && !content.includes('<br>')) {
            content = `<p>${content}</p>`;
        } else if (!content.startsWith('<p>')) {
            content = `<p>${content}</p>`;
        }
        
        return content;
    }
    
    // Function to add typing indicator
    function addTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'bot');
        typingElement.innerHTML = `
            <div class="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        typingElement.id = 'typing-indicator';
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to fetch AI response
    async function fetchAIResponse(message, model) {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                    'HTTP-Referer': window.location.origin
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: message
                        }
                    ]
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content;
                addMessageToChat('bot', aiResponse);
            } else {
                addMessageToChat('bot', 'Sorry, I encountered an issue. Please try again.');
                console.error('Invalid response:', data);
            }
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator();
            
            console.error('Error:', error);
            addMessageToChat('bot', 'Sorry, there was an error connecting to the AI service. Please check your API key and try again.');
        }
    }
});