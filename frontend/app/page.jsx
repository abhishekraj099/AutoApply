import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Send, Clock, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AutoApply</span>
          </div>
          <Link href="/dashboard">
            <Button>Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Automate Your Job
            <span className="text-primary"> Application Emails</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Schedule and send personalized job application emails to recruiters automatically.
            Attach your resume, manage email lists, and track delivery — all from one dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline" size="lg">Create Campaign</Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Send,
                  title: "Bulk & Custom Emails",
                  desc: "Send personalized emails to hundreds of recruiters with dynamic placeholders.",
                },
                {
                  icon: Clock,
                  title: "Smart Scheduling",
                  desc: "Schedule campaigns for optimal send times with recommended send windows.",
                },
                {
                  icon: Shield,
                  title: "Anti-Spam Protection",
                  desc: "Built-in rate limiting, random delays, and duplicate prevention.",
                },
                {
                  icon: Mail,
                  title: "Full Tracking",
                  desc: "Track every email — see sent, pending, and failed statuses in real time.",
                },
              ].map((feature, i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
                  <feature.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          AutoApply Mail Scheduler — Your personal job application automation tool
        </div>
      </footer>
    </div>
  );
}
