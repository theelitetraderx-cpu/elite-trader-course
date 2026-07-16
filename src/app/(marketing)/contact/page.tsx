import { Mail, Send, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTACT, MEMBER_CODE } from "@/lib/constants";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">Contact</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          Enrol Now
        </h1>
        <p className="text-[#A8A8A8]">
          Reach out to get enrolled. Mention member code{" "}
          <span className="text-[#FFD700] font-medium">{MEMBER_CODE}</span> for discounted
          pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card className="text-center p-8">
          <Send className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="font-heading text-xl text-white mb-2">Telegram</h2>
          <p className="text-[#A8A8A8] text-sm mb-4">{CONTACT.telegram}</p>
          <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" className="w-full">
              Message on Telegram
            </Button>
          </a>
        </Card>

        <Card className="text-center p-8">
          <Mail className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="font-heading text-xl text-white mb-2">Email</h2>
          <p className="text-[#A8A8A8] text-sm mb-4 break-all">{CONTACT.email}</p>
          <a href={`mailto:${CONTACT.email}`}>
            <Button variant="outline" className="w-full">
              Send Email
            </Button>
          </a>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <MessageCircle className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
        <h2 className="font-heading text-xl text-white mb-2">Already a Member?</h2>
        <p className="text-[#A8A8A8] text-sm mb-6">{CONTACT.supportNote}</p>
        <Link href="/login">
          <Button variant="gold">Member Login</Button>
        </Link>
      </Card>
    </div>
  );
}
