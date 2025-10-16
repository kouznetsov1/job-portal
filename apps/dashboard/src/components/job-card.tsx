"use client";

import { MapPin, Calendar, Building2, Heart, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";

export interface JobCardData {
  id: string;
  title: string;
  company?: {
    name: string;
    logo?: string | null;
  } | null;
  municipality?: string | null;
  region?: string | null;
  employmentType?: string | null;
  applicationDeadline?: string | null;
  description?: string;
  relevance?: number;
  publishedAt?: string;
}

interface JobCardProps {
  job: JobCardData;
  onSave?: (jobId: string) => void;
  onHide?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  className?: string;
  isSaved?: boolean;
}

export function JobCard({
  job,
  onSave,
  onHide,
  onApply,
  className,
  isSaved = false,
}: JobCardProps) {
  const matchPercentage = job.relevance ? Math.round(job.relevance * 100) : null;

  const location = [
    job.municipality,
    job.region,
  ]
    .filter(Boolean)
    .join(", ");

  const daysUntilDeadline = job.applicationDeadline
    ? Math.ceil(
        (new Date(job.applicationDeadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isDeadlineSoon = daysUntilDeadline !== null && daysUntilDeadline <= 7;

  return (
    <article
      className={cn(
        "group relative rounded-lg border border-border bg-card p-6 transition-all duration-200",
        "hover:shadow-md hover:border-border/80",
        className
      )}
    >
      {/* Header: Company Logo + Match Badge */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Company Logo Placeholder */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={`${job.company.name} logotyp`}
                className="h-full w-full rounded-md object-contain"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Job Title */}
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1">
              {job.title || "Ej angiven tjänst"}
            </h3>

            {/* Company Name */}
            {job.company?.name && (
              <p className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors cursor-pointer">
                {job.company.name}
              </p>
            )}
          </div>
        </div>

        {/* Match Badge */}
        {matchPercentage !== null && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
              matchPercentage >= 70 &&
                "border-primary/20 bg-primary/10 text-primary",
              matchPercentage >= 40 &&
                matchPercentage < 70 &&
                "border-border bg-muted text-foreground",
              matchPercentage < 40 &&
                "border-border bg-muted/50 text-muted-foreground"
            )}
            aria-label={`Matchning: ${matchPercentage} procent`}
          >
            {matchPercentage}%
          </div>
        )}
      </div>

      {/* Metadata Row */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
        )}

        {job.employmentType && (
          <Badge variant="outline" className="bg-muted/50">
            {job.employmentType}
          </Badge>
        )}

        {job.applicationDeadline && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              isDeadlineSoon && "font-medium text-orange-600 dark:text-orange-500"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Ansök senast:{" "}
              {new Date(job.applicationDeadline).toLocaleDateString("sv-SE")}
            </span>
          </div>
        )}
      </div>

      {/* Description Preview */}
      {job.description && (
        <p
          className="mb-4 line-clamp-2 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: job.description.replace(/<[^>]*>/g, ' ').substring(0, 200)
          }}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="default"
          onClick={() => onApply?.(job.id)}
          className="flex-1 sm:flex-none"
        >
          Ansök nu
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onSave?.(job.id)}
          className={cn(
            "transition-colors",
            isSaved && "text-primary hover:text-primary/80"
          )}
          aria-label={isSaved ? "Ta bort från sparade" : "Spara jobb"}
          aria-pressed={isSaved}
        >
          <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onHide?.(job.id)}
          className="hover:text-destructive"
          aria-label="Dölj jobb"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
