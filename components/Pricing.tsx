const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    highlight: false,
    features: [
      "3 metric streams",
      "10k points",
      "90-day history",
      "GraphMyAnything badge",
    ],
  },
  {
    name: "Indie",
    price: "$12",
    period: "/mo",
    highlight: false,
    features: [
      "More streams & points",
      "1-year history",
      "Chart URLs & MCP access",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    highlight: true,
    features: [
      "Forecasts & alerts",
      "Weekly AI digest",
      "Multi-year long-term memory",
      "Priority chart CDN",
    ],
  },
  {
    name: "Team",
    price: "$79",
    period: "/mo",
    highlight: false,
    features: [
      "Shared namespaces",
      "Role-based access",
      "SSO-ready (at launch)",
      "Higher rate limits",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pricing preview
        </h2>
        <p className="mt-2 text-[#8b8b9e]">
          Launch tiers—founding members lock in early pricing.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl p-6 ${
                tier.highlight
                  ? "gradient-border bg-violet-500/[0.08]"
                  : "glass"
              }`}
            >
              <h3 className="text-sm font-medium text-[#8b8b9e]">{tier.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{tier.price}</span>
                <span className="text-sm text-[#8b8b9e]">{tier.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-[#8b8b9e]">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-400" aria-hidden>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}