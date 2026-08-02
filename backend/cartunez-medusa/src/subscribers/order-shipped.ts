export const config = {
  event: "order.shipment_created",
};

export default async function orderShippedHandler({ data, container }: any) {
  if (data?.no_notification) return;

  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "shipping_address"],
  });

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[order-notification] SMTP not configured, skipping shipment email");
    return;
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const address = order.shipping_address;

  await transporter.sendMail({
    from: `Cartunez <${process.env.SMTP_USER}>`,
    to: order.email,
    subject: `Your Cartunez order #${order.display_id} has been shipped`,
    text: [
      "Hi,",
      "",
      `Great news — your order #${order.display_id} has been shipped and is on its way.`,
      "",
      address
        ? `Shipping to: ${address.address_1}, ${address.city}, ${address.country_code}`
        : "",
      "",
      "Thank you for shopping with Cartunez!",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  console.log(`[order-notification] Shipment email sent to ${order.email} for order #${order.display_id}`);
}
