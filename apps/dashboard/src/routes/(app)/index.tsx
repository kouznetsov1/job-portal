import { wsApi } from "@/lib/rpc";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { Cause } from "effect";
import { useState } from "react";
import { SearchHeader, type SortOption, type ViewMode } from "@/components/search-header";
import { JobCard, type JobCardData } from "@/components/job-card";
import { FilterSidebar, type FilterState } from "@/components/filter-sidebar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/utils";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return <JobSearchPage />;
}

function JobSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    employmentTypes: [],
    remote: false,
    experienceRequired: false,
    datePosted: "all",
    municipalities: [],
  });

  const searchResults = useAtomValue(
    wsApi.query(
      "jobads.search",
      {
        q: submittedQuery || " ",
        limit: 20,
        sort: sortBy,
        ...(filters.employmentTypes.length > 0 && {
          "employment-type": filters.employmentTypes,
        }),
        ...(filters.remote && { remote: true }),
        ...(filters.experienceRequired && { experience: true }),
      },
      {
        reactivityKeys: [`jobads-search-${submittedQuery}-${sortBy}`],
      }
    )
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  const handleClearFilters = () => {
    setFilters({
      employmentTypes: [],
      remote: false,
      experienceRequired: false,
      datePosted: "all",
      municipalities: [],
    });
  };

  const handleJobSave = (jobId: string) => {
    console.log("Save job:", jobId);
  };

  const handleJobHide = (jobId: string) => {
    console.log("Hide job:", jobId);
  };

  const handleJobApply = (jobId: string) => {
    console.log("Apply to job:", jobId);
  };

  return (
    <div className="flex h-full w-full">
      {/* Filter Sidebar - Desktop */}
      <div className="hidden lg:block">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Filter Sidebar - Mobile */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={handleClearFilters}
        open={filterOpen}
        onOpenChange={setFilterOpen}
        isMobile
      />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 lg:p-6">
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-background pb-6 pt-2">
            <SearchHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onFilterToggle={() => setFilterOpen(true)}
              {...(Result.match(searchResults, {
                onSuccess: (data) => ({ resultsCount: data.value.total?.value ?? 0 }),
                onInitial: () => ({}),
                onFailure: () => ({}),
              }))}
            />
          </div>

          {/* Results */}
          {submittedQuery && (
            <div>
              {Result.match(searchResults, {
                onInitial: () => (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <JobCardSkeleton key={i} />
                    ))}
                  </div>
                ),
                onFailure: (e) => (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
                    <p className="font-medium mb-2">Ett fel uppstod</p>
                    <p className="text-xs">{Cause.pretty(e.cause)}</p>
                  </div>
                ),
                onSuccess: (data) => (
                  <div>
                    {data.value.hits && data.value.hits.length > 0 ? (
                      <div
                        className={cn(
                          viewMode === "list" && "space-y-4",
                          viewMode === "grid" &&
                            "grid grid-cols-1 md:grid-cols-2 gap-4"
                        )}
                      >
                        {data.value.hits.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job as JobCardData}
                            onSave={handleJobSave}
                            onHide={handleJobHide}
                            onApply={handleJobApply}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-lg font-medium text-foreground mb-2">
                          Inga jobb hittades
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Prova att ändra dina sökkriterier eller filter
                        </p>
                      </div>
                    )}
                  </div>
                ),
              })}
            </div>
          )}

          {/* Empty State */}
          {!submittedQuery && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Hitta ditt drömjobb
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Börja genom att söka efter jobb, kompetenser eller företag som intresserar dig
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}
