import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserMenu } from "@/components/UserMenu";

export default function Gallery() {
  const [warPeriod, setWarPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Fetch postcards with filters
  const { data: postcards, isLoading } = trpc.postcards.list.useQuery({
    warPeriod: warPeriod !== "all" ? (warPeriod as "WWI" | "WWII" | "Holocaust") : undefined,
    searchQuery: searchQuery || undefined,
  });

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with geometric shapes */}
      <header className="relative bg-card border-b border-border overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 geometric-shape geometric-shape-blue translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 geometric-shape geometric-shape-pink -translate-x-16 translate-y-16" />

        <div className="container relative py-16 md:py-24">
          <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <Button variant="ghost">
                ← Back to Home
              </Button>
            </Link>
            <UserMenu />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            Postcard Archive
          </h1>
          <p className="subtitle text-xl md:text-2xl max-w-2xl">
            Handwritten postcards from WWI, WWII, and the Holocaust
          </p>
        </div>
      </header>

      <main className="container py-12 md:py-16">
        {/* Filters */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by title or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {/* War Period Filter */}
            <Select value={warPeriod} onValueChange={setWarPeriod}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="WWI">WWI</SelectItem>
                <SelectItem value="WWII">WWII</SelectItem>
                <SelectItem value="Holocaust">Holocaust</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters display */}
          {(warPeriod !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {warPeriod !== "all" && (
                <Badge variant="secondary" className="gap-2">
                  {warPeriod}
                  <button
                    onClick={() => setWarPeriod("all")}
                    className="hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-2">
                  "{searchQuery}"
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchInput("");
                    }}
                    className="hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!postcards || postcards.length === 0) && (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No postcards found</h2>
            <p className="text-muted-foreground">
              {searchQuery || warPeriod !== "all"
                ? "Try adjusting your filters"
                : "The archive is currently empty"}
            </p>
          </div>
        )}

        {/* Postcard grid */}
        {!isLoading && postcards && postcards.length > 0 && (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              Showing {postcards.length} {postcards.length === 1 ? "postcard" : "postcards"}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {postcards.map((postcard) => (
                <Link key={postcard.id} href={`/postcard/${postcard.id}`}>
                  <Card className="card-hover overflow-hidden h-full">
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {postcard.primaryImage ? (
                        <img
                          src={postcard.primaryImage.s3Url}
                          alt={postcard.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}

                      {/* War period badge */}
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={
                            postcard.warPeriod === "WWI"
                              ? "secondary"
                              : postcard.warPeriod === "WWII"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {postcard.warPeriod}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {postcard.title}
                      </h3>

                      {postcard.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {postcard.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(postcard.dateFound).toLocaleDateString()}
                        </span>
                        {postcard.transcriptionStatus === "completed" && (
                          <Badge variant="outline" className="text-xs">
                            Transcribed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container py-12 text-center text-sm text-muted-foreground">
          <p>Historical Postcard Archive • Preserving handwritten history</p>
        </div>
      </footer>
    </div>
  );
}
