import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import mammoth from "mammoth";
import TurndownService from "turndown";
import supabase from '../utils/supabaseInit';

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
const PROMPT_ID = "00000000-0000-0000-0000-000000000001";

const defaultPrompt = `You are an expert blog auditor...`; // Truncated for brevity

const BlogAnalysisPage: React.FC = () => {
  const [blogContent, setBlogContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [fileName, setFileName] = useState("");
  // const [fileType, setFileType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promptText, setPromptText] = useState(defaultPrompt);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPromptEditor, setShowPromptEditor] = useState(true);

  const [googleDocId, setGoogleDocId] = useState("");

  const turndownService = new TurndownService();

  
  useEffect(() => {
    const fetchPrompt = async () => {
      const { data,  } = await supabase
        .from("blog_analysis_prompts")
        .select("content")
        .eq("id", PROMPT_ID)
        .single();

      if (data?.content) {
        setPromptText(data.content);
      }
    };

    fetchPrompt();
  }, []);

  const savePromptToSupabase = async () => {
    if (!promptText.includes("${blogContent}")) {
      return; // silently block save
    }

    const { error } = await supabase
      .from("blog_analysis_prompts")
      .upsert([{ id: PROMPT_ID, content: promptText }]);

    if (error) {
      alert(" Failed to save prompt");
      console.error(error);
    } else {
      alert(" Prompt saved");
    }
  };

const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFileName(file.name);
  setGoogleDocId(""); // ✅ Clear Google Doc input box

  const reader = new FileReader();

  if (file.name.endsWith(".docx")) {
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const markdown = turndownService.turndown(result.value);
        setBlogContent(markdown);
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
    setLoadingText("Analyzing blog content in chunks...");
    setSummary("");

    try {
      const apiUrl =
        import.meta.env.MODE === "production"
          ? import.meta.env.VITE_PROD_AI_BLOG_ANALYSIS
          : import.meta.env.VITE_LOCAL_AI_BLOG_ANALYSIS;

      const MAX_CHARS = 20000;
      const chunks: string[] = [];

      for (let i = 0; i < blogContent.length; i += MAX_CHARS) {
        chunks.push(blogContent.slice(i, i + MAX_CHARS));
      }

      const chunkAudits: string[] = [];

      for (const [idx, chunk] of chunks.entries()) {
        setLoadingText(`Analyzing chunk ${idx + 1} of ${chunks.length}...`);
        const auditPrompt = promptText.replace("${blogContent}", chunk);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: auditPrompt }],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const auditText = data.choices?.[0]?.message?.content?.trim();
        if (!auditText) throw new Error("Audit failed for chunk");
        chunkAudits.push(`--- Audit for chunk ${idx + 1} ---\n${auditText}`);
      }

      setLoadingText("Combining chunk audits into unified report...");
      const combinedAuditsText = chunkAudits.join("\n\n");

      const combinePrompt = `
You have been provided multiple audit sections for different parts of a single blog post:

${combinedAuditsText}

Please combine all these partial audits into ONE comprehensive, coherent audit report.  
Make sure the report is well-structured, non-repetitive, and provides actionable insights covering the whole blog.

Return only the combined audit report.`;

      const combineResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: combinePrompt }],
          temperature: 0.7,
        }),
      });

      const combineData = await combineResponse.json();
      const finalAudit = combineData.choices?.[0]?.message?.content?.trim();
      if (!finalAudit) throw new Error("Failed to combine audits");

      setSummary(finalAudit);
    } catch (err) {
      console.error("AI analysis failed:", err);
      alert("AI analysis failed. Please check your backend or token limits.");
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

  const extractDocId = (input: string) => {
    const match = input.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };


  const fetchGoogleDocContent = async () => {
    if (!googleDocId.trim()) {
      alert("Please enter a Google Doc ID.");
      return;
    }

    const cleanDocId = extractDocId(googleDocId.trim());

    if (!cleanDocId) {
      alert("Invalid Google Doc URL or ID.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Fetching Google Doc content...");

    try {
      const apiUrl =
        import.meta.env.MODE === "production"
          ? import.meta.env.VITE_PROD_AI_BLOG_ANALYSIS
          : import.meta.env.VITE_LOCAL_AI_BLOG_ANALYSIS;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: cleanDocId }), // 👈 Use extracted ID
      });


      const data = await response.json();

      if (data.error) {
        alert("Failed to fetch Google Doc: " + data.error);
        return;
      }

      setBlogContent(data.content || "");
      setFileName(`Google Doc: ${cleanDocId}`);
      setGoogleDocId(""); // ✅ Clear the input field
      if (fileInputRef.current) fileInputRef.current.value = ""; // ✅ Clear file upload
    } catch (error) {
      alert("Error fetching Google Doc content.");
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };


  useEffect(() => {
    if (googleDocId.trim()) {
      fetchGoogleDocContent();
    }
  }, [googleDocId]);

  
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "2.8rem", fontWeight: "700", marginBottom: "1rem" }}>
        Blog Audit & AI Ranking Optimization
      </h1>

      <div className="flex justify-between items-baseline gap-6">
        {/* Upload & Analyze Buttons */}
        <div className="flex justify-center flex-col items-center w-full">
          <div className="w-[500px]">
            <div>

                {fileName && (
                <span
                  title={fileName}
                  className="dark:!text-white truncate block"
                  style={{
                    maxWidth: "500px",
                    fontSize: "15px",
                    color: "#555",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span className="font-extrabold">File to Analyze: </span><span>{fileName}</span>
                </span>
                )}
              <div style={{ marginBottom: ".2rem" }}>
                <input type="text" name="fakeusernameremembered" style={{ display: "none" }} autoComplete="username" />
                <input type="password" name="fakepasswordremembered" style={{ display: "none" }} autoComplete="current-password" />

                <input
                  type="text"
                  name="google-doc-id"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter Google Doc ID"
                  value={googleDocId}
                  onChange={(e) => setGoogleDocId(e.target.value)}
                  disabled={isLoading}
                  style={{ padding: "8px", fontSize: "16px", width: "300px", marginRight: "1rem" }}
                  className="!w-full"
                />


              </div>
              <div className="flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="mx-4 text-gray-500">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>

              <div 
                style={{
                  marginBottom: "1rem",
                  marginTop: ".2rem"
                }}
              >
              <input
                type="file"
                accept=".txt,.md,.docx"
                onChange={handleFileUpload}
                disabled={isLoading } 
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="!w-full hover:!bg-blue-1000"
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 28px",
                  border: "none",
                  borderRadius: 6,
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  userSelect: "none",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Upload Blog File
              </button>
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
                className="!w-full hover:!bg-green-100"
              >
                {isLoading ? "Analyzing..." : "Analyze with AI"}
              </button>
            </div>
          </div>
        </div>
        {/* Prompt Editor with Save to Supabase */}
        <div className="w-full">
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
                }}
              >
                Unlock Prompt Editor
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowPromptEditor((prev) => !prev)}
                className="hover:!bg-blue-1000"
                style={{ ...blueButton, marginBottom: "0.5rem" }}
                type="button"
              >
                {showPromptEditor ? "Hide Prompt Editor" : "Show Prompt Editor"}
              </button>

              {showPromptEditor && (
                <div style={{ marginBottom: "1rem", position: "relative" }}>
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="prompt-editor"
                      style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}
                    >
                      Edit AI Prompt
                    </label>
                    {/* Tooltip */}
                    {!promptText.includes("${blogContent}") && (
                      <div
                        style={{
                          left: 0,
                          backgroundColor: "#f87171",
                          color: "#fff",
                          padding: "8px 12px",
                          borderRadius: 6,
                          fontSize: "14px",
                          fontWeight: "500",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          zIndex: 10,
                        }}
                      >
                        ⚠️ Prompt must include <code>${"{blogContent}"}</code>
                      </div>
                    )}
                  </div>

                  <textarea
                    id="prompt-editor"
                    rows={14}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    disabled={isLoading}
                    className="text-black dark:!border-2 dark:!border-white mt-4"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      borderRadius: 6,
                      border: "2px solid black",
                      whiteSpace: "pre-wrap",
                      resize: "vertical",
                      minHeight: 320,
                    }}
                  />

                  <button
                    onClick={savePromptToSupabase}
                    disabled={isLoading || !promptText.includes("${blogContent}")}
                    className="hover:!bg-black-200"
                    style={{
                      ...greenButton,
                      backgroundColor: !promptText.includes("${blogContent}") ? "#9ca3af" : "#334155",
                      cursor: !promptText.includes("${blogContent}") ? "not-allowed" : "pointer",
                      marginTop: "0.5rem",
                    }}
                  >
                    Update Prompt
                  </button>
                </div>
              )}

            </>
          )}
        </div>
      </div>



      {/* Loading Text */}
      {loadingText && (
        <p style={{ color: "#444", fontStyle: "italic", marginTop: 8 }}
        className="dark:!text-white text-center">
          {loadingText}
        </p>
      )}

      {/* Summary Output */}
      {summary && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Original Blog Content */}
          <div className="border-4 border-[#c0c0c0] rounded-xl p-4 bg-white dark:!text-black">
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "0.5rem" }}>
              📄 Original Blog Content
            </h2>
            <div style={outputBlock}>
              <pre style={preStyle}>{blogContent.trim() || "No blog content uploaded."}</pre>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="border-4 border-[#facc15] rounded-xl p-4 bg-white">
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#92400e",
              }}
            >
              💡 AI Suggestions for Improvement
            </h2>
            <div style={{ ...outputBlock, backgroundColor: "#fffbea" }}>
              <pre style={preStyle}>{summary.trim() || "No suggestions yet."}</pre>
            </div>
            <button onClick={copyToClipboard} style={greenButton} className="mt-5">
              Copy Suggestions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAnalysisPage;

