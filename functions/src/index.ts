import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

type MessageData = {
  senderId?: string;
  type?: string;
  text?: string | null;
  isDeleted?: boolean;
  forwarded?: boolean;
  chatId?: string;
};

function resolveRecipientId(chatId: string, senderId: string): string | null {
  const parts = chatId.split("_");
  if (parts.length !== 2) return null;
  if (parts[0] === senderId) return parts[1];
  if (parts[1] === senderId) return parts[0];
  return null;
}

function buildBody(data: MessageData): string {
  if (data.forwarded) return "Bir mesaj iletildi";
  switch (data.type) {
    case "image":
      return "📸 Fotoğraf";
    case "audio":
      return "🎙️ Sesli mesaj";
    case "file":
      return "📎 Dosya";
    case "text":
    default:
      return (data.text || "").trim() || "Yeni mesaj";
  }
}

async function sendExpoPush(params: {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<{ ok: boolean; deviceNotRegistered?: boolean }> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: params.to,
      sound: "default",
      title: params.title,
      body: params.body,
      data: params.data,
      channelId: "default",
      priority: "high",
    }),
  });

  const result = (await response.json().catch(() => null)) as {
    data?: { status?: string; message?: string; details?: { error?: string } } | Array<{
      status?: string;
      message?: string;
      details?: { error?: string };
    }>;
  } | null;

  if (!response.ok) {
    logger.error("Expo push HTTP error", { status: response.status, result });
    return { ok: false };
  }

  const tickets = Array.isArray(result?.data)
    ? result!.data
    : result?.data
      ? [result.data]
      : [];

  for (const ticket of tickets) {
    if (ticket?.status === "error") {
      logger.error("Expo push ticket error", ticket);
      if (ticket.details?.error === "DeviceNotRegistered") {
        return { ok: false, deviceNotRegistered: true };
      }
      return { ok: false };
    }
  }

  return { ok: true };
}

/**
 * Yeni mesaj olusunca aliciya Expo push gonderir.
 * Istemciye bagimli degil — Firestore tetikler.
 */
export const onMessageCreated = onDocumentCreated(
  {
    document: "chats/{chatId}/messages/{messageId}",
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const chatId = event.params.chatId as string;
    const message = snap.data() as MessageData;

    if (message.isDeleted) return;
    if (!message.senderId) {
      logger.warn("Message missing senderId", { chatId, id: snap.id });
      return;
    }

    const recipientId = resolveRecipientId(chatId, message.senderId);
    if (!recipientId) {
      logger.warn("Could not resolve recipient from chatId", { chatId, senderId: message.senderId });
      return;
    }

    const [recipientSnap, senderSnap] = await Promise.all([
      db.doc(`users/${recipientId}`).get(),
      db.doc(`users/${message.senderId}`).get(),
    ]);

    if (!recipientSnap.exists) {
      logger.warn("Recipient user missing", { recipientId });
      return;
    }

    const recipient = recipientSnap.data() as { pushToken?: string };
    const sender = (senderSnap.data() || {}) as {
      name?: string;
      surname?: string;
      pushToken?: string;
    };

    const token = recipient.pushToken?.trim();
    if (!token) {
      logger.info("Recipient has no pushToken", { recipientId });
      return;
    }

    // Ayni cihazdaki iki hesap: ayni Expo token → bildirim gonderme
    if (sender.pushToken && sender.pushToken === token) {
      logger.info("Skipping push: sender and recipient share the same token");
      return;
    }

    const title = `${sender.name ?? "Birisi"} ${sender.surname ?? ""}`.trim() || "Yeni mesaj";
    const body = buildBody(message);

    const result = await sendExpoPush({
      to: token,
      title,
      body,
      data: {
        chatId,
        senderId: message.senderId,
        friendId: recipientId,
        messageId: snap.id,
      },
    });

    if (result.deviceNotRegistered) {
      await db.doc(`users/${recipientId}`).update({
        pushToken: FieldValue.delete(),
      });
      logger.info("Cleared DeviceNotRegistered pushToken", { recipientId });
    }
  }
);
