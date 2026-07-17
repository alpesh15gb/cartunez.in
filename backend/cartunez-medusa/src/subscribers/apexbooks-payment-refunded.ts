export const config = {
  event: "refund.created",
};

export default async function apexbooksPaymentRefundedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");

  await service.sendOutboundEvent("payment.refunded", "payment", data.id, data);
}
