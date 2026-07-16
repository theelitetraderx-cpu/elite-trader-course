import Link from "next/link";
import {
  GraduationCap,
  HeartHandshake,
  Users,
  RefreshCw,
  Video,
  Map,
  Target,
  Shield,
  Star,
  Clock,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { Course } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  HeartHandshake,
  Users,
  RefreshCw,
  Video,
  Map,
  Target,
  Shield,
};

interface CourseCardProps {
  course: Course;
  enrolled?: boolean;
  href?: string;
}

export function CourseCard({ course, enrolled, href }: CourseCardProps) {
  const link = href || `/courses/${course.slug}`;

  return (
    <Link href={link}>
      <Card hover className="h-full overflow-hidden group">
        <div className="relative h-48 -mx-6 -mt-6 mb-6 bg-gradient-to-br from-[#181818] to-[#101010] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8860B]/20 border border-[rgba(212,175,55,0.3)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <Badge variant="gold">{course.category}</Badge>
          </div>
          {enrolled && (
            <div className="absolute top-4 right-4 z-20">
              <Badge variant="success">Enrolled</Badge>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold text-white group-hover:text-[#FFD700] transition-colors">
              {course.title}
            </h3>
            <div className="flex items-center gap-1 text-[#FFD700] shrink-0">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-numbers text-sm">{course.rating}</span>
            </div>
          </div>

          <p className="text-[#A8A8A8] text-sm line-clamp-2">{course.description}</p>

          <p className="text-[#D4AF37] text-sm">{course.instructor}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{course.difficulty}</Badge>
            <Badge variant="default">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(course.duration_minutes)}
            </Badge>
            <Badge variant="default">{course.lesson_count} Lessons</Badge>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.15)]">
            <div>
              <span className="font-numbers text-2xl font-bold text-[#FFD700]">
                ${course.price.toLocaleString()}
              </span>
            </div>
            <span className="text-[#A8A8A8] text-xs">
              {course.student_count.toLocaleString()} students
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface WhyChooseCardProps {
  title: string;
  description: string;
  icon: string;
}

export function WhyChooseCard({ title, description, icon }: WhyChooseCardProps) {
  const Icon = iconMap[icon] || Target;

  return (
    <Card hover className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8860B]/10 border border-[rgba(212,175,55,0.3)] flex items-center justify-center mx-auto mb-6">
        <Icon className="w-7 h-7 text-[#D4AF37]" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-[#A8A8A8] text-sm leading-relaxed">{description}</p>
    </Card>
  );
}
