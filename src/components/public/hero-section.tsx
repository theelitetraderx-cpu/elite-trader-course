"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND, STATS } from "@/lib/constants";
import { ParticlesBackground } from "@/components/shared/particles-background";

const CHART_BARS = Array.from({ length: 40 }, (_, i) => ({
  height: 30 + ((i * 37 + 17) % 120),
  isGreen: (i * 7) % 10 > 4,
}));

export function HeroSection() {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const bars = chartRef.current.querySelectorAll(".chart-bar");
    gsap.fromTo(
      bars,
      { scaleY: 0, transformOrigin: "bottom" },
      {
        scaleY: 1,
        duration: 1.2,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.5,
      }
    );
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticlesBackground />

      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-10" />
      <div className="absolute inset-0 bg-grid z-10 opacity-50" />

      {/* Animated chart background */}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-20 z-10">
        <svg
          ref={chartRef}
          viewBox="0 0 1200 200"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {CHART_BARS.map((bar, i) => (
              <rect
                key={i}
                className="chart-bar"
                x={i * 30 + 5}
                y={200 - bar.height}
                width={20}
                height={bar.height}
                fill={bar.isGreen ? "#D4AF37" : "#B8860B"}
                opacity={0.6}
              />
            ))}
        </svg>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[rgba(212,175,55,0.3)] text-[#D4AF37] text-xs uppercase tracking-widest mb-8">
            {BRAND.motto}
          </span>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Think Smart.<br />
            Trade Wise.<br />
            <span className="text-gold-gradient">Become Elite.</span>
          </h1>

          <p className="text-[#A8A8A8] text-lg max-w-2xl mx-auto mb-12">
            {BRAND.subtagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/contact">
              <Button variant="gold" size="lg" className="min-w-[180px]">
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" size="lg" className="min-w-[180px]">
                <Play className="w-4 h-4" />
                Explore Courses
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card p-6 text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="font-numbers text-3xl md:text-4xl font-bold text-[#FFD700] mb-2">
                {stat.value}
              </div>
              <div className="text-[#A8A8A8] text-sm uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
