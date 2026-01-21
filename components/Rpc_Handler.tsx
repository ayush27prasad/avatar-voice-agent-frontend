import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Info,
  CalendarCheck,
  Phone,
  ListChecks 
} from '@phosphor-icons/react/dist/ssr';

type RpcData = {
  payload?: string | Record<string, unknown>;
};

const TOOL_COLORS = {
  identify_user: { bg: 'bg-blue-500', icon: Phone },
  fetch_slots: { bg: 'bg-purple-500', icon: ListChecks },
  book_appointment: { bg: 'bg-green-500', icon: CalendarCheck },
  retrieve_appointments: { bg: 'bg-cyan-500', icon: ListChecks },
  cancel_appointment: { bg: 'bg-orange-500', icon: XCircle },
  modify_appointment: { bg: 'bg-amber-500', icon: Clock },
  end_conversation: { bg: 'bg-gray-500', icon: CheckCircle },
};

const STATUS_ICONS = {
  identified: CheckCircle,
  listed: ListChecks,
  booked: CalendarCheck,
  retrieved: ListChecks,
  cancelled: XCircle,
  modified: Clock,
  conflict: XCircle,
  not_found: Info,
  summary_sent: CheckCircle,
};

export function RpcHandlers() {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleShowNotification = async (data: RpcData): Promise<string> => {
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
          
          const toolName = payload?.tool ?? "unknown";
          const status = payload?.status ?? "ok";
          const isError = status === "conflict" || status === "not_found";
          
          const toolConfig = TOOL_COLORS[toolName as keyof typeof TOOL_COLORS];
          const IconComponent = toolConfig?.icon || Info;
          
          // Use different toast types based on status
          if (isError) {
            toast.error(`${toolName}: ${status}`, {
              description: `Tool encountered an issue`,
              icon: <XCircle size={20} weight="bold" />,
            });
          } else {
            toast.success(`${toolName}`, {
              description: `Status: ${status}`,
              icon: <IconComponent size={20} weight="bold" />,
            });
          }
          return "Tool event delivered";
        }

        if (notificationType === "call_summary") {
          window.dispatchEvent(new CustomEvent("lk-call-summary", { detail: payload }));
          toast.info("Call Summary Ready", {
            description: "Review your conversation summary",
            icon: <CheckCircle size={20} weight="bold" />,
            duration: 15000,
          });
          return "Summary delivered";
        }

        if (notificationType === "user_data") {
          const data = payload?.data || {};
          const phone = data?.phone ?? "unknown";
          const name = data?.name ?? "unknown";
          const source = data?.source ?? "unknown";

          toast.success("User data received", {
            description: `Phone: ${phone}, Name: ${name} (${source})`,
            icon: <Phone size={20} weight="bold" />,
          });
          return "User data delivered";
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