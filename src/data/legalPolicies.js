// Sourced directly from the client-supplied policy PDFs (15 documents,
// provided 2026-09-13) -- content is reproduced as given, not paraphrased.
// Factored into one data module (rather than 15 near-identical page
// components) since every policy shares the same company info block and
// section-list shape; LegalPolicy.jsx renders whichever one matches the
// :slug route param.

export const COMPANY_INFO = {
  name: "STYLENEST FASHION PRIVATE LIMITED",
  addressLines: ["175-B, Amrit Palace, NIPANIA, Indore, Madhya Pradesh – 452010"],
  gstin: "23ABUCS8160R1ZA",
  phone: "6269933231",
  email: "stylenestfashion1@gmail.com",
  website: "www.stylenestfashion.com",
};

export const LEGAL_POLICIES = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Introduction",
        body: 'This Privacy Policy explains how STYLENEST FASHION PRIVATE LIMITED ("Company", "we", "us", "our") may collect, use, store and protect information when you visit or use our website, place an order, contact us, or use our services.',
      },
      {
        heading: "2. Information We May Collect",
        body: "We may collect name, billing and shipping address, phone number, email address, order details, payment-related information handled by payment providers, customer support communications, and technical information such as IP address, browser/device information and website usage data.",
      },
      {
        heading: "3. Use of Information",
        body: "Information may be used to process and deliver orders, provide customer support, communicate about orders and services, improve the website, prevent fraud and misuse, maintain business records, and comply with applicable legal obligations.",
      },
      {
        heading: "4. Sharing of Information",
        body: "We may share necessary information with payment processors, logistics/courier partners, technology/service providers, professional advisors, government authorities where legally required, or other parties where necessary to provide the requested service.",
      },
      {
        heading: "5. International Customers",
        body: "For international orders, information may be processed or transferred as necessary to fulfil the order, arrange shipping, customs clearance, payment processing and customer support, subject to applicable law.",
      },
      {
        heading: "6. Security and Retention",
        body: "We take reasonable measures to protect information. We retain information for as long as reasonably necessary for the purposes described above, including legal, accounting and dispute-resolution requirements.",
      },
      {
        heading: "7. Cookies",
        body: "Our website may use cookies or similar technologies to maintain functionality, remember preferences, understand website usage and improve services. You can manage cookies through your browser settings.",
      },
      {
        heading: "8. Contact",
        body: "For privacy questions or requests, contact us at stylenestfashion1@gmail.com or 6269933231.",
      },
    ],
  },
  {
    slug: "terms-conditions",
    title: "Terms & Conditions",
    sections: [
      {
        heading: "1. Acceptance",
        body: "By accessing or using www.stylenestfashion.com, you agree to these Terms & Conditions. If you do not agree, please do not use the website.",
      },
      {
        heading: "2. Products and Pricing",
        body: "We make reasonable efforts to display product descriptions, images, sizes, availability and prices accurately. Minor colour or appearance differences may occur due to screens, lighting or photography. Prices and availability may change without prior notice.",
      },
      {
        heading: "3. Orders",
        body: "An order request is subject to product availability, payment confirmation, address verification and our acceptance. We may cancel or restrict an order where there is an error, suspected fraud, stock issue, pricing issue or other legitimate reason.",
      },
      {
        heading: "4. Payments",
        body: "Payments are processed through available payment methods and authorised payment providers. Customers must provide accurate billing and contact information.",
      },
      {
        heading: "5. Shipping",
        body: "Shipping timelines are estimates and may vary due to destination, courier conditions, holidays, customs, weather or other events outside our reasonable control.",
      },
      {
        heading: "6. International Orders",
        body: "International customers are responsible for providing accurate delivery information and, unless expressly stated otherwise at checkout, for applicable customs duties, import taxes, brokerage fees or destination-country charges.",
      },
      {
        heading: "7. Intellectual Property",
        body: "Website content, brand elements, product photographs, text, graphics and other materials are owned by or licensed to the Company and may not be copied, reproduced or commercially used without permission.",
      },
      {
        heading: "8. Limitation",
        body: "To the extent permitted by applicable law, the Company will not be responsible for indirect or consequential losses arising from use of the website or delays outside its reasonable control.",
      },
      {
        heading: "9. Governing Law",
        body: "These terms are intended to be governed by applicable laws of India, subject to mandatory rights that may apply to customers in their jurisdiction.",
      },
    ],
  },
  {
    slug: "shipping-delivery-policy",
    title: "Shipping & Delivery Policy – Domestic & International",
    sections: [
      {
        heading: "1. Domestic Shipping – India",
        body: "Orders are normally processed after payment/order confirmation. Delivery times depend on destination, product availability and courier service. Customers should provide a complete and accurate address and reachable phone number.",
      },
      {
        heading: "2. International Shipping",
        body: "International shipping availability, serviceable countries and charges may vary. Delivery time depends on destination, carrier, customs clearance and local conditions. Customs processing can cause delays beyond the Company's control.",
      },
      {
        heading: "3. Customs, Duties and Taxes",
        body: "Unless the checkout/order confirmation specifically states otherwise, international customers are responsible for import duties, customs fees, taxes, brokerage or other destination-country charges. Customers should check local import rules before ordering.",
      },
      {
        heading: "4. Address Errors",
        body: "If an order cannot be delivered because of an incorrect or incomplete address, refusal, failure to receive the parcel or similar customer-side issue, additional shipping or return charges may apply where permitted.",
      },
      {
        heading: "5. Tracking",
        body: "Where tracking is available, tracking details may be shared with the customer. Courier scans may take time to update.",
      },
      {
        heading: "6. Delays and Force Majeure",
        body: "We are not responsible for delays caused by courier disruptions, customs, strikes, natural events, government restrictions, technical failures or other events beyond our reasonable control.",
      },
    ],
  },
  {
    slug: "return-refund-policy",
    title: "Return & Refund Policy – Domestic & International",
    sections: [
      {
        heading: "1. Return Eligibility",
        body: "Returns are accepted only where the product is eligible under the product listing/order terms and the request is made within the stated return window. Items should generally be unused, unwashed, unaltered and returned with original tags/packaging, subject to product-specific exclusions.",
      },
      {
        heading: "2. Non-Returnable Items",
        body: "Certain products may be non-returnable for hygiene, customization, clearance/sale, damage caused after delivery or other legitimate reasons. Product pages may specify additional exclusions.",
      },
      {
        heading: "3. Return Request",
        body: "Customers should contact us at stylenestfashion1@gmail.com with order details, reason for return and supporting photographs where requested. We may inspect the returned product before approving a refund or exchange.",
      },
      {
        heading: "4. Refunds",
        body: "Approved refunds will be processed through the applicable payment method or another permitted method. Processing time can depend on the payment provider or bank.",
      },
      {
        heading: "5. Damaged/Wrong Product",
        body: "If a product arrives damaged, defective or materially different from the ordered item, contact us promptly with photographs and order details so we can review the issue and provide an appropriate resolution.",
      },
      {
        heading: "6. International Returns",
        body: "International returns may involve additional shipping, customs and handling costs. Unless the issue is attributable to the Company or applicable consumer law provides otherwise, such costs may be the customer's responsibility.",
      },
      {
        heading: "7. Consumer Rights",
        body: "Nothing in this policy is intended to exclude or restrict mandatory consumer rights that cannot lawfully be excluded.",
      },
    ],
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    sections: [
      {
        heading: "1. Customer Cancellation",
        body: "Customers may request cancellation before the order has been processed or dispatched. Once an order has entered fulfilment or has been shipped, cancellation may no longer be possible and the return policy may apply.",
      },
      {
        heading: "2. Company Cancellation",
        body: "We may cancel an order due to stock unavailability, payment failure, suspected fraud, pricing or listing errors, address/serviceability problems, or other legitimate reasons. Where appropriate, amounts paid for a cancelled order will be refunded.",
      },
      {
        heading: "3. Contact",
        body: "Cancellation requests should be sent to stylenestfashion1@gmail.com with the order number and registered contact details.",
      },
    ],
  },
  {
    slug: "exchange-policy",
    title: "Exchange Policy",
    sections: [
      {
        heading: "1. Eligibility",
        body: "Exchange is available only for eligible products and within the applicable exchange period stated at purchase. Items should be unused, unwashed and in original condition with tags/packaging unless the issue is a manufacturing defect or wrong item.",
      },
      {
        heading: "2. Size/Colour Exchange",
        body: "Size or colour exchanges are subject to stock availability. If the requested replacement is unavailable, an alternative resolution may be offered according to the order terms.",
      },
      {
        heading: "3. International Exchange",
        body: "International exchanges may require additional shipping, customs or tax costs unless applicable law or a Company-approved resolution states otherwise.",
      },
      {
        heading: "4. Request",
        body: "Contact stylenestfashion1@gmail.com with order details and photographs if requested.",
      },
    ],
  },
  {
    slug: "international-customs-policy",
    title: "International Shipping, Customs & Import Policy",
    sections: [
      {
        heading: "1. Customer Responsibility",
        body: "International customers are responsible for ensuring that the ordered products can legally be imported into the destination country and for providing accurate recipient details.",
      },
      {
        heading: "2. Duties and Taxes",
        body: "Import duties, VAT/GST or equivalent taxes, customs fees, brokerage charges and other destination-country costs may be charged by local authorities or carriers. Unless expressly included at checkout, these are the customer's responsibility.",
      },
      {
        heading: "3. Customs Clearance",
        body: "Customs authorities may inspect shipments or request information. Such procedures can delay delivery. We cannot guarantee clearance timelines.",
      },
      {
        heading: "4. Refused or Abandoned Shipments",
        body: "If a shipment is refused, abandoned or returned because the customer does not pay applicable import charges or fails to provide required information, any refund or deduction will be handled according to the applicable return terms and actual costs incurred, to the extent permitted by law.",
      },
      {
        heading: "5. Compliance",
        body: "International sales are subject to applicable export, import, customs, sanctions and other laws and regulations.",
      },
    ],
  },
  {
    slug: "payment-policy",
    title: "Payment Policy",
    sections: [
      {
        heading: "1. Payment Methods",
        body: "The website may offer payment methods such as cards, net banking, UPI, wallets, COD or other options depending on availability and destination.",
      },
      {
        heading: "2. Payment Confirmation",
        body: "Orders are processed after successful payment confirmation where prepayment is required. A payment attempt does not guarantee order acceptance.",
      },
      {
        heading: "3. Payment Security",
        body: "Payment credentials are generally handled by authorised payment service providers. Customers should not share OTPs, passwords or payment credentials with anyone claiming to represent the Company.",
      },
      {
        heading: "4. Currency",
        body: "International customers may see prices or payment processing in a supported currency as presented at checkout. Banks or payment providers may apply conversion rates or charges.",
      },
    ],
  },
  {
    slug: "bulk-orders-policy",
    title: "Bulk Orders / Wholesale Policy",
    sections: [
      {
        heading: "1. Bulk Orders",
        body: "STYLENEST FASHION PRIVATE LIMITED accepts enquiries for bulk/wholesale purchases subject to product availability, minimum quantities, pricing, production/processing capacity and payment terms.",
      },
      {
        heading: "2. Bulk Order Enquiry",
        body: "Customers may submit bulk enquiries through the Bulk Orders page: www.stylenestfashion.com/bulk-orders. Enquiries should include product details, required quantities, sizes/variants, delivery destination and preferred delivery timeline.",
      },
      {
        heading: "3. Pricing and Quotation",
        body: "Bulk pricing is quotation-based and may differ from retail website prices. A quotation is valid for the period stated in it and may be subject to stock availability, taxes, freight and other agreed charges.",
      },
      {
        heading: "4. Minimum Order Quantity",
        body: "Minimum order quantities, if applicable, will be communicated during quotation. Different products may have different minimum quantities.",
      },
      {
        heading: "5. Payment",
        body: "Bulk orders may require advance payment or other agreed payment terms. The order will be confirmed only after the agreed payment/credit terms are accepted.",
      },
      {
        heading: "6. Production and Delivery",
        body: "Bulk orders may require additional processing time. Delivery schedules will be communicated in the quotation/order confirmation and may change due to production, stock, logistics, customs or force-majeure events.",
      },
      {
        heading: "7. Returns and Cancellation",
        body: "Because bulk orders may be specially reserved, prepared or customised, cancellation, return and exchange conditions may differ from retail orders and will be stated in the quotation/order confirmation, subject to applicable law.",
      },
      {
        heading: "8. International Bulk Orders",
        body: "International bulk buyers are responsible for destination-country import requirements, duties, taxes, customs clearance and other charges unless the written quotation expressly states otherwise.",
      },
      {
        heading: "9. Contact",
        body: "Bulk Order enquiries: www.stylenestfashion.com/bulk-orders | Email: stylenestfashion1@gmail.com | Phone: 6269933231.",
      },
    ],
  },
  {
    slug: "damaged-wrong-product-policy",
    title: "Damaged / Defective / Wrong Product Policy",
    sections: [
      {
        heading: "1. Inspection",
        body: "Customers should inspect the package and product as soon as reasonably possible after delivery.",
      },
      {
        heading: "2. Reporting",
        body: "For a damaged, defective or wrong product, contact stylenestfashion1@gmail.com with order number, description and clear photographs/video if requested.",
      },
      {
        heading: "3. Resolution",
        body: "After verification, the Company may offer replacement, exchange, refund, repair or another appropriate resolution depending on the circumstances, stock availability and applicable law.",
      },
      {
        heading: "4. Customer-Caused Damage",
        body: "Damage resulting from misuse, washing, alteration, normal wear, improper storage or other customer-caused conditions may not qualify for replacement/refund.",
      },
    ],
  },
  {
    slug: "cod-policy",
    title: "Cash on Delivery (COD) Policy",
    sections: [
      {
        heading: "1. Availability",
        body: "COD, if offered, may be available only for eligible products, locations and order values.",
      },
      {
        heading: "2. Verification",
        body: "The Company may verify COD orders by phone or other reasonable means before dispatch.",
      },
      {
        heading: "3. Refusal",
        body: "Repeated refusal or non-acceptance of COD shipments may result in COD restrictions or cancellation of future COD orders.",
      },
      {
        heading: "4. Charges",
        body: "Any COD or handling charge, where applicable, will be displayed or communicated before order confirmation.",
      },
    ],
  },
  {
    slug: "contact-grievance-policy",
    title: "Contact Us & Grievance Policy",
    sections: [
      {
        heading: "1. Contact Details",
        body: "STYLENEST FASHION PRIVATE LIMITED, 175-B, Amrit Palace, NIPANIA, Indore, Madhya Pradesh – 452010. Phone: 6269933231. Email: stylenestfashion1@gmail.com. Website: www.stylenestfashion.com",
      },
      {
        heading: "2. Customer Support",
        body: "Customers may contact us for order status, returns, exchanges, refunds, shipping, bulk orders, privacy requests or other website-related concerns.",
      },
      {
        heading: "3. Grievance Handling",
        body: "We will review complaints and seek to respond within a reasonable period based on the nature and complexity of the issue and applicable law.",
      },
      {
        heading: "4. Bulk Orders",
        body: "Bulk order enquiries can also be submitted through www.stylenestfashion.com/bulk-orders.",
      },
    ],
  },
  {
    slug: "copyright-ip-policy",
    title: "Intellectual Property & Copyright Policy",
    sections: [
      {
        heading: "1. Ownership",
        body: "The STYLENEST FASHION name, branding, website content, photographs, graphics, product descriptions and other original materials are protected by applicable intellectual property laws.",
      },
      {
        heading: "2. Permitted Use",
        body: "Users may access the website for personal or legitimate purchasing purposes. Copying, scraping, reproducing, modifying, selling or commercially exploiting website content without permission is prohibited to the extent permitted by law.",
      },
      {
        heading: "3. Third-Party Content",
        body: "Third-party trademarks, payment brands, courier names or other marks remain the property of their respective owners.",
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Website Disclaimer",
    sections: [
      {
        heading: "1. General",
        body: "Information on the website is provided for general product and service information. We aim for accuracy but do not guarantee that every description, image, price, availability indicator or other content will always be complete, current or error-free.",
      },
      {
        heading: "2. External Links",
        body: "The website may contain links to third-party services. We are not responsible for the content, availability or policies of third-party websites.",
      },
      {
        heading: "3. Events Beyond Control",
        body: "We are not responsible for delays or failures caused by events beyond reasonable control, including logistics disruption, customs, natural events, government action, strikes or technical outages.",
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    sections: [
      {
        heading: "1. Use of Cookies",
        body: "We may use cookies and similar technologies to enable website functions, remember preferences, analyse usage and support security.",
      },
      {
        heading: "2. Managing Cookies",
        body: "Most browsers allow users to block or delete cookies. Disabling certain cookies may affect website functionality.",
      },
      {
        heading: "3. Third-Party Tools",
        body: "Where third-party analytics, payment, advertising or other technologies are used, those providers may process information under their own policies.",
      },
    ],
  },
];

export function getPolicyBySlug(slug) {
  return LEGAL_POLICIES.find((p) => p.slug === slug);
}
