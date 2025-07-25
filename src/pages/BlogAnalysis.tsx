import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import mammoth from "mammoth";

const MAX_CHARS = 3500;

const greenButton: React.CSSProperties = {
  backgroundColor: "#10b981",
  color: "white",
  padding: "10px 24px",
  border: "none",
  borderRadius: 6,
  fontSize: "16px",
  cursor: "pointer",
  marginBottom: "1rem",
  fontWeight: "600",
  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
  transition: "background-color 0.2s ease",
};

const blueButton: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "white",
  padding: "10px 24px",
  border: "none",
  borderRadius: 6,
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "1rem",
  fontWeight: "600",
  boxShadow: "0 4px 6px rgba(37, 99, 235, 0.3)",
  transition: "background-color 0.2s ease",
};

const outputBlock: React.CSSProperties = {
  backgroundColor: "#f9f9f9",
  padding: "1rem",
  borderRadius: "8px",
  marginTop: "1.5rem",
  maxHeight: "500px",
  overflowY: "auto",
  textAlign: "justify",
  fontSize: "15px",
  lineHeight: 1.5,
  color: "#222",
};

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  margin: 0,
};

const PASSWORD = "V8#qLp9z@4eT!rW2";

const defaultPrompt = `
You are an expert blog auditor helping blogs rank #1 in AI-generated answers (ChatGPT, Gemini, Claude, Perplexity).

Please analyze the entire blog content below and respond in a natural audit format with paragraph explanations and section headers, like:

---

I reviewed the blog post titled "[Blog Title or Topic]." Here's the audit based on your request:

1. Main Topic Addressing  
[Clearly explain whether the post answers the topic. Mention if the answer is early.]

2. LLM Compatibility  
[Explain if LLMs like ChatGPT could extract answers easily.]

3. Missing or Underdeveloped Info  
[Mention any missing data, context, subtopics, legal/safety resources, or audience-specific advice.]

4. Optimization for Top AI Search Engines  
[Recommendations on headings, intro clarity, internal linking, keyword use, and content structure.]

5. Final Suggestions  
[Summarize the actionable advice to make the post AI-optimized.]

---

Please format your response using markdown-style paragraph breaks and readable section titles.

--- BEGIN BLOG CONTENT ---
\${blogContent}
--- END BLOG CONTENT ---
`.trim();

const BlogAnalysisPage: React.FC = () => {
  const [blogContent, setBlogContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prompt editor state & password protection
  const [promptText, setPromptText] = useState(defaultPrompt);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // NEW: toggle visibility for prompt editor
  const [showPromptEditor, setShowPromptEditor] = useState(true);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    if (file.name.endsWith(".docx")) {
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setBlogContent(result.value);
        } catch {
          alert("Failed to parse DOCX file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        setBlogContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const analyzeContent = async () => {
    if (!blogContent.trim()) {
      alert("Please upload a document first.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Preparing content for analysis...");
    setSummary("");

    try {
      const prompt = promptText.replace("${blogContent}", blogContent);

      const apiUrl =
        import.meta.env.MODE === "production"
          ? import.meta.env.VITE_PROD_AI_BLOG_ANALYSIS
          : import.meta.env.VITE_LOCAL_AI_BLOG_ANALYSIS;

      setLoadingText("Analyzing full blog content...");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`API error: ${error.error?.message || "Unknown error"}`);
        setIsLoading(false);
        setLoadingText("");
        return;
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content?.trim() || "";

      const displayResult = `
--- Original Blog Content ---
${blogContent}

--- Suggestions from AI Analysis ---
${analysis}
      `.trim();

      setSummary(displayResult);
    } catch (err) {
      console.error("Error:", err);
      alert("AI analysis failed. Please check your backend.");
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    alert("📋 Summary copied to clipboard!");
  };

  const handlePasswordUnlock = () => {
    if (passwordInput === PASSWORD) {
      setPromptUnlocked(true);
      setPasswordInput("");
    } else {
      alert("❌ Incorrect password.");
    }
  };

  const onPasswordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePasswordUnlock();
    }
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: "justify",
        lineHeight: 1.6,
        color: "#333",
      }}
    >
      <h1
        style={{
          fontSize: "2.8rem",
          fontWeight: "700",
          marginBottom: "1rem",
        }}
        className="dark:text-white"
      >
        Blog Audit & AI Ranking Optimization
      </h1>

      <div className="flex justify-between">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <input
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleFileUpload}
              disabled={isLoading}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "12px 28px",
                border: "none",
                borderRadius: 6,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                userSelect: "none",
              }}
              aria-label="Upload blog file"
            >
              Upload Blog File
            </button>
            {fileName && (
              <span
                title={fileName}
                style={{
                  maxWidth: "300px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "15px",
                  color: "#555",
                }}
                className="dark:!text-white"
              >
                {fileName}
              </span>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={analyzeContent}
            style={{
              ...greenButton,
              opacity: isLoading || !blogContent ? 0.6 : 1,
              cursor: isLoading || !blogContent ? "not-allowed" : "pointer",
            }}
            disabled={isLoading || !blogContent}
          >
            {isLoading ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>
      </div>

      {/* Prompt editor with password protection */}
      <div style={{ marginTop: "1rem" }}>
        {!promptUnlocked ? (
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="password"
              placeholder="Enter prompt editor password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={onPasswordKeyDown}
              disabled={isLoading}
              style={{
                padding: "8px 12px",
                fontSize: "16px",
                borderRadius: 6,
                border: "1px solid #ccc",
                width: "300px",
              }}
            />
            <button
              onClick={handlePasswordUnlock}
              disabled={isLoading}
              style={{
                ...greenButton,
                marginLeft: "0.5rem",
                padding: "8px 20px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Unlock Prompt Editor
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowPromptEditor((prev) => !prev)}
              style={{
                ...blueButton,
                marginBottom: "0.5rem",
              }}
              type="button"
            >
              {showPromptEditor ? "Hide Prompt Editor" : "Show Prompt Editor"}
            </button>

            {showPromptEditor && (
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="prompt-editor"
                  style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}
                  className="dark:!text-white"
                >
                  Edit AI Prompt
                </label>
                <textarea
                  id="prompt-editor"
                  rows={14}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isLoading}
                  className="dark:!border-4 dark:!border-white"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    borderRadius: 6,
                    border: "4px solid black",
                    whiteSpace: "pre-wrap",
                    resize: "vertical",
                    minHeight: 320,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {loadingText && (
        <p
          style={{ color: "#444", fontStyle: "italic", marginTop: 8 }}
          className="text-center dark:!text-white"
        >
          {loadingText}
        </p>
      )}

      {summary && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Original Content Block */}
            <div className="border-4 border-[#c0c0c0] rounded-xl p-4 bg-white dark:bg-[#0a1a31]">
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  color: "#444",
                }}
                className="dark:!text-white"
              >
                📄 Original Blog Content
              </h2>
              <div style={outputBlock}>
                <pre style={preStyle}>
                  {summary
                    .split("--- Suggestions from AI Analysis ---")[0]
                    .replace("--- Original Blog Content ---", "")
                    .trim()}
                </pre>
              </div>
            </div>

            {/* Suggestions Block */}
            <div className="border-4 border-[#facc15] rounded-xl p-4 bg-white dark:bg-[#232104]">
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  color: "#92400e",
                }}
                className="dark:!text-yellow-300"
              >
                💡 AI Suggestions for Improvement
              </h2>
              <div style={{ ...outputBlock, backgroundColor: "#fffbea" }}>
                <pre style={preStyle}>
                  {summary.split("--- Suggestions from AI Analysis ---")[1]?.trim()}
                </pre>
              </div>
              <button onClick={copyToClipboard} style={blueButton}>
                Copy Suggestions
              </button>
            </div>
          </div>

          {/* Revised Version Block */}
          <div className="border-4 border-[#34d399] mt-6 rounded-xl p-4 bg-white dark:bg-[#032519]">
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#065f46",
              }}
              className="dark:!text-green-300"
            >
              📝 Updated Blog Version (with AI Suggestions Applied)
            </h2>
            <div style={outputBlock}>
              <pre style={preStyle}>{summary}</pre>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary);
                alert("📋 Updated blog version copied to clipboard!");
              }}
              style={{ ...blueButton, marginTop: "1rem" }}
            >
              Copy Updated Version
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BlogAnalysisPage;
