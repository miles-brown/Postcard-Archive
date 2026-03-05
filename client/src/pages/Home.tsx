import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Archive, Search, Clock } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-card">
        {/* Geometric shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] geometric-shape geometric-shape-blue translate-x-64 -translate-y-64" />
        <div className="absolute bottom-0 left-0 w-96 h-96 geometric-shape geometric-shape-pink -translate-x-32 translate-y-32" />

        <div className="container relative pt-6 flex justify-end">
          <UserMenu />
        </div>

        <div className="container relative pb-24 pt-12 md:pb-32 lg:pb-40">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              Historical
              <br />
              Postcard
              <br />
              Archive
            </h1>

            <p className="subtitle text-xl md:text-2xl mb-12 max-w-2xl">
              Preserving and transcribing handwritten postcards from WWI, WWII, and the Holocaust
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/gallery">
                <Button size="lg" className="text-lg px-8">
                  Explore Archive
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link href="/upload">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Upload Document
                </Button>
              </Link>

              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="subtitle text-lg md:text-xl max-w-2xl mx-auto">
            Automated discovery, transcription, and preservation of historical documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="card-hover">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Automated Discovery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our system continuously searches eBay for handwritten postcards related to WWI, WWII, and the Holocaust
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
                <Archive className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Transcription</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced OCR technology transcribes handwritten text, making historical documents searchable and accessible
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Public Archive</h3>
              <p className="text-muted-foreground leading-relaxed">
                All postcards and transcriptions are freely accessible, preserving history for future generations
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-card">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] geometric-shape geometric-shape-blue -translate-x-1/2 -translate-y-1/2" />

        <div className="container relative py-24 md:py-32 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Start Exploring
          </h2>
          <p className="subtitle text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Browse our growing collection of historical postcards and their transcriptions
          </p>

          <Link href="/gallery">
            <Button size="lg" className="text-lg px-8">
              View Gallery
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">Historical Postcard Archive</h3>
              <p className="text-sm text-muted-foreground">
                Preserving handwritten history through automated discovery and AI transcription
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-3">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/gallery">
                    <a className="text-muted-foreground hover:text-foreground transition-colors">
                      Gallery
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <a className="text-muted-foreground hover:text-foreground transition-colors">
                      About
                    </a>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3">War Periods</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>World War I (1914-1918)</li>
                <li>World War II (1939-1945)</li>
                <li>The Holocaust (1933-1945)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Historical Postcard Archive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
