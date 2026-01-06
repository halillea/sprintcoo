import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, CheckCircle, Bot, FileText, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SprintCOO</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Zap className="h-3 w-3" />
            Your Digital Chief Operating Officer
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Turn Chaos Into
            <br />
            <span className="text-primary">Executed Results</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            SprintCOO is an intelligent orchestration layer that triages your tasks,
            executes what it can, delegates to agents, and only returns to you what requires human judgment.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Auto-Execute</CardTitle>
                <CardDescription>
                  Content generation, web scraping, file processing - handled automatically
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Bot className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Delegation</CardTitle>
                <CardDescription>
                  Complex tasks get routed to specialized AI agents with detailed prompts
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Human Focus</CardTitle>
                <CardDescription>
                  Only decisions that truly need your judgment land in your queue
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <Card className="p-8 text-center">
            <CardContent className="pt-6">
              <h2 className="text-3xl font-bold mb-4">
                Ready to 10x Your Productivity?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join solopreneurs who handle their entire business with SprintCOO
              </p>
              <Button size="lg" asChild data-testid="button-start-free">
                <a href="/api/login">
                  Start Free Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>SprintCOO - Your Digital Chief Operating Officer</p>
        </div>
      </footer>
    </div>
  );
}
