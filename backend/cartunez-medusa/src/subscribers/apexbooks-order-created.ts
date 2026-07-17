export const config = {
  event: "order.placed",
};

export default async function apexbooksOrderCreatedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");
  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "customer", "payments", "shipping_address", "billing_address"],
  });

  await service.sendOutboundEvent("order.created", "order", order.id, order);
}
