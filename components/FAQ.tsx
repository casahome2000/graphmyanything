const faqs = [
  {
    q: "Is this agent memory like Mem0?",
    a: "No. Mem0, Zep, and similar tools excel at text and conversational memory. GraphMyAnything is only for numbers over time—metrics, KPIs, sensor readings. Use both side by side.",
  },
  {
    q: "What is short-term vs long-term memory?",
    a: "Short-term holds recent readings for fast summaries and anomaly detection. Long-term retains years of history per namespace so trend and seasonality improve as you track.",
  },
  {
    q: "How do chart URLs work?",
    a: "Each namespace can expose a stable chart URL. Query params adjust range, chart type, and forecast—like image transforms. The image updates when new points arrive.",
  },
  {
    q: "Do I need Supabase for the waitlist?",
    a: "No. Without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, signups are logged server-side and the API still returns success—handy for previews.",
  },
  {
    q: "When do you launch?",
    a: "Waitlist members hear first. Founding members get refundable preorder until public launch.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          FAQ
        </h2>
        <dl className="mt-10 space-y-6">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="border-b border-white/[0.06] pb-6 last:border-0"
            >
              <dt className="text-base font-medium text-[#f4f4f7]">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#8b8b9e]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}