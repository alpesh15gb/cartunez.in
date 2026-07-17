export const config = {
  event: "customer.created",
};

export default async function apexbooksCustomerCreatedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");
  const customerService = container.resolve("customerService");
  const customer = await customerService.retrieve(data.id);

  await service.sendOutboundEvent("customer.created", "customer", customer.id, customer);
}
