export const config = {
  event: "payment.captured",
};

export default async function apexbooksPaymentCapturedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");

  await service.sendOutboundEvent("payment.captured", "payment", data.id, data);
}
