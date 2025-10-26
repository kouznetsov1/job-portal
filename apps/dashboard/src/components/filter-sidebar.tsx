"use client";

import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { cn } from "@repo/ui/lib/utils";

export type FilterState = {
  employmentTypes: string[];
  remote: boolean;
  experienceRequired: boolean;
  datePosted: "24h" | "week" | "month" | "all";
  municipalities: string[];
};

type FilterSidebarProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
  className?: string;
};

const EMPLOYMENT_TYPES = [
  { value: "heltid", label: "Heltid" },
  { value: "deltid", label: "Deltid" },
  { value: "visstid", label: "Visstid" },
  { value: "tillsvidare", label: "Tillsvidare" },
];

const DATE_OPTIONS = [
  { value: "24h", label: "Senaste 24 timmarna" },
  { value: "week", label: "Senaste veckan" },
  { value: "month", label: "Senaste månaden" },
  { value: "all", label: "Alla" },
] as const;

export function FilterSidebar({
  filters,
  onFiltersChange,
  onClearAll,
  open = false,
  onOpenChange,
  isMobile = false,
  className,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filters.employmentTypes.length > 0 ||
    filters.remote ||
    filters.experienceRequired ||
    filters.datePosted !== "all";

  const toggleEmploymentType = (type: string) => {
    const newTypes = filters.employmentTypes.includes(type)
      ? filters.employmentTypes.filter((t) => t !== type)
      : [...filters.employmentTypes, type];

    onFiltersChange({ ...filters, employmentTypes: newTypes });
  };

  const FilterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-lg">Filter</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-xs hover:text-primary"
          >
            Rensa alla
          </Button>
        )}
      </div>

      <Separator />

      {/* Employment Type */}
      <div className="space-y-3">
        <Label className="font-semibold text-foreground text-sm">
          Anställningstyp
        </Label>
        <div className="space-y-2">
          {EMPLOYMENT_TYPES.map((type) => (
            <label
              key={type.value}
              className="group flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                checked={filters.employmentTypes.includes(type.value)}
                onChange={() => toggleEmploymentType(type.value)}
                className="h-4 w-4 rounded border-border text-primary transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <span className="text-foreground text-sm group-hover:text-foreground/80">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Remote Work */}
      <div className="space-y-3">
        <Label className="font-semibold text-foreground text-sm">
          Arbetsplats
        </Label>
        <label className="group flex cursor-pointer items-center justify-between">
          <span className="text-foreground text-sm">Distansarbete</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.remote}
            onClick={() =>
              onFiltersChange({ ...filters, remote: !filters.remote })
            }
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              filters.remote ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                filters.remote ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </label>
      </div>

      <Separator />

      {/* Experience Required */}
      <div className="space-y-3">
        <Label className="font-semibold text-foreground text-sm">
          Erfarenhet
        </Label>
        <label className="group flex cursor-pointer items-center justify-between">
          <span className="text-foreground text-sm">Kräver erfarenhet</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.experienceRequired}
            onClick={() =>
              onFiltersChange({
                ...filters,
                experienceRequired: !filters.experienceRequired,
              })
            }
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              filters.experienceRequired ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                filters.experienceRequired ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </label>
      </div>

      <Separator />

      {/* Date Posted */}
      <div className="space-y-3">
        <Label className="font-semibold text-foreground text-sm">
          Publicerad
        </Label>
        <div className="space-y-2">
          {DATE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="group flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="datePosted"
                checked={filters.datePosted === option.value}
                onChange={() =>
                  onFiltersChange({ ...filters, datePosted: option.value })
                }
                className="h-4 w-4 border-border text-primary transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <span className="text-foreground text-sm group-hover:text-foreground/80">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filter Count */}
      {hasActiveFilters && (
        <>
          <Separator />
          <div className="text-muted-foreground text-xs">
            {filters.employmentTypes.length +
              (filters.remote ? 1 : 0) +
              (filters.experienceRequired ? 1 : 0) +
              (filters.datePosted !== "all" ? 1 : 0)}{" "}
            aktiva filter
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange ?? (() => { /* noop */ })}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filter</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{FilterContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-80 shrink-0 overflow-y-auto border-border border-r bg-card p-6",
        className
      )}
      aria-label="Jobbfilter"
    >
      {FilterContent}
    </aside>
  );
}
