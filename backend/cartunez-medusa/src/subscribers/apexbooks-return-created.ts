export const config = {
  event: "return.requested",
};

export default async function apexbooksReturnCreatedHandler({ data, container }: any) {
  const service = container.resolve("apexbooksIntegrationService");

  await service.sendOutboundEvent("return.created", "return", data.id, data);
}
