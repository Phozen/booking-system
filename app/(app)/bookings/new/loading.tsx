import { employeeCopy } from "@/lib/employee/plain-language";
import { BookingFormSkeleton } from "@/components/bookings/booking-form-skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function NewBookingLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title={employeeCopy.bookARoom}
        description="Follow the steps. You can go back anytime before you send."
      />
      <BookingFormSkeleton />
    </main>
  );
}
