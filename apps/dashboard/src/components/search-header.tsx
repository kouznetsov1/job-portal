"use client";

import * as React from "react";
import { Search, SlidersHorizontal, LayoutGrid, LayoutList } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

export type SortOption = "relevance" | "pubdate-desc" | "pubdate-asc";
export type ViewMode = "list" | "grid";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterToggle: () => void;
  resultsCount?: number;
  className?: string;
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onFilterToggle,
  resultsCount,
  className,
}: SearchHeaderProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Sök efter jobb, företag eller kompetens..."
          className="h-12 pl-10 pr-4 text-base"
          aria-label="Sök jobb"
        />
      </form>

      {/* Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Button (Mobile) */}
          <Button
            variant="outline"
            size="default"
            onClick={onFilterToggle}
            className="lg:hidden"
            aria-label="Öppna filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sortera:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Sortera resultat"
            >
              <option value="relevance">Relevans</option>
              <option value="pubdate-desc">Nyast först</option>
              <option value="pubdate-asc">Äldst först</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Results Count */}
          {resultsCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {resultsCount} {resultsCount === 1 ? "jobb" : "jobb"}
            </span>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "h-7 w-7 p-0",
                viewMode === "list" && "bg-primary text-primary-foreground"
              )}
              aria-label="Listvy"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "h-7 w-7 p-0",
                viewMode === "grid" && "bg-primary text-primary-foreground"
              )}
              aria-label="Rutnätsvy"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
