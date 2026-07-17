export const config = {
  event: "order.updated",
};

export default async function apexbooksOrderUpdatedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");
  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "customer", "payments", "shipping_address", "billing_address"],
  });

  await service.sendOutboundEvent("order.updated", "order", order.id, order);
}
