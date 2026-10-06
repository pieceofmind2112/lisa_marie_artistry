import { config } from "@/lib/config";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Text Message Policy · LisaMarie Artistry", robots: { index: true } };

export const dynamic = "force-dynamic";

// Public page for carrier (A2P 10DLC) registration: describes opt-in, message types and opt-out.
export default function SmsPolicy() {
  const name = config.businessName;
  const phone = config.businessPhone ? formatPhone(config.businessPhone) : null;
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-6 py-12 leading-relaxed text-silver">
      <h1 className="heading text-3xl">Text Message Policy</h1>
      <p>
        {name} is a hair and makeup business run by Lisa Marie. We send text messages only about appointments a
        client has booked with us.
      </p>
      <h2 className="heading text-xl">How you opt in</h2>
      <p>
        When you book an appointment with Lisa in person, by phone, or by text, she asks whether you&apos;d like
        appointment texts at the mobile number you give her. We only text you if you say yes.
      </p>
      <h2 className="heading text-xl">What we send</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>A confirmation when an appointment is booked or changed.</li>
        <li>A reminder the day before your appointment.</li>
      </ul>
      <p>Message frequency varies, usually 2 messages per appointment. Message and data rates may apply.</p>
      <h2 className="heading text-xl">How to opt out</h2>
      <p>
        Reply <strong>STOP</strong> to any message to stop receiving texts. Reply <strong>HELP</strong> for help
        {phone ? <>, or call {phone}</> : null}.
      </p>
      <h2 className="heading text-xl">Privacy</h2>
      <p>
        Your phone number and appointment details are used only to manage your appointments with {name}. We never
        sell or share your information, and mobile opt-in data is not shared with third parties or affiliates for
        marketing purposes.
      </p>
    </main>
  );
}
