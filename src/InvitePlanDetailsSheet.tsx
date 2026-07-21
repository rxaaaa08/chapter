// Shared plan-details bottom sheet — the exact sheet the /invite flow opens on
// "Re-check plan details". Extracted verbatim from App.tsx so the creator
// dashboard's "See upcoming events" can open the identical sheet (same layout,
// motion, and styling) instead of a look-alike.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Bus, Heart, Users, ShieldCheck, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export type InvitePlanDetails = {
  quickInfo?: Array<{ label: string; value: string }>;
  included?: string[];
  itinerary?: Array<{
    day?: string;
    title?: string;
    description?: string;
    schedule?: Array<{ time?: string; activity?: string }>;
  }>;
  accommodation?: {
    name?: string;
    images?: string[];
    features?: string[];
    policy?: string;
    stays?: Array<{ name?: string; image?: string; images?: string[]; features?: string[] }>;
  };
  showAccommodation?: boolean;
};

export function InvitePlanDetailsSheet({
  open,
  onClose,
  title,
  details,
  onPayAdvance,
  isFullyPaid = false,
  isBalancePayment = false,
  isFullPay = false,
  whatsappGroupUrl,
  closeButtonClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  details: InvitePlanDetails | null;
  onPayAdvance?: () => void;
  isFullyPaid?: boolean;
  isBalancePayment?: boolean;
  isFullPay?: boolean;
  whatsappGroupUrl?: string;
  closeButtonClassName?: string;
}) {
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(0);
  const [stayImageIndexes, setStayImageIndexes] = useState<Record<number, number>>({});
  const quickInfo = details?.quickInfo ?? [];
  const planTitle = quickInfo.find(c => c.label === 'Plan Title')?.value || 'The Plan';
  const meetingSpot = quickInfo.find(c => c.label === 'Meeting Spot' || c.label === 'Venue') || quickInfo[0];
  const transport = quickInfo.find(c => c.label === 'Transport' || c.label === 'Format') || quickInfo[1];
  const groupSize = quickInfo.find(c => c.label === 'Group Size') || quickInfo[2];
  const madeFor = quickInfo.find(c => c.label === "You'll Meet" || c.label === 'Made For') || quickInfo[3];
  const groupNum = groupSize?.value.match(/\d+[-–]\d+|\d+/)?.[0] || groupSize?.value || 'Limited';
  const included = (details?.included ?? []).filter(Boolean);
  const itinerary = (details?.itinerary ?? []).filter(item => item?.title || item?.description || (item?.schedule ?? []).length > 0);
  const accommodation = details?.accommodation;
  const stays = (accommodation?.stays && accommodation.stays.length > 0)
    ? accommodation.stays
    : accommodation?.name || (accommodation?.features ?? []).length > 0 || (accommodation?.images ?? []).length > 0
      ? [{ name: accommodation?.name, images: accommodation?.images, features: accommodation?.features }]
      : [];
  const roomSharingPolicy = accommodation?.policy === 'Twin sharing by default; limited solo upgrade on request'
    || accommodation?.policy === 'Twin sharing by default; upgrade to solo room on request'
    ? "Rooms are same-gender — so everyone's comfortable"
    : accommodation?.policy;
  const showStay = Boolean(details?.showAccommodation && stays.length > 0);

  useEffect(() => {
    if (!open) return;
    setExpandedItinerary(0);
    setStayImageIndexes({});
  }, [open, title]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[90] flex items-end bg-black/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className={`absolute right-4 -top-10 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm ${closeButtonClassName ?? ''}`}
              aria-label="Close plan details"
            >
              <X size={14} />
            </button>

            <div className="bg-white rounded-t-[2rem] shadow-2xl overflow-hidden">
              <style>{`
                .invite-details-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
                .invite-details-scroll::-webkit-scrollbar { width: 3px; }
                .invite-details-scroll::-webkit-scrollbar-track { background: transparent; margin-top: 28px; margin-bottom: 8px; }
                .invite-details-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.18); border-radius: 99px; border-top: 16px solid transparent; border-bottom: 16px solid transparent; background-clip: content-box; }
              `}</style>
              <div className="invite-details-scroll overflow-y-auto" style={{ maxHeight: '78dvh' }}>
              <div className="pt-5 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-black mb-4 px-6">{planTitle}</h3>
                <div className="mx-3 border border-dashed border-[#595959] rounded-2xl overflow-hidden bg-gray-50">
                  <div className="flex border-b border-dashed border-[#bfbfbf]/50">
                    <div className="flex-1 px-3 py-3.5 border-r border-dashed border-[#bfbfbf]/50">
                      <div className="flex items-center gap-1 mb-1.5">
                        <MapPin size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{meetingSpot?.label || 'Meeting Spot'}</span>
                      </div>
                      <span className="text-[13px] font-black text-gray-900 leading-tight">{meetingSpot?.value || 'To be shared'}</span>
                    </div>
                    <div className="flex-1 px-3 py-3.5">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Bus size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{transport?.label || 'Transport'}</span>
                      </div>
                      <span className="text-[13px] font-black text-gray-900 leading-tight">{transport?.value || 'To be shared'}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 px-3 py-4 border-r border-dashed border-[#bfbfbf]/50">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Heart size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">You'll Meet</span>
                      </div>
                      <span className="text-[14px] font-black text-gray-900 leading-snug">{madeFor?.value || 'chapter அ people'}</span>
                    </div>
                    <div className="px-3 py-4 flex flex-col items-start flex-shrink-0">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Users size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">Gang Size</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] font-black text-gray-900 leading-none">{groupNum}</span>
                        {/\d/.test(groupNum) && <span className="text-[13px] font-black text-gray-900 leading-none">ppl</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {included.length > 0 && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-black mb-4">What's Included</h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                      {included.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-gray-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {itinerary.length > 0 && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-black mb-4">You'll Experience</h3>
                  <div className="space-y-3">
                    {itinerary.map((day, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setExpandedItinerary(expandedItinerary === i ? null : i)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                        >
                          <div>
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em]">{day.day || `Day ${i + 1}`}</span>
                            {day.title && <h4 className="font-semibold text-gray-900 mt-0.5">{day.title}</h4>}
                          </div>
                          <motion.div
                            initial={false}
                            animate={{ rotate: expandedItinerary === i ? 180 : 0, scale: expandedItinerary === i ? 1.05 : 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="w-8 h-8 rounded-full bg-[#FFD700] text-black flex items-center justify-center flex-shrink-0 self-center"
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {expandedItinerary === i && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 border-t border-gray-100">
                                {day.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed mb-4 mt-3">
                                    {day.description}
                                  </p>
                                )}
                                {(day.schedule ?? []).filter(item => item.time || item.activity).length > 0 && (
                                  <div className="relative pl-4 border-l border-gray-900/10 space-y-5 mt-4 ml-2 mb-2">
                                    {(day.schedule ?? []).filter(item => item.time || item.activity).map((item, idx) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#ffd700]" />
                                        {item.time && <div className="text-xs font-bold text-gray-400 mb-0.5 tracking-wide uppercase">{item.time}</div>}
                                        {item.activity && <div className="text-sm font-medium text-gray-800">{item.activity}</div>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showStay && (
                <div className="p-6">
                  <h3 className="text-xl font-black mb-4">Where We Stay</h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    {stays.map((stay, i) => {
                      const images = (stay.images ?? []).filter(Boolean);
                      const allImages = images.length > 0 ? images : (stay.image ? [stay.image] : []);
                      const currentIndex = Math.max(0, Math.min(stayImageIndexes[i] ?? 0, Math.max(allImages.length - 1, 0)));
                      return (
                        <div key={i} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <div className="relative w-full aspect-[4/3]">
                            {allImages.length > 0 ? (
                              <>
                                <img src={allImages[currentIndex]} alt={stay.name || `Stay ${i + 1}`} className="w-full h-full object-cover" />
                                {allImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setStayImageIndexes(prev => ({ ...prev, [i]: (currentIndex - 1 + allImages.length) % allImages.length }))}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                      aria-label="Previous stay photo"
                                    >
                                      <ChevronLeft size={20} className="text-gray-800 pr-0.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStayImageIndexes(prev => ({ ...prev, [i]: (currentIndex + 1) % allImages.length }))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                      aria-label="Next stay photo"
                                    >
                                      <ChevronRight size={20} className="text-gray-800 pl-0.5" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                      {allImages.map((_, imgIndex) => (
                                        <div
                                          key={imgIndex}
                                          className={`w-1.5 h-1.5 rounded-full transition-colors ${imgIndex === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                                        />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          <div className="p-4">
                            <div className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em] mb-2">
                              Night {i + 1}
                            </div>
                            <h4 className="font-bold text-lg mb-3">{stay.name || `Stay ${i + 1}`}</h4>
                            {(stay.features ?? []).filter(Boolean).length > 0 && (
                              <ul className="space-y-2">
                                {(stay.features ?? []).filter(Boolean).map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {i === stays.length - 1 && roomSharingPolicy && (
                              <div className="mt-4 bg-emerald-50 p-3 rounded-xl text-sm font-medium text-emerald-800 border border-emerald-100 flex items-start gap-2">
                                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span>{roomSharingPolicy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!isFullyPaid && onPayAdvance && (
                <div className="px-5 pb-8">
                  <button
                    type="button"
                    onClick={onPayAdvance}
                    className="w-full py-4 rounded-2xl text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-90 transition-all relative overflow-hidden"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', width: '50%' }}
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                    />
                    <span>{isFullPay ? 'Pay Now' : isBalancePayment ? 'Pay Balance' : 'Pay Advance'}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              )}
              {/* Fully-paid users see the Join Groupchat CTA in place of Pay.
                  AiSensy template buttons can't link to chat.whatsapp.com
                  directly (Meta blocks it) — this is the workaround: the
                  template links here and we relay the real group URL. */}
              {isFullyPaid && whatsappGroupUrl && (
                <div className="px-5 pb-8">
                  <a
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-90 transition-all relative overflow-hidden"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', width: '50%' }}
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                    />
                    <span>Join Groupchat</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              )}
              {/* Fully paid but no group URL configured on the event_dates row
                  → keep the spacer (no message, per the design decision). */}
              {isFullyPaid && !whatsappGroupUrl && <div className="h-8" />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
