export const config = {
  event: "order.canceled",
};

export default async function apexbooksOrderCancelledHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");
  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "customer", "payments", "shipping_address", "billing_address"],
  });

  await service.sendOutboundEvent("order.cancelled", "order", order.id, order);
}
