import { BRAND, ELITE_ADVANTAGES } from "@/lib/constants";
import { TEAM_MEMBERS, CONTENT_SYSTEM } from "@/lib/data/demo-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">About</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          {BRAND.name}
        </h1>
        <p className="text-[#A8A8A8] max-w-2xl mx-auto">{BRAND.footerDescription}</p>
      </div>

      <Card className="mb-10 p-8">
        <h2 className="font-heading text-2xl text-white mb-4">Our Mission</h2>
        <p className="text-[#A8A8A8] leading-relaxed mb-4">{BRAND.tagline}</p>
        <p className="text-[#A8A8A8] leading-relaxed">{BRAND.subtagline}</p>
      </Card>

      <div className="mb-10">
        <h2 className="font-heading text-2xl text-white mb-6">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ELITE_ADVANTAGES.map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#101010]"
            >
              <h3 className="text-[#FFD700] font-medium mb-2">{item.title}</h3>
              <p className="text-[#A8A8A8] text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="font-heading text-2xl text-white mb-6">The Team</h2>
        {TEAM_MEMBERS.map((member) => (
          <Card key={member.name} className="p-6">
            <h3 className="font-heading text-xl text-white">{member.name}</h3>
            <p className="text-[#D4AF37] text-sm mb-3">{member.role}</p>
            <p className="text-[#A8A8A8] text-sm mb-4">{member.bio}</p>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-2xl text-white mb-6">Content System</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTENT_SYSTEM.map((item) => (
            <Card key={item.title} className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-medium">{item.title}</h3>
                {item.upcoming && <Badge variant="gold">Upcoming</Badge>}
              </div>
              <p className="text-[#A8A8A8] text-sm">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
