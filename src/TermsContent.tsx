// Single source of truth for the Terms & Conditions body.
//
// Rendered in four places so they can never drift apart again:
//   • /invite booking T&C bottom sheet            (App.tsx)
//   • standalone /terms page                       (App.tsx, TermsScreen)
//   • booking-application flow T&C sheet           (AppFlow.tsx, showTcModal)
//   • booking-application flow policy modal → T&C  (AppFlow.tsx, showPolicyModal==='tc')
//
// To change the terms, edit ONLY this file — every surface updates together.
export function TermsContent() {
  return (
    <div className="space-y-4 text-[14px] text-gray-600 leading-relaxed">
      <p><strong className="text-gray-900">1. Booking Confirmation</strong><br />All bookings are subject to availability and confirmation by the Event Management Company (“CHAPTER”). A booking shall be considered confirmed only after receipt of the required full payment.</p>
      <p><strong className="text-gray-900">2. Payments</strong><br />The client shall make payments as per the schedule communicated by the Company. Failure to make timely payments may result in cancellation of the booking without prior notice.</p>
      <p><strong className="text-gray-900">3. Cancellation and Refund Policy</strong><br />Cancellation requests must be made in writing by email or message. Refunds, if applicable, shall be processed after deducting cancellation charges, taxes, and non-refundable expenses. No refund shall be provided for unused services, missed flights, late arrivals, or voluntary withdrawal from the event.</p>
      <p><strong className="text-gray-900">4. Travel Documents</strong><br />The client is solely responsible for carrying valid identification documents, passports, visas, permits, tickets, and other travel-related documents required for the journey.</p>
      <p><strong className="text-gray-900">5. Changes to Itinerary</strong><br />The Company reserves the right to alter, modify, postpone, or cancel any part of the itinerary due to weather conditions, natural disasters, political disturbances, transport issues, or any unavoidable circumstances.</p>
      <div>
        <strong className="text-gray-900">6. Client Responsibilities</strong>
        <p className="mt-1">The client shall:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Follow all travel instructions and safety guidelines.</li>
          <li>Maintain proper conduct during the event.</li>
          <li>Be responsible for personal belongings and valuables.</li>
          <li>Compensate for any damage caused to hotel property, vehicle, or third-party property.</li>
        </ul>
      </div>
      <p><strong className="text-gray-900">7. Health and Medical Conditions</strong><br />Clients must disclose any medical condition, disability, allergy, or special requirement before the commencement of the event. The Company shall not be liable for any medical emergencies arising during the event.</p>
      <div>
        <strong className="text-gray-900">8. Liability Limitation</strong>
        <p className="mt-1">The Company acts only as a facilitator for transportation, accommodation, and other services. The Company shall not be liable for:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Injury, death, accident, loss, or damage.</li>
          <li>Delay or cancellation by airlines, hotels, or transport operators.</li>
          <li>Theft, natural calamities, strikes, riots, or force majeure events.</li>
        </ul>
        <p className="mt-2">If any participant is involved in unlawful activities, possession or consumption of prohibited drugs, public nuisance, violence, harassment, drunken misconduct, or any act resulting in police complaint or criminal proceedings, the participant alone shall be personally responsible for such acts and consequences. The company/event organiser shall not be liable for any arrest, detention, penalty, criminal case, or police action initiated by authorities.</p>
      </div>
      <p><strong className="text-gray-900">9. Insurance</strong><br />Clients are advised to obtain suitable travel and medical insurance at their own cost before undertaking the event.</p>
      <p><strong className="text-gray-900">10. Accommodation and Transport</strong><br />Hotel rooms, vehicle types, and transport facilities are subject to availability. Equivalent alternatives may be provided if required.</p>
      <p><strong className="text-gray-900">11. Code of Conduct</strong><br />The Company reserves the right to remove any client from the event without refund if the client engages in illegal, abusive, violent, or disruptive behavior.</p>
      <p><strong className="text-gray-900">12. Photography and Media</strong><br />Photographs or videos taken during the event may be used by the Company for promotional purposes.</p>
      <p><strong className="text-gray-900">13. Force Majeure</strong><br />The Company shall not be held responsible for failure or delay in performance due to events beyond reasonable control, including acts of God, pandemic, flood, earthquake, war, or government restrictions.</p>
      <p><strong className="text-gray-900">14. Dispute Resolution</strong><br />Any dispute arising between the client and the Company shall be subject to the jurisdiction of the competent courts having territorial jurisdiction over the Company’s registered office.</p>
      <p><strong className="text-gray-900">15. WhatsApp Communication</strong><br />By providing your number, you consent to receiving logistic updates and booking reminders on WhatsApp.</p>
      <p><strong className="text-gray-900">16. Age Requirement</strong><br />Certain experiences are strictly 21+. Participants must meet the minimum age requirement specified for each experience. Valid ID proof may be required. Failure to meet the age requirement may result in denial of entry without refund.</p>
      <p><strong className="text-gray-900">17. Acceptance of Terms</strong><br />By confirming the booking and making payment, the client acknowledges that they have read, understood, and agreed to these Terms and Conditions.</p>
      <div>
        <strong className="text-gray-900">18. Client Declaration</strong>
        <p className="mt-1">I hereby declare and confirm that:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>I am participating in the event voluntarily and at my own risk.</li>
          <li>I shall obey all instructions, safety guidelines, and rules issued by the event organizer/management during the entire event.</li>
          <li>I confirm that I am physically and mentally fit to participate in the event activities.</li>
          <li>I understand that the organizer shall not be responsible for any loss, theft, injury, accident, illness, delay, natural calamity, or unforeseen incident occurring during the event.</li>
          <li>I undertake not to carry or consume any prohibited drugs, narcotic substances, or illegal items during the event.</li>
          <li>I understand that consumption of alcohol, smoking, or any prohibited activity shall be strictly subject to applicable law and organizer policy, and any misconduct by me shall be my sole responsibility.</li>
          <li>I agree to behave respectfully with fellow travelers, hotel staff, vehicle staff, guides, and the public.</li>
          <li>I shall be personally liable for any damage caused by me to property, vehicle, accommodation, or any third party.</li>
          <li>I understand that violation of rules or unlawful conduct may result in removal from the event without refund.</li>
          <li>I understand and agree that the event organizer/management shall not be responsible for providing medical treatment, medical expenses, ambulance services, or emergency healthcare assistance during the event. In case of any medical emergency, illness, injury, or accident, the participant shall arrange treatment at his/her own cost and responsibility.</li>
          <li>I have read, understood, and agreed to all the terms and conditions of the event voluntarily without coercion.</li>
        </ul>
      </div>
    </div>
  );
}
