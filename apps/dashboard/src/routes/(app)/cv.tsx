import { createFileRoute } from "@tanstack/react-router";
import { api, wsApi } from "@/lib/rpc";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { Cause } from "effect";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/(app)/cv")({
  component: CvBuilderPage,
});

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolInput?: unknown;
}

function CvBuilderPage() {
  const { user } = Route.useRouteContext();
  const userId = user?.id ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{ message: string; assistantId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cv = useAtomValue(
    api.query("cv.get", { userId }, { timeToLive: "1 minute" }),
  );

  const cvId = Result.match(cv, {
    onSuccess: (d) => d.value.id,
    onInitial: () => "",
    onFailure: () => "",
  });

  const pdfPath = Result.match(cv, {
    onSuccess: (d) => d.value.pdfPath,
    onInitial: () => null,
    onFailure: () => null,
  });

  const chatHistory = useAtomValue(
    api.query("cv.getChatHistory", { cvId: cvId || "" }, { timeToLive: "30 seconds" })
  );

  const streamResult = useAtomValue(
    currentMessage && cvId
      ? wsApi.query(
          "cv.chat",
          {
            cvId,
            userId,
            message: currentMessage.message,
          },
          {
            reactivityKeys: [`cv-chat-${currentMessage.assistantId}`],
          }
        )
      : null!
  );

  useEffect(() => {
    if (!cvId || !chatHistory) return;

    Result.match(chatHistory, {
      onSuccess: (data) => {
        if (Array.isArray(data.value)) {
          setMessages(
            data.value.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
            })),
          );
        }
      },
      onInitial: () => {},
      onFailure: () => {},
    });
  }, [cvId, chatHistory]);

  useEffect(() => {
    if (!streamResult || !currentMessage) return;

    console.log("Stream result effect:", streamResult);

    Result.match(streamResult, {
      onSuccess: (data) => {
        console.log("Stream data:", data);
        const chunks = data.value;

        if (!chunks.items || chunks.items.length === 0) return;

        const latestChunk = chunks.items[chunks.items.length - 1];
        if (!latestChunk) return;

        console.log("Latest chunk:", latestChunk);

        if (latestChunk.type === "text" && latestChunk.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessage.assistantId
                ? { ...msg, content: msg.content + latestChunk.content }
                : msg
            )
          );
        } else if (latestChunk.type === "tool_use") {
          const toolMessage: ChatMessage = {
            id: `${Date.now()}-tool-${latestChunk.toolName || "unknown"}`,
            role: "tool",
            content: latestChunk.content,
            ...(latestChunk.toolName && { toolName: latestChunk.toolName }),
            ...(latestChunk.toolInput !== undefined && { toolInput: latestChunk.toolInput }),
          };
          setMessages((prev) => {
            const hasToolMessage = prev.some((m) => m.id === toolMessage.id);
            return hasToolMessage ? prev : [...prev, toolMessage];
          });
        }

        if (chunks.done) {
          console.log("Stream completed");
          setIsStreaming(false);
          setCurrentMessage(null);
        }
      },
      onInitial: () => {
        console.log("Stream initial");
      },
      onFailure: (e) => {
        console.error("Stream error:", e);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentMessage.assistantId
              ? { ...msg, content: `Error: ${Cause.pretty(e.cause)}` }
              : msg
          )
        );
        setIsStreaming(false);
        setCurrentMessage(null);
      },
    });
  }, [streamResult, currentMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    console.log("handleSendMessage called", { inputMessage, cvId, isStreaming });

    if (!inputMessage.trim() || !cvId || isStreaming) {
      console.log("Early return:", { hasInput: !!inputMessage.trim(), hasCvId: !!cvId, isStreaming });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
    };

    console.log("Adding user message:", userMessage);
    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage("");
    setIsStreaming(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    console.log("Setting current message to trigger stream...");
    setCurrentMessage({ message: messageText, assistantId: assistantMessageId });

    setTimeout(() => {
      console.log("Stream timeout");
      setIsStreaming(false);
      setCurrentMessage(null);
    }, 60000);
  };

  return (
    <div className="flex h-screen">
      {/* Chat Panel - Left */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold">CV-byggare</h1>
          <p className="text-sm text-gray-600">
            Chatta med AI för att skapa ditt CV
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>Inga meddelanden ännu.</p>
              <p className="text-sm">
                Börja chatta för att skapa ditt CV!
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "tool" ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-yellow-800">
                      🔧 Tool: {msg.toolName}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-900">{msg.content}</p>
                  {msg.toolInput !== undefined && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-yellow-700">
                        Input
                      </summary>
                      <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-x-auto">
                        {String(JSON.stringify(msg.toolInput, null, 2))}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {isStreaming &&
                    msg.role === "assistant" &&
                    msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                    )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder="Skriv ett meddelande..."
              disabled={isStreaming || !cvId}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !cvId || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStreaming ? "Skickar..." : "Skicka"}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview - Right */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">CV Preview</h2>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {Result.match(cv, {
            onInitial: () => (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Laddar CV...</p>
              </div>
            ),
            onFailure: (e) => (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-600">
                  <p className="font-semibold">Fel vid laddning av CV</p>
                  <p className="text-sm">{Cause.pretty(e.cause)}</p>
                </div>
              </div>
            ),
            onSuccess: () =>
              pdfPath ? (
                <iframe
                  src={`http://localhost:9090${pdfPath}`}
                  className="w-full h-full border-0 rounded-lg shadow-lg"
                  title="CV Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-semibold mb-2">
                      Inget CV genererat ännu
                    </p>
                    <p className="text-sm">
                      Börja chatta med AI:n för att skapa ditt CV!
                    </p>
                  </div>
                </div>
              ),
          })}
        </div>
      </div>
    </div>
  );
}
