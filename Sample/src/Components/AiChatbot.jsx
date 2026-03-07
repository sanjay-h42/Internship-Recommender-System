// AiChatbot.jsx
// Floating AI Career Advisor chatbot – only visible to logged-in users.
// Powered by: open-ai21.p.rapidapi.com
// Scope: Career guidance + internship/job form-fill help ONLY.
//        Off-topic requests are rejected via system prompt.

import { useState, useRef, useEffect } from "react";

// 🔑 Using environment variables for RapidAPI
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "API_KEY";
const RAPIDAPI_HOST = "open-ai21.p.rapidapi.com";

const SYSTEM_PROMPT = `You are CareerBot, a specialized AI assistant embedded inside an Internship & Job Recommender application.

Your ONLY job is to:
1. Provide career guidance — resume tips, interview advice, skill recommendations, career path planning, salary insights, industry trends.
2. Help the user fill in the internship/job search form — suggest appropriate values for these fields: Job/Internship Role, Location (Indian cities), Skills, Sector of Interest, Mode of Work (Full Time / Part Time), Minimum Salary/Stipend.

STRICT RULES:
- If the user's message is NOT related to careers, job searching, internships, resume writing, interview prep, or filling the search form, you MUST respond with exactly: "I'm CareerBot — I can only help with career guidance and filling the internship/job search form. Please ask me something related to your career or job search! 🚀"
- Never answer general knowledge, math, coding problems, entertainment, or any non-career topic.
- Keep responses concise, friendly, and actionable.
- Always encourage the user to use the search form with specific parameters when relevant.
- When suggesting form values, format them clearly with labels like: Role: "Data Science Intern", Location: "Bangalore", Skills: "Python, ML", Sector: "Data & Analytics".`;

function AiChatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            from: "bot",
            text: "Hi! I'm CareerBot 🤖 — your AI career advisor.\n\nI can help you with:\n• Career guidance & resume tips\n• Interview preparation\n• Filling the search form\n• Skill recommendations\n\nWhat can I help you with today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Focus input when chat opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isTyping) return;

        const userMsg = { from: "user", text: trimmed };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        try {
            // Build conversation history format for the API
            const apiMessages = [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
                    .filter((m) => m.from === "user" || m.from === "bot")
                    .map((m) => ({
                        role: m.from === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                { role: "user", content: trimmed }
            ];

            const response = await fetch(`https://${RAPIDAPI_HOST}/conversationllama`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": RAPIDAPI_HOST,
                },
                body: JSON.stringify({
                    messages: apiMessages,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // open-ai21 /chatgpt returns: { result: "..." }
            const botReply =
                data?.result ||
                data?.message ||
                data?.choices?.[0]?.message?.content ||
                "I'm sorry, I couldn't process that. Please try again.";

            setMessages((prev) => [...prev, { from: "bot", text: botReply }]);
        } catch (err) {
            console.error("CareerBot API error:", err);
            setMessages((prev) => [
                ...prev,
                {
                    from: "bot",
                    text: "⚠️ I'm having trouble connecting right now. Please check your internet connection or try again in a moment.",
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* 💬 Floating Action Button */}
            <button
                className={`chatbot-fab ${open ? "chatbot-fab--open" : ""}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Toggle CareerBot"
                title="Chat with CareerBot"
            >
                {open ? (
                    <span className="chatbot-fab-icon">✕</span>
                ) : (
                    <span className="chatbot-fab-icon">💬</span>
                )}
                {!open && <span className="chatbot-fab-label">CareerBot</span>}
            </button>

            {/* 🗨️ Chat Window */}
            {open && (
                <div className="chatbot-window" role="dialog" aria-label="CareerBot Chat">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">🤖</div>
                            <div>
                                <div className="chatbot-header-name">CareerBot</div>
                                <div className="chatbot-header-status">
                                    <span className="chatbot-status-dot" />
                                    Career & Form-Fill Advisor
                                </div>
                            </div>
                        </div>
                        <button
                            className="chatbot-close-btn"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`chatbot-msg chatbot-msg--${msg.from}`}
                            >
                                {msg.from === "bot" && (
                                    <div className="chatbot-msg-avatar">🤖</div>
                                )}
                                <div className="chatbot-msg-bubble">
                                    {msg.text.split("\n").map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {j < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="chatbot-msg chatbot-msg--bot">
                                <div className="chatbot-msg-avatar">🤖</div>
                                <div className="chatbot-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Row */}
                    <div className="chatbot-input-row">
                        <textarea
                            ref={inputRef}
                            className="chatbot-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me about careers or form help..."
                            rows={1}
                            disabled={isTyping}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={sendMessage}
                            disabled={isTyping || !input.trim()}
                            aria-label="Send message"
                        >
                            ➤
                        </button>
                    </div>
                    <div className="chatbot-footer">
                        Press <kbd>Enter</kbd> to send • <kbd>Shift+Enter</kbd> for new line
                    </div>
                </div>
            )}
        </>
    );
}

export default AiChatbot;
