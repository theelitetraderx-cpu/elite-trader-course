import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CourseCard } from "@/components/public/course-card";
import { Button } from "@/components/ui/button";
import { DEMO_COURSES, COURSE_CURRICULUM } from "@/lib/data/demo-data";
import { MEMBER_CODE } from "@/lib/constants";

export default function CoursesPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">
          Learning Paths
        </p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          Structured Trading Programs
        </h1>
        <p className="text-[#A8A8A8] max-w-2xl mx-auto">
          Foundation, PRO, and ELITE — three clear paths from beginner discipline to
          professional execution. Use member code{" "}
          <span className="text-[#FFD700] font-medium">{MEMBER_CODE}</span> for
          discounted enrolment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {DEMO_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} href="/pricing" />
        ))}
      </div>

      <div className="space-y-8">
        {DEMO_COURSES.map((course) => {
          const curriculum = COURSE_CURRICULUM[course.slug];
          if (!curriculum) return null;
          return (
            <div key={course.id} className="glass-card p-6 md:p-8">
              <h2 className="font-heading text-2xl font-bold text-white mb-2">
                {course.title}
              </h2>
              {curriculum.includes && (
                <p className="text-[#D4AF37] text-sm mb-4">{curriculum.includes}</p>
              )}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {curriculum.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[#A8A8A8] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact">
                <Button variant="outline" size="sm">
                  Enrol in {course.title}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
