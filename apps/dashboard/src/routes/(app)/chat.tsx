import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "@effect-atom/atom-react";
import { api } from "@/lib/rpc";

export const Route = createFileRoute("/(app)/chat")({
  component: Chat,
});

type Message = {
  role: string;
  content: string;
};

function Chat() {
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [input, setInput] = useState("");
  const [streamAtom, setStreamAtom] = useState<ReturnType<
    typeof api.query<"chat.stream">
  > | null>(null);

  const sendMessage = useCallback(
    (userMessage: string) => {
      if (!userMessage.trim() || streamAtom) {
        return;
      }

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setInput("");

      const atom = api.query("chat.stream", { message: userMessage });
      setStreamAtom(atom);
    },
    [streamAtom],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-screen flex-col p-4">
      <h1 className="mb-4 font-bold text-2xl">AI Chat</h1>

      <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded border p-4">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}-${msg.content.substring(0, 10)}`}
            className={`rounded p-3 ${
              msg.role === "user"
                ? "ml-auto max-w-[80%] bg-blue-100"
                : "mr-auto max-w-[80%] bg-gray-100"
            }`}
          >
            <div className="font-semibold text-gray-600 text-xs">
              {msg.role === "user" ? "Du" : "AI"}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {streamAtom && (
          <StreamingMessage
            streamAtom={streamAtom}
            onComplete={(content) => {
              setMessages((prev) => [...prev, { role: "assistant", content }]);
              setStreamAtom(null);
            }}
            onError={(error) => {
              setMessages((prev) => [...prev, { role: "assistant", content: error }]);
              setStreamAtom(null);
            }}
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv ett meddelande..."
          disabled={!!streamAtom}
          className="flex-1 rounded border p-2 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!!streamAtom || !input.trim()}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
        >
          {streamAtom ? "Skickar..." : "Skicka"}
        </button>
      </form>
    </div>
  );
}

function StreamingMessage({
  streamAtom,
  onComplete,
  onError,
}: {
  streamAtom: ReturnType<typeof api.query<"chat.stream">>;
  onComplete: (content: string) => void;
  onError: (error: string) => void;
}) {
  const [result, pull] = useAtom(streamAtom);

  // Auto-pull next chunk
  useEffect(() => {
    if (result._tag === "Success") {
      const { done, items } = result.value;

      if (done) {
        onComplete(items.map((item) => item.content).join(""));
      } else if (!result.waiting) {
        pull();
      }
    } else if (result._tag === "Failure") {
      onError(`Fel: ${result.cause}`);
    }
  }, [result, pull, onComplete, onError]);

  // Render accumulated items
  if (result._tag === "Success") {
    return (
      <div className="mr-auto max-w-[80%] rounded bg-gray-100 p-3">
        <div className="font-semibold text-gray-600 text-xs">AI</div>
        <div className="whitespace-pre-wrap">
          {result.value.items.map((item) => item.content).join("")}
        </div>
      </div>
    );
  }

  return (
    <div className="mr-auto max-w-[80%] rounded bg-gray-100 p-3">
      <div className="font-semibold text-gray-600 text-xs">AI</div>
      <div className="whitespace-pre-wrap">...</div>
    </div>
  );
}
