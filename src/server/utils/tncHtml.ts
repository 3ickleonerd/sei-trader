import { renderMarkdown } from "../../../docs/render.ts";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

interface TncPageOptions {
  theme?: "light" | "dark";
  onAcceptUrl?: string;
  onDeclineUrl?: string;
  title?: string;
}

export function generateTncHtml(options: TncPageOptions = {}): string {
  const {
    theme = "light",
    onAcceptUrl = "/api/accept-tnc",
    onDeclineUrl = "/api/decline-tnc",
    title = "Terms & Conditions - Caret Sei Trading Bot",
  } = options;

  // Get the latest TNC file
  const latestTncPath = getLatestTncFile();

  // Render the markdown content
  const tncContent = renderMarkdown(latestTncPath, {
    theme,
    maxWidth: "900px",
    fontSize: "16px",
  });

  const isDark = theme === "dark";
  const bgColor = isDark ? "#0f172a" : "#f8fafc";
  const textColor = isDark ? "#e2e8f0" : "#334155";
  const buttonBg = isDark ? "#1e293b" : "#ffffff";
  const buttonBorder = isDark ? "#334155" : "#e2e8f0";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            line-height: 1.6;
            min-height: 100vh;
            padding: 2rem 1rem;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: ${isDark ? "#f1f5f9" : "#1e293b"};
        }
        
        .header p {
            font-size: 1.125rem;
            color: ${isDark ? "#94a3b8" : "#64748b"};
        }
        
        .tnc-content {
            margin-bottom: 3rem;
        }
        
        .actions {
            position: sticky;
            bottom: 0;
            background-color: ${
              isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(248, 250, 252, 0.95)"
            };
            backdrop-filter: blur(10px);
            border-top: 1px solid ${isDark ? "#334155" : "#e2e8f0"};
            padding: 1.5rem 0;
            margin: 0 -1rem;
        }
        
        .actions-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 0.875rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            border: 2px solid;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 160px;
            justify-content: center;
        }
        
        .btn-accept {
            background-color: #22c55e;
            border-color: #22c55e;
            color: white;
        }
        
        .btn-accept:hover {
            background-color: #16a34a;
            border-color: #16a34a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        
        .btn-decline {
            background-color: ${buttonBg};
            border-color: ${buttonBorder};
            color: ${isDark ? "#e2e8f0" : "#475569"};
        }
        
        .btn-decline:hover {
            background-color: ${isDark ? "#334155" : "#f1f5f9"};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${
              isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"
            };
        }
        
        .version-info {
            text-align: center;
            margin-top: 1rem;
            font-size: 0.875rem;
            color: ${isDark ? "#64748b" : "#94a3b8"};
        }
        
        @media (max-width: 640px) {
            body {
                padding: 1rem 0.5rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .btn {
                min-width: 140px;
                padding: 0.75rem 1.5rem;
            }
            
            .actions-container {
                flex-direction: column;
                align-items: center;
            }
        }
        
        .scroll-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background-color: ${isDark ? "#1e293b" : "#e2e8f0"};
            z-index: 100;
        }
        
        .scroll-progress {
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #3b82f6);
            width: 0%;
            transition: width 0.1s ease;
        }
    </style>
</head>
<body>
    <div class="scroll-indicator">
        <div class="scroll-progress" id="scrollProgress"></div>
    </div>
    
    <div class="container">
        <div class="header">
            <h1>Terms & Conditions</h1>
            <p>Please read and accept our terms to continue using Caret Sei Trading Bot</p>
        </div>
        
        <div class="tnc-content">
            ${tncContent}
        </div>
    </div>
    
    <div class="actions">
        <div class="actions-container">
            <a href="${onAcceptUrl}" class="btn btn-accept" onclick="handleAccept(event)">
                ✓ I Accept These Terms
            </a>
            <a href="${onDeclineUrl}" class="btn btn-decline" onclick="handleDecline(event)">
                ✗ I Decline
            </a>
        </div>
        <div class="version-info">
            Document Version: ${latestTncPath} • Last Updated: ${getCurrentDate()}
        </div>
    </div>

    <script>
        // Scroll progress indicator
        function updateScrollProgress() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            document.getElementById('scrollProgress').style.width = scrollPercent + '%';
        }
        
        window.addEventListener('scroll', updateScrollProgress);
        
        // Handle accept/decline actions
        function handleAccept(event) {
            event.preventDefault();
            
            // Store acceptance in localStorage
            localStorage.setItem('tnc_accepted', JSON.stringify({
                version: '${latestTncPath}',
                timestamp: new Date().toISOString(),
                accepted: true
            }));
            
            // Send to server
            fetch('${onAcceptUrl}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: '${latestTncPath}',
                    accepted: true,
                    timestamp: new Date().toISOString()
                })
            }).then(response => {
                if (response.ok) {
                    // Redirect or show success message
                    window.location.href = '/dashboard';
                } else {
                    alert('Failed to save acceptance. Please try again.');
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('Failed to save acceptance. Please try again.');
            });
        }
        
        function handleDecline(event) {
            event.preventDefault();
            
            if (confirm('Are you sure you want to decline the terms? You will not be able to use the platform.')) {
                // Send decline to server
                fetch('${onDeclineUrl}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        version: '${latestTncPath}',
                        accepted: false,
                        timestamp: new Date().toISOString()
                    })
                }).then(() => {
                    window.location.href = '/';
                });
            }
        }
        
        // Auto-scroll to bottom on mobile for better UX
        if (window.innerWidth <= 640) {
            let hasScrolledToBottom = false;
            
            window.addEventListener('scroll', function() {
                const scrollTop = window.pageYOffset;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                
                if (scrollTop >= docHeight * 0.8 && !hasScrolledToBottom) {
                    hasScrolledToBottom = true;
                    document.querySelector('.btn-accept').style.animation = 'pulse 2s infinite';
                }
            });
        }
    </script>
    
    <style>
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    </style>
</body>
</html>`;
}

function getLatestTncFile(): string {
  try {
    const tncDir = join(__dirname, "../../../docs/tnc");
    const files = readdirSync(tncDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const match = file.match(/^(\d+)\.md$/);
        return match ? { file, version: parseInt(match[1]) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.version - a!.version);

    if (files.length === 0) {
      throw new Error("No TNC files found");
    }

    return `tnc/${files[0]!.file.replace(".md", "")}`;
  } catch (error) {
    // Fallback to known file
    return "tnc/1";
  }
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Export helper functions for API endpoints
export function createAcceptanceRecord(version: string, userId?: string) {
  return {
    version,
    userId,
    accepted: true,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
    ip: null, // Should be filled by the server
  };
}

// Usage example:
// const html = generateTncHtml({
//   theme: 'light',
//   onAcceptUrl: '/api/tnc/accept',
//   onDeclineUrl: '/api/tnc/decline'
// });
