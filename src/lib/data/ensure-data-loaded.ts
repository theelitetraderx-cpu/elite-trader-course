import { ensureProgramsLoaded } from "@/lib/data/course-content-store";
import { ensureProgressLoaded } from "@/lib/data/progress-store";
import { ensureUserCourseAccessLoaded } from "@/lib/data/user-store";
import { ensureNotificationsLoaded } from "@/lib/data/notification-store";
import { ensureSignalsLoaded } from "@/lib/data/signal-store";
import { ensureMeetingsLoaded } from "@/lib/data/meeting-store";
import { ensureFavouriteCoinsLoaded } from "@/lib/data/favourite-coins-store";
import { ensurePaymentsLoaded } from "@/lib/data/payment-store";
import { ensureAnnouncementsLoaded } from "@/lib/data/announcement-store";
import { ensureSupportQueriesLoaded } from "@/lib/data/support-query-store";

/** Load all persisted data before handling authenticated requests. */
export async function ensureAppDataLoaded() {
  await Promise.all([
    ensureProgramsLoaded(),
    ensureUserCourseAccessLoaded(),
    ensureProgressLoaded(),
    ensureNotificationsLoaded(),
    ensureSignalsLoaded(),
    ensureMeetingsLoaded(),
    ensureFavouriteCoinsLoaded(),
    ensurePaymentsLoaded(),
    ensureAnnouncementsLoaded(),
    ensureSupportQueriesLoaded(),
  ]);
}
