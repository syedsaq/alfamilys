import { handleBookingAction } from "../bookingAction";

export async function PATCH(req, context) {
  const { params } = context;
  return handleBookingAction(req, params, "accept");
}
