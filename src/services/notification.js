import { fetchEventSource } from "@microsoft/fetch-event-source";

export const SubscribeToNotifications = (signal, onNotification) => {
  const token = localStorage.getItem("token");

  if (!token) return;

  return fetchEventSource(
    `${import.meta.env.VITE_API_URL}/notifications/subscribe`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
      openWhenHidden: true,

      async onopen(response) {
        if (!response.ok) {
          throw new Error("Unable to connect to notifications.");
        }
      },

      onmessage(event) {
        if (event.data) {
          onNotification(event.data);
        }
      },

      onerror(error) {
        throw error;
      },
    },
  );
};
