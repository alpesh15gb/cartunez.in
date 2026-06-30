const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;

async function seed() {
  console.log("Bootstrapping Medusa loader...");
  const directory = process.cwd();
  const app = express();

  // Shut up Winston logging during bootstrap to keep output clean
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({
    directory,
    expressApp: app,
    isTest: false,
  });

  console.log("Services resolved. Enabling manual providers in database...");
  const manager = container.resolve("manager");
  await manager.query("UPDATE fulfillment_provider SET is_installed = true WHERE id = 'manual'");
  await manager.query("UPDATE payment_provider SET is_installed = true WHERE id = 'manual'");

  console.log("Initializing seed process...");

  const productService = container.resolve("productService");
  const productVariantService = container.resolve("productVariantService");
  const productCategoryService = container.resolve("productCategoryService");
  const shippingOptionService = container.resolve("shippingOptionService");
  const shippingProfileService = container.resolve("shippingProfileService");
  const regionService = container.resolve("regionService");
  const salesChannelService = container.resolve("salesChannelService");
  // 1. Get India Region
  const regions = await regionService.list();
  let region = regions.find(r => r.currency_code === "inr");
  if (!region) {
    console.log("India region not found. Creating region...");
    region = await regionService.create({
      name: "India",
      currency_code: "inr",
      tax_rate: 18,
      payment_providers: ["manual"],
      fulfillment_providers: ["manual"],
      countries: ["in"]
    });
  }
  const regionId = region.id;
  console.log(`Using region: ${region.name} (${regionId})`);

  // 2. Get Default Shipping Profile
  const defaultProfile = await shippingProfileService.retrieveDefault();
  const defaultProfileId = defaultProfile.id;
  console.log(`Using default shipping profile: ${defaultProfileId}`);

  // Get Default Sales Channel
  const defaultSalesChannel = await salesChannelService.retrieveDefault();
  const defaultSalesChannelId = defaultSalesChannel.id;
  console.log(`Using default sales channel: ${defaultSalesChannelId}`);

  // 3. Create Shipping Options if none exist
  const existingOptions = await shippingOptionService.list({ region_id: regionId });
  if (existingOptions.length === 0) {
    console.log("Creating shipping options...");
    await shippingOptionService.create({
      name: "Standard Delivery",
      region_id: regionId,
      provider_id: "manual",
      data: {},
      price_type: "flat_rate",
      amount: 9900, // INR 99.00
      profile_id: defaultProfileId,
    });
    await shippingOptionService.create({
      name: "Express Delivery",
      region_id: regionId,
      provider_id: "manual",
      data: {},
      price_type: "flat_rate",
      amount: 19900, // INR 199.00
      profile_id: defaultProfileId,
    });
    await shippingOptionService.create({
      name: "Home Installation Service",
      region_id: regionId,
      provider_id: "manual",
      data: {},
      price_type: "flat_rate",
      amount: 49900, // INR 499.00
      profile_id: defaultProfileId,
    });
    console.log("Shipping options created.");
  } else {
    console.log("Shipping options already exist.");
  }

  // 4. Create Categories
  const categoriesToCreate = [
    { name: "Alloy Wheels", handle: "alloy-wheels", description: "Premium alloy wheels from NeoWheels - ARAI certified, lifetime structural warranty." },
    { name: "Floor Mats", handle: "floor-mats", description: "Premium 7D, 3D and custom-fit cabin mats." },
    { name: "Seat Covers", handle: "seat-covers", description: "Premium leatherette custom-fit seat covers." },
    { name: "LED Lights", handle: "led-lights", description: "High power LED headlight bulbs and ambient lighting." },
    { name: "Infotainment Systems", handle: "infotainment-systems", description: "Android stereos, Apple CarPlay screens and DSP audio." },
    { name: "Dash Cameras", handle: "dash-cameras", description: "4K, dual-channel dashcams with GPS and Wi-Fi." },
  ];

  const categoryMap = {};
  for (const cat of categoriesToCreate) {
    const existing = await manager.query("SELECT * FROM product_category WHERE handle = $1", [cat.handle]);
    if (existing.length > 0) {
      categoryMap[cat.handle] = existing[0];
      console.log(`Category exists: ${cat.name}`);
    } else {
      const created = await productCategoryService.create({
        name: cat.name,
        handle: cat.handle,
        description: cat.description,
        is_active: true,
        is_internal: false
      });
      categoryMap[cat.handle] = created;
      console.log(`Created category: ${cat.name}`);
    }
  }

  // 5. Create Products
  const productsToCreate = [
    {
      title: "Cartunez 7D Custom Car Floor Mats",
      description: "Experience luxury and extreme floor protection with Cartunez 7D custom-fit car floor mats. Engineered with raised edges, anti-slip backing, premium diamond-stitch leatherette, and a removable grass mat layer for effortless cleaning. Perfect tailored fit for all premium Indian car models.",
      subtitle: "Tailored Luxury Cabin Protection",
      handle: "cartunez-7d-floor-mats",
      categoryHandle: "floor-mats",
      options: ["Color"],
      variants: [
        { title: "Classic Black", price: 499900, optionValues: ["Classic Black"] },
        { title: "Royal Tan", price: 529900, optionValues: ["Royal Tan"] },
        { title: "Coffee Brown", price: 529900, optionValues: ["Coffee Brown"] },
      ]
    },
    {
      title: "Cartunez Premium Nappa Leatherette Seat Covers",
      description: "Upgrade your car's interior with ultra-premium Nappa leatherette seat covers. Custom manufactured for a bucket-fit finish, these covers feature high-density memory foam padding, double-stitching details, and full airbag compatibility. Spill-resistant, breathable, and highly durable.",
      subtitle: "Ergonomic Bucket-Fit Seat Luxury",
      handle: "cartunez-nappa-seat-covers",
      categoryHandle: "seat-covers",
      options: ["Color"],
      variants: [
        { title: "Stealth Black", price: 1249900, optionValues: ["Stealth Black"] },
        { title: "Tan & Black Dual-Tone", price: 1349900, optionValues: ["Tan & Black Dual-Tone"] },
        { title: "Ivory White", price: 1399900, optionValues: ["Ivory White"] },
      ]
    },
    {
      title: "Cartunez HyperLED Headlight Bulbs 130W",
      description: "Illuminate the dark roads with Cartunez HyperLED headlight bulbs. Delivering an intense 130W combined output and 6000K crisp cool white light. Features high-speed double ball-bearing fan cooling, copper heat pipes, and instant start-up. Error-free CANBUS built-in.",
      subtitle: "Ultra-Bright 6000K CANBUS LED Bulbs",
      handle: "cartunez-hyperled-130w",
      categoryHandle: "led-lights",
      options: ["Bulb Type"],
      variants: [
        { title: "H7 Type", price: 349900, optionValues: ["H7"] },
        { title: "H4 Hi/Lo Type", price: 389900, optionValues: ["H4 Hi/Lo"] },
        { title: "H11/H8 Type", price: 349900, optionValues: ["H11/H8"] },
      ]
    },
    {
      title: "Cartunez 9-inch Android Infotainment System",
      description: "Bring high-end connectivity to your dashboard. This premium 9-inch IPS touchscreen system supports Wireless Apple CarPlay, Wireless Android Auto, and Full HD video playback. Powered by a fast Octa-core processor, 4GB RAM, 64GB storage, and a built-in DSP (Digital Signal Processor) for premium sound output.",
      subtitle: "Wireless CarPlay / Android Auto Touchscreen",
      handle: "cartunez-9inch-android-infotainment",
      categoryHandle: "infotainment-systems",
      options: ["RAM/Storage"],
      variants: [
        { title: "4GB RAM + 64GB Storage", price: 1899900, optionValues: ["4GB/64GB"] },
        { title: "6GB RAM + 128GB Storage + 4G LTE", price: 2499900, optionValues: ["6GB/128GB"] },
      ]
    },
    {
      title: "Cartunez Dual-Channel GPS Dash Camera",
      description: "Drive with peace of mind. Cartunez dual dashcam records crystal-clear Ultra-HD 4K videos at the front and 1080P at the rear. Features Sony STARVIS sensors for exceptional night vision, built-in GPS for speed and route logging, dual-band Wi-Fi for instant app access, and 24-hour G-sensor parking mode.",
      subtitle: "4K Front & 1080P Rear Smart Dashcam",
      handle: "cartunez-dual-channel-dashcam",
      categoryHandle: "dash-cameras",
      options: ["Memory Card Bundle"],
      variants: [
        { title: "Standard (No Card)", price: 899900, optionValues: ["No Card"] },
        { title: "With 64GB High-End MicroSD", price: 979900, optionValues: ["With 64GB"] },
        { title: "With 128GB High-End MicroSD", price: 1049900, optionValues: ["With 128GB"] },
      ]
    }
  ];

  for (const prodData of productsToCreate) {
    const existingProducts = await productService.list({ handle: prodData.handle });
    if (existingProducts.length > 0) {
      console.log(`Product already exists: ${prodData.title}`);
      continue;
    }

    console.log(`Creating product: ${prodData.title}...`);
    // Create the product
    const product = await productService.create({
      title: prodData.title,
      description: prodData.description,
      subtitle: prodData.subtitle,
      handle: prodData.handle,
      status: "published",
      sales_channels: [{ id: defaultSalesChannelId }],
      is_giftcard: false,
      discountable: true,
      options: prodData.options.map(o => ({ title: o })),
      profile_id: defaultProfileId,
    });

    // Link product to category
    const category = categoryMap[prodData.categoryHandle];
    if (category) {
      await productService.update(product.id, {
        categories: [{ id: category.id }]
      });
    }

    // Retrieve the created option ids
    const dbProduct = await productService.retrieve(product.id, { relations: ["options"] });
    const optionMap = {};
    prodData.options.forEach((optTitle, idx) => {
      const dbOption = dbProduct.options.find(o => o.title === optTitle);
      if (dbOption) {
        optionMap[optTitle] = dbOption.id;
      }
    });

    // Add variants
    for (const varData of prodData.variants) {
      const optionValues = varData.optionValues.map((val, idx) => {
        const optionTitle = prodData.options[idx];
        const optionId = optionMap[optionTitle];
        return {
          option_id: optionId,
          value: val
        };
      });

      await productVariantService.create(product.id, {
        title: varData.title,
        prices: [
          {
            currency_code: "inr",
            amount: varData.price,
            region_id: regionId
          }
        ],
        options: optionValues,
        inventory_quantity: 100,
        manage_inventory: true
      });
      console.log(`  Added variant: ${varData.title}`);
    }
  }

  console.log("Medusa seed process complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
