import { createFileRoute } from "@tanstack/react-router";
import { Cause } from "effect";
import { api } from "@/lib/rpc";
import { Result, useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { useState } from "react";

export const Route = createFileRoute("/(app)/cv-test")({
  component: CvTestPage,
});

function CvTestPage() {
  const { user } = Route.useRouteContext();
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sendChat = useAtomSet(api.mutation("cv.chat"));

  const userId = user?.id ?? "";

  const cv = useAtomValue(
    api.query("cv.get", { userId }, { timeToLive: "5 minutes" }),
  );

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const cvId = Result.match(cv, {
      onSuccess: (d) => d.value.id,
      onInitial: () => "",
      onFailure: () => "",
    });

    if (!cvId) {
      setChatResponse("Error: CV not loaded yet");
      return;
    }

    setIsLoading(true);
    setChatResponse(null);

    try {
      await sendChat({
        payload: {
          cvId,
          userId,
          message: message,
        },
        reactivityKeys: ["cv"],
      });

      setChatResponse("Message sent successfully! Check the CV for updates.");
    } catch (error) {
      setChatResponse(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }

    setMessage("");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">CV Builder Test</h1>

      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">CV Data</h2>
        {Result.match(cv, {
          onInitial: () => <div>Laddar CV...</div>,
          onFailure: (e) => (
            <div className="text-red-600">Fel: {Cause.pretty(e.cause)}</div>
          ),
          onSuccess: (d) => (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {d.value.id}
              </p>
              <p>
                <strong>User ID:</strong> {d.value.userId}
              </p>
              <p>
                <strong>PDF Path:</strong> {d.value.pdfPath || "Ingen PDF ännu"}
              </p>
            </div>
          ),
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Testa Chat</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Skriv ett meddelande till AI-assistenten..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Skickar..." : "Skicka"}
          </button>
        </div>
        {chatResponse && (
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm font-semibold mb-2">AI Response:</p>
            <p className="whitespace-pre-wrap">{chatResponse}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Detta är en testsida för CV-byggaren. Skicka meddelanden till
          AI-assistenten för att testa backend-integration.
        </p>
      </div>
    </div>
  );
}
