// Pusher-compatible adapter that no-ops safely without credentials.
import Pusher from "pusher";

export const pusherServer =
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true
      })
    : null;

export async function publishEvent(channel: string, event: string, payload: unknown) {
  if (!pusherServer) return { delivered: false };
  await pusherServer.trigger(channel, event, payload);
  return { delivered: true };
}
