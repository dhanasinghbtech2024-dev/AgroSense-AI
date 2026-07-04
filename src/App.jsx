import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

const AGENT_SYSTEM_PROMPT = `You are AgroSense AI — an intelligent crop advisory and pest risk assistant for Indian smallholder farmers.

You operate as an agentic system with three specialized modules:
1. 🌾 CROP ADVISOR — Gives advice on crop health, growth stages, soil, and fertilizers
2. 🐛 PEST DIAGNOSTICIAN — Identifies pest/disease symptoms and recommends remedies
3. 🌦 SEASONAL RISK ALERT — Warns about seasonal risks, weather-related threats, and preventive measures

BEHAVIOR:
- At the start of every response, on its own line, output exactly one of: [AGENT: CROP ADVISOR], [AGENT: PEST DIAGNOSTICIAN], or [AGENT: SEASONAL RISK ALERT] — based on what the farmer needs most.
- Then give a clear, practical, actionable response. Use simple language a farmer can act on.
- Reference your "knowledge base" naturally (e.g., "Based on documented patterns for Rajasthan's kharif season..." or "Our pest database shows...") to simulate RAG retrieval.
- Keep responses focused and under 200 words.
- Be warm, respectful, and farmer-first. Mention specific Indian crops, pests, seasons, and regions when relevant.
- End each response with one follow-up question to continue the advisory.`;

const KNOWLEDGE_BASE_TAGS = [
  "ICAR Crop Guidelines",
  "IMD Seasonal Data",
  "Pest Resistance Patterns",
  "Soil Health Cards",
  "PM-KISAN Advisory",
  "State Agri Dept Reports"
];

const SAMPLE_QUERIES = [
  "My wheat leaves are turning yellow at the tips",
  "When should I sow mustard in Rajasthan?",
  "I see white flies on my cotton crop",
  "What fertilizer for rice during flowering stage?",
  "Heavy rain forecast — how to protect my vegetables?"
];

const AGENT_COLORS = {
  "CROP ADVISOR": { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32", icon: "🌾" },
  "PEST DIAGNOSTICIAN": { bg: "#FFF8E1", border: "#FF8F00", text: "#E65100", icon: "🐛" },
  "SEASONAL RISK ALERT": { bg: "#E3F2FD", border: "#1976D2", text: "#0D47A1", icon: "🌦" }
};

function parseAgent(text) {
  const match = text.match(/\[AGENT:\s*(CROP ADVISOR|PEST DIAGNOSTICIAN|SEASONAL RISK ALERT)\]/);
  const agentName = match ? match[1] : "CROP ADVISOR";
  const cleaned = text.replace(/\[AGENT:[^\]]+\]\s*/, "").trim();
  return { agentName, cleaned };
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px" }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#4CAF50",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>
  );
}

function RAGBadge({ tags }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
      <span style={{ fontSize: 10, color: "#888", marginRight: 4, lineHeight: "20px" }}>📚 Sources:</span>
      {tags.map(t => (
        <span
          key={t}
          style={{
            fontSize: 10,
            background: "#F1F8E9",
            border: "1px solid #C5E1A5",
            borderRadius: 10,
            padding: "2px 8px",
            color: "#558B2F"
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div
          style={{
            maxWidth: "72%",
            background: "#1B5E20",
            color: "#fff",
            borderRadius: "18px 18px 4px 18px",
            padding: "12px 16px",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  const { agentName, cleaned } = parseAgent(msg.content);
  const colors = AGENT_COLORS[agentName] || AGENT_COLORS["CROP ADVISOR"];
  const ragTags = msg.ragTags || [];

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: colors.border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
          marginTop: 2
        }}
      >
        {colors.icon}
      </div>
      <div style={{ maxWidth: "78%" }}>
        <div
          style={{
            display: "inline-block",
            background: colors.bg,
            border: `1.5px solid ${colors.border}`,
            borderRadius: "4px 18px 18px 18px",
            padding: "12px 16px",
            fontSize: 14,
            lineHeight: 1.7,
            color: "#222",
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: colors.text,
              letterSpacing: 1,
              marginBottom: 6,
              textTransform: "uppercase"
            }}
          >
            {colors.icon} {agentName}
          </div>
          {cleaned}
          {ragTags.length > 0 && <RAGBadge tags={ragTags} />}
        </div>
      </div>
    </div>
  );
}

export default function AgroSenseAI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "[AGENT: CROP ADVISOR] Namaste! I'm AgroSense AI — your intelligent crop advisory assistant. I can help you with crop health, pest diagnosis, and seasonal risk alerts.\n\nTell me about your crop, location, or the problem you're facing — and I'll pull from our agricultural knowledge base to give you the best guidance.\n\nWhat are you growing this season?",
      ragTags: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const bottomRef = useRef(null);
  const history = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    history.current.push({ role: "user", content: userMsg });

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: AGENT_SYSTEM_PROMPT
      });

      const contents = history.current.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const result = await model.generateContent({ contents });
      const reply = result.response.text() || "Sorry, I couldn't process that.";
      history.current.push({ role: "assistant", content: reply });
      const { agentName } = parseAgent(reply);
      setActiveAgent(agentName);

      // Pick 2-3 random RAG tags to simulate retrieval
      const shuffled = [...KNOWLEDGE_BASE_TAGS].sort(() => 0.5 - Math.random());
      const ragTags = shuffled.slice(0, 3);
      setMessages(prev => [...prev, { role: "assistant", content: reply, ragTags }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "[AGENT: CROP ADVISOR] Sorry, I'm having trouble connecting right now. Please try again.",
          ragTags: []
        }
      ]);
    }
    setLoading(false);
  }

  const agentStats = [
    { name: "Crop Advisor", icon: "🌾", count: messages.filter(m => m.content?.includes("CROP ADVISOR")).length },
    { name: "Pest Diagnostician", icon: "🐛", count: messages.filter(m => m.content?.includes("PEST DIAGNOSTICIAN")).length },
    { name: "Seasonal Risk", icon: "🌦", count: messages.filter(m => m.content?.includes("SEASONAL RISK")).length }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9FBF7",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes bounce { 0%,80%,100% {transform:translateY(0)} 40% {transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-enter { animation: fadeIn 0.3s ease forwards; }
        .send-btn:hover { background: #2E7D32 !important; }
        .sample-btn:hover { background: #E8F5E9 !important; border-color: #4CAF50 !important; }
        textarea:focus { outline: none; border-color: #4CAF50 !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "#1B5E20",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#4CAF50",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20
            }}
          >
            🌱
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>AgroSense AI</div>
            <div style={{ color: "#A5D6A7", fontSize: 11 }}>RAG-Powered Crop Advisory System</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {agentStats.map(a => (
            <div
              key={a.name}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 11,
                color: "#C8E6C9",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>{a.icon}</span>
              <span style={{ fontWeight: 600 }}>{a.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SDG Banner */}
      <div
        style={{
          background: "#E8F5E9",
          borderBottom: "1px solid #C8E6C9",
          padding: "6px 24px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 11, color: "#558B2F", fontWeight: 600 }}>SDG ALIGNED:</span>
        {["🎯 SDG 2 — Zero Hunger", "🌿 SDG 15 — Life on Land", "☀️ SDG 13 — Climate Action"].map(s => (
          <span
            key={s}
            style={{
              fontSize: 11,
              background: "#fff",
              border: "1px solid #A5D6A7",
              borderRadius: 20,
              padding: "2px 10px",
              color: "#2E7D32"
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-enter">
                <Message msg={msg} />
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#4CAF50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18
                  }}
                >
                  🌱
                </div>
                <div
                  style={{
                    background: "#E8F5E9",
                    border: "1.5px solid #4CAF50",
                    borderRadius: "4px 18px 18px 18px"
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sample queries */}
          {messages.length <= 2 && (
            <div style={{ padding: "0 24px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#888", width: "100%", marginBottom: 2 }}>Try asking:</span>
              {SAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  className="sample-btn"
                  onClick={() => sendMessage(q)}
                  style={{
                    background: "#fff",
                    border: "1px solid #C8E6C9",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12,
                    color: "#2E7D32",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "12px 24px 16px",
              borderTop: "1px solid #E0E0E0",
              background: "#fff",
              display: "flex",
              gap: 10,
              alignItems: "flex-end"
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe your crop problem or ask for advice..."
              rows={2}
              style={{
                flex: 1,
                border: "1.5px solid #E0E0E0",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 14,
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                color: "#222",
                background: "#FAFAFA",
                transition: "border-color 0.2s"
              }}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: "#388E3C",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: "all 0.2s",
                height: 48
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: 220,
            borderLeft: "1px solid #E0E0E0",
            background: "#fff",
            padding: 16,
            overflowY: "auto",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 12 }}>
            AGENTIC MODULES
          </div>

          {Object.entries(AGENT_COLORS).map(([name, c]) => (
            <div
              key={name}
              style={{
                background: c.bg,
                border: `1.5px solid ${c.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 8
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{name}</div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                {name === "CROP ADVISOR" && "Growth, soil, nutrients"}
                {name === "PEST DIAGNOSTICIAN" && "Disease & pest ID"}
                {name === "SEASONAL RISK ALERT" && "Weather & seasonal risks"}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, margin: "16px 0 8px" }}>
            KNOWLEDGE BASE
          </div>
          {KNOWLEDGE_BASE_TAGS.map(t => (
            <div
              key={t}
              style={{
                fontSize: 10,
                color: "#558B2F",
                background: "#F1F8E9",
                border: "1px solid #C5E1A5",
                borderRadius: 6,
                padding: "4px 8px",
                marginBottom: 4
              }}
            >
              📄 {t}
            </div>
          ))}

          <div
            style={{
              marginTop: 16,
              background: "#FFF8E1",
              border: "1px solid #FFD54F",
              borderRadius: 10,
              padding: 10
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "#F57F17", marginBottom: 4 }}>
              ⚠️ RESPONSIBLE AI
            </div>
            <div style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>
              Advice is AI-generated. Consult local Krishi Sevak for critical decisions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
