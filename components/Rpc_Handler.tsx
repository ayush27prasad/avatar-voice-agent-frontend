import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { toastAlert } from "@/components/alert-toast";

export function RpcHandlers() {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleShowNotification = async (data: any): Promise<string> => {
      try {
        if (!data || data.payload === undefined) {
          return "Error: Invalid RPC data format";
        }
        const payload = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
        const notificationType = payload?.type;

        if (typeof notificationType !== "string" || notificationType.trim() === "") {
          return "Error: Invalid or missing notification type";
        }

        if (notificationType === "tool_call") {
          window.dispatchEvent(new CustomEvent("lk-tool-event", { detail: payload }));
          toastAlert({
            title: `Tool call: ${payload?.tool ?? "unknown"}`,
            description: `Status: ${payload?.status ?? "ok"}`,
          });
          return "Tool event delivered";
        }

        if (notificationType === "call_summary") {
          window.dispatchEvent(new CustomEvent("lk-call-summary", { detail: payload }));
          toastAlert({
            title: "Call summary ready",
            description: "Review the summary before the conversation ends.",
          });
          return "Summary delivered";
        }

        return "Error: Unknown notification type";
      } catch (err) {
        return "Error: " + (err instanceof Error ? err.message : String(err));
      }
    };

    room.localParticipant.registerRpcMethod("client.showNotification", handleShowNotification);

    return () => {
      room.localParticipant.unregisterRpcMethod("client.showNotification");
    };
  }, [room]);

  return null;
}