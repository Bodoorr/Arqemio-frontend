import { useEffect } from "react";
import { toast } from "sonner";
import { SubscribeToNotifications } from "../services/notification";

const NotificationListener = () => {
  useEffect(() => {
    const controller = new AbortController();

    SubscribeToNotifications(controller.signal, (message) => {
      toast(message, {
        description: "Arqemio Notification",
        duration: 5000,
      });
    })?.catch((error) => {
      if (!controller.signal.aborted) {
        console.error("Notification connection failed:", error);
      }
    });

    return () => controller.abort();
  }, []);

  return null;
};

export default NotificationListener;
