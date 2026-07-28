"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChaletSchema, type CreateChaletFormValues } from "@/lib/validations/chalet";
import { createChaletAction } from "@/lib/actions/chalet-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingTypesField } from "@/components/chalets/booking-types-field";
import { BOOKING_TYPE_FLAGS, type ApiUser } from "@/lib/api/types";

/**
 * Client Component: a large react-hook-form instance, so the whole form has
 * to be client-side. On success the server action itself performs the
 * redirect to `/dashboard/chalets`, so this component only ever needs to
 * handle the failure path.
 *
 * `chaletAdmins` is only passed (non-empty) when the current user isn't a
 * ChaletAdmin themselves — e.g. a SuperAdmin creating a chalet on behalf of
 * one. A ChaletAdmin creating their own chalet never sees this field; the
 * server action stamps their own id instead.
 */
export function CreateChaletForm({ chaletAdmins = [] }: { chaletAdmins?: ApiUser[] }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateChaletFormValues>({
    resolver: zodResolver(createChaletSchema),
    defaultValues: {
      showPrice: true,
      minNights: 1,
      maxNights: 7,
      checkInTime: "15:00",
      checkOutTime: "12:00",
      allowedBookingTypes: BOOKING_TYPE_FLAGS.Daily | BOOKING_TYPE_FLAGS.Weekend,
    },
  });

  async function onSubmit(values: CreateChaletFormValues) {
    setServerError(null);
    const result = await createChaletAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      {chaletAdmins.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-primary-700">Owner</h2>
          <FormField id="ownerAdminId" label="Chalet manager (ChaletAdmin)" error={errors.ownerAdminId?.message}>
            <Controller
              control={control}
              name="ownerAdminId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ownerAdminId">
                    <SelectValue placeholder="Choose a chalet manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {chaletAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.fullName} ({admin.userName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </section>
      )}

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-sm font-semibold text-primary-700">Basic information</h2>
        <FormField id="name" label="Chalet name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField id="description" label="Description" error={errors.description?.message}>
          <Textarea id="description" rows={4} {...register("description")} />
        </FormField>
        <FormField id="address" label="Address" error={errors.address?.message}>
          <Input id="address" {...register("address")} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="latitude" label="Latitude" error={errors.latitude?.message}>
            <Input id="latitude" type="number" step="any" {...register("latitude")} />
          </FormField>
          <FormField id="longitude" label="Longitude" error={errors.longitude?.message}>
            <Input id="longitude" type="number" step="any" {...register("longitude")} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-sm font-semibold text-primary-700">Capacity & details</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField id="maxGuests" label="Max guests" error={errors.maxGuests?.message}>
            <Input id="maxGuests" type="number" {...register("maxGuests")} />
          </FormField>
          <FormField id="bedroomsCount" label="Bedrooms" error={errors.bedroomsCount?.message}>
            <Input id="bedroomsCount" type="number" {...register("bedroomsCount")} />
          </FormField>
          <FormField id="bathroomsCount" label="Bathrooms" error={errors.bathroomsCount?.message}>
            <Input id="bathroomsCount" type="number" {...register("bathroomsCount")} />
          </FormField>
          <FormField id="basePrice" label="Base price" error={errors.basePrice?.message}>
            <Input id="basePrice" type="number" {...register("basePrice")} />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="showPrice"
            render={({ field }) => <Switch id="showPrice" checked={field.value} onCheckedChange={field.onChange} />}
          />
          <Label htmlFor="showPrice">Show price to visitors</Label>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-sm font-semibold text-primary-700">Booking & stay</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField id="minNights" label="Min nights" error={errors.minNights?.message}>
            <Input id="minNights" type="number" {...register("minNights")} />
          </FormField>
          <FormField id="maxNights" label="Max nights" error={errors.maxNights?.message}>
            <Input id="maxNights" type="number" {...register("maxNights")} />
          </FormField>
          <FormField id="checkInTime" label="Check-in time" error={errors.checkInTime?.message}>
            <Input id="checkInTime" type="time" {...register("checkInTime")} />
          </FormField>
          <FormField id="checkOutTime" label="Check-out time" error={errors.checkOutTime?.message}>
            <Input id="checkOutTime" type="time" {...register("checkOutTime")} />
          </FormField>
        </div>

        <FormField id="allowedBookingTypes" label="Allowed booking types" error={errors.allowedBookingTypes?.message}>
          <Controller
            control={control}
            name="allowedBookingTypes"
            render={({ field }) => <BookingTypesField value={field.value} onChange={field.onChange} />}
          />
        </FormField>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-sm font-semibold text-primary-700">Contact & policies</h2>
        <FormField id="whatsAppNumber" label="WhatsApp number" error={errors.whatsAppNumber?.message}>
          <Input id="whatsAppNumber" placeholder="0591234567" {...register("whatsAppNumber")} />
        </FormField>
        <FormField id="cancellationPolicy" label="Cancellation policy" error={errors.cancellationPolicy?.message}>
          <Textarea id="cancellationPolicy" rows={3} {...register("cancellationPolicy")} />
        </FormField>
      </section>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Publish chalet
      </Button>
    </form>
  );
}
