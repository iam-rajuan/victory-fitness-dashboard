import { Modal } from "antd";

export default function DetailModal({
  open,
  onCancel,
  width = 1120,
  className = "user-view-modal",
  avatarSrc,
  avatarAlt,
  title,
  description,
  badges = [],
  sections = [],
  isLoading = false,
  loadingCardCount = 6,
  closeLabel = "Close",
}) {
  return (
    <Modal
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
      width={width}
      style={{ maxWidth: "calc(100vw - 32px)" }}
      styles={{
        body: {
          paddingTop: 12,
          paddingBottom: 20,
          background: "linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
        },
        header: {
          borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
          paddingInline: 24,
          paddingBlock: 18,
          background: "rgba(255, 255, 255, 0.96)",
        },
        content: {
          background: "#f8fafc",
        },
      }}
      className={className}
    >
      <div className="relative mt-2">
        <div className="mb-5 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative">
              <img
                src={avatarSrc || "/userimg.png"}
                alt={avatarAlt}
                className="h-20 w-20 rounded-full border-4 border-slate-100 object-cover shadow-md"
                onError={(event) => {
                  event.currentTarget.src = "/userimg.png";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Details</p>
              <h2 className="mt-1 mb-2 text-xl font-semibold text-slate-900 md:text-2xl">{title}</h2>
              <p className="text-sm text-slate-500">{description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {badges.map((badge) => (
                  <span
                    key={`${badge.label}-${badge.value}`}
                    className={badge.className || "rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"}
                  >
                    {badge.label ? `${badge.label}: ` : ""}
                    {badge.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-5 animate-pulse">
            {[...Array(2)].map((_, sectionIndex) => (
              <div key={sectionIndex} className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                <div className="mb-4">
                  <div className="h-3 w-32 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-48 rounded bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(loadingCardCount)].map((_, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 h-3 w-20 rounded bg-slate-200" />
                      <div className="h-5 w-full rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
            {sections.map((section) => (
              <div
                key={section.key}
                className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                    {section.eyebrow}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900">{section.title}</h4>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${card.fullWidth ? "md:col-span-2 xl:col-span-3" : ""}`}
                    >
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {card.label}
                      </div>
                      <div className={`font-semibold text-slate-800 ${card.fullWidth ? "text-sm leading-6" : "text-base"}`}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end border-t border-slate-200 pt-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-7 py-2.5 font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
