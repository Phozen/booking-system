import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type AppNotificationType =
  | "booking_confirmation"
  | "booking_approval"
  | "booking_rejection"
  | "booking_cancellation"
  | "booking_invitation"
  | "booking_invitation_accepted"
  | "booking_invitation_declined";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string | null;
  href: string | null;
  relatedBookingId: string | null;
  seenAt: string | null;
  createdAt: string;
};

type AppNotificationRecord = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string | null;
  href: string | null;
  related_booking_id: string | null;
  seen_at: string | null;
  created_at: string;
};

function mapAppNotification(record: AppNotificationRecord): AppNotification {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    body: record.body,
    href: record.href,
    relatedBookingId: record.related_booking_id,
    seenAt: record.seen_at,
    createdAt: record.created_at,
  };
}

export async function createAppNotification({
  userId,
  type,
  title,
  body,
  href,
  relatedBookingId,
}: {
  userId?: string | null;
  type: AppNotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  relatedBookingId?: string | null;
}) {
  if (!userId) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("app_notifications").insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      href: href ?? null,
      related_booking_id: relatedBookingId ?? null,
    });

    if (error && error.code !== "23505") {
      console.error("App notification insert failed", {
        userId,
        type,
        relatedBookingId,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("App notification unavailable", error);
  }
}

export async function getUserAppNotifications(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("app_notifications")
    .select("id,type,title,body,href,related_booking_id,seen_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("App notifications load failed", {
      userId,
      message: error.message,
    });
    return [];
  }

  return ((data as AppNotificationRecord[] | null) ?? []).map(
    mapAppNotification,
  );
}

export async function getUnseenAppNotificationCount(
  supabase: SupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("seen_at", null);

  if (error) {
    console.error("Unseen app notification count failed", {
      userId,
      message: error.message,
    });
    return 0;
  }

  return count ?? 0;
}

export async function markUserAppNotificationsSeen(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error } = await supabase
    .from("app_notifications")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("seen_at", null);

  if (error) {
    console.error("Mark app notifications seen failed", {
      userId,
      message: error.message,
    });
  }
}
