export const config = {
  event: "order.fulfillment_created",
};

export default async function orderFulfilledHandler({ data, container }: any) {
  if (data?.no_notification) return;

  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "shipping_address"],
  });

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[order-notification] SMTP not configured, skipping fulfillment email");
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
  const total = ((order.total || 0) / 100).toFixed(2);

  await transporter.sendMail({
    from: `Cartunez <${process.env.SMTP_USER}>`,
    to: order.email,
    subject: `Your Cartunez order #${order.display_id} has been fulfilled`,
    text: [
      "Hi,",
      "",
      `Good news — your order #${order.display_id} has been fulfilled and is being prepared for dispatch.`,
      "",
      `Order total: Rs ${total}`,
      address
        ? `Shipping to: ${address.address_1}, ${address.city}, ${address.country_code}`
        : "",
      "",
      "Thank you for shopping with Cartunez!",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  console.log(`[order-notification] Fulfillment email sent to ${order.email} for order #${order.display_id}`);
}
