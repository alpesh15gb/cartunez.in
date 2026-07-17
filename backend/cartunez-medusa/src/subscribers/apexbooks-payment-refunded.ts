export const config = {
  event: "payment.refunded",
};

export default async function apexbooksPaymentRefundedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");

  await service.sendOutboundEvent("payment.refunded", "payment", data.id, data);
}
