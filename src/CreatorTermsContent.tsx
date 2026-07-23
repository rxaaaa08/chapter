import type { CSSProperties } from 'react';

const sectionTitle: CSSProperties = {
  color: '#18181b',
  fontSize: 14,
  fontWeight: 750,
  lineHeight: 1.45,
};

const sectionBody: CSSProperties = {
  color: '#5f5f66',
  fontSize: 13.5,
  lineHeight: 1.65,
  margin: '5px 0 0',
};

export function CreatorTermsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ ...sectionBody, margin: 0 }}>
        These terms govern your participation in the chapter அ creator partnership. By joining, you agree to the following:
      </p>

      <section>
        <div style={sectionTitle}>1. Accurate creator details</div>
        <p style={sectionBody}>You must provide accurate account, contact, handle, phone and UPI information, keep those details updated, and use an Instagram account or creator identity that you are authorised to operate.</p>
      </section>

      <section>
        <div style={sectionTitle}>2. Independent creator partnership</div>
        <p style={sectionBody}>You participate as an independent creator partner. This partnership does not create employment, agency, exclusivity or authority to make promises or commitments on behalf of chapter அ.</p>
      </section>

      <section>
        <div style={sectionTitle}>3. Honest and accurate promotion</div>
        <p style={sectionBody}>Your content must describe our events truthfully and use the latest details available in your dashboard. Do not make misleading claims, guarantee outcomes, hide important conditions, or present assumptions as confirmed event information.</p>
      </section>

      <section>
        <div style={sectionTitle}>4. Partnership disclosure</div>
        <p style={sectionBody}>Where a disclosure is required, clearly identify your material connection with chapter அ using an appropriate label such as “Affiliate”, “Ad”, “Collaboration” or a platform-provided paid-partnership tool. The disclosure must be clear, prominent and appropriate for the format of the content.</p>
      </section>

      <section>
        <div style={sectionTitle}>5. Custom links and attribution</div>
        <p style={sectionBody}>Use only the custom link issued to you. A booking is attributed to you only when our systems can verify that the customer used your link and completed a successful payment. Clicks and sign-ups alone do not earn commission.</p>
      </section>

      <section>
        <div style={sectionTitle}>6. Eligible commissions</div>
        <p style={sectionBody}>Commission rates may vary by event and will be shown in your dashboard. Commission is calculated only on eligible paid bookings. Cancelled, refunded, disputed, charged-back, duplicated, fraudulent or otherwise invalid bookings may be excluded or reversed.</p>
      </section>

      <section>
        <div style={sectionTitle}>7. Monthly payouts</div>
        <p style={sectionBody}>Eligible earnings are settled monthly to the valid UPI ID registered on your account. Incorrect or incomplete payment details may delay a payout. Any deductions or reporting required by applicable law may be made, and you remain responsible for your own tax obligations.</p>
      </section>

      <section>
        <div style={sectionTitle}>8. Prohibited activity</div>
        <p style={sectionBody}>Do not generate fake clicks, sign-ups or bookings; use bots or misleading redirects; spam people; impersonate chapter அ; manipulate attribution; or arrange artificial transactions to earn commission. We may withhold affected commissions while suspicious activity is reviewed.</p>
      </section>

      <section>
        <div style={sectionTitle}>9. Event changes</div>
        <p style={sectionBody}>Event dates, prices, availability, itineraries and other details can change. Your dashboard is the current source of event information. You agree to correct or remove outdated promotional content when reasonably requested.</p>
      </section>

      <section>
        <div style={sectionTitle}>10. Brand assets</div>
        <p style={sectionBody}>Any footage, logos, copy or other assets supplied by chapter அ may be used only to promote chapter அ events during this partnership. This limited permission is non-transferable and may be withdrawn. Ownership of those assets remains with their respective owners.</p>
      </section>

      <section>
        <div style={sectionTitle}>11. Your content and submitted edits</div>
        <p style={sectionBody}>You confirm that you have the rights and permissions needed for content you create or submit, including music, footage and appearances. If you send an edit to chapter அ for publication, you give us non-exclusive permission to format, publish, repost and promote it on chapter அ channels, with creator credit where reasonably practical.</p>
      </section>

      <section>
        <div style={sectionTitle}>12. Platform rules and third-party rights</div>
        <p style={sectionBody}>You are responsible for following Instagram, WhatsApp and other platform rules, advertising requirements and applicable laws. Your content must not infringe copyright, privacy, publicity or other third-party rights.</p>
      </section>

      <section>
        <div style={sectionTitle}>13. Private creator information</div>
        <p style={sectionBody}>Do not share unpublished event information, private group conversations, internal documents, unreleased assets or other information clearly provided in confidence without permission.</p>
      </section>

      <section>
        <div style={sectionTitle}>14. Suspension or ending the partnership</div>
        <p style={sectionBody}>chapter அ reserves the right to suspend or remove you from the creator partnership at any time, with immediate effect and without prior notice. If we find misconduct—including fraud, fake or manipulated activity, misleading promotion, harassment, misuse of brand assets or any breach of these terms—we reserve the right to withhold, reject or reverse any unpaid commission or payout connected to that misconduct. Any remaining legitimate earnings will remain subject to verification, these terms and applicable law.</p>
      </section>

      <section>
        <div style={sectionTitle}>15. Communications and data</div>
        <p style={sectionBody}>You agree that we may contact you about the partnership, event updates, submissions and payouts using your registered email, phone number or creator WhatsApp group. Your information will be used to operate and administer the creator partnership.</p>
      </section>

      <section>
        <div style={sectionTitle}>16. Changes and acceptance</div>
        <p style={sectionBody}>We may update these terms as the creator programme evolves and will communicate material changes when appropriate. By checking the box and selecting “I Agree”, you confirm that you have read, understood and accepted these Creator Terms &amp; Conditions.</p>
      </section>
    </div>
  );
}
