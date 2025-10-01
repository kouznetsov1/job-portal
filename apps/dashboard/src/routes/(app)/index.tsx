import { api, wsApi } from "@/lib/rpc";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cause } from "effect";
import { useState } from "react";
import { foo } from "@repo/domain";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return (
    <div className="container mx-auto p-4">
      <div>{foo}</div>
      <h1 className="text-3xl font-bold mb-6">Job Search</h1>
      <JobSearch />
      <hr className="my-8" />
      <div className="mt-8">
        <Link to="/job" className="text-blue-600 hover:underline">
          Go to another page (preloads on hover)
        </Link>
        <div className="mt-4">
          Job example:
          <Job />
        </div>
      </div>
    </div>
  );
}

function JobSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const searchResults = useAtomValue(
    wsApi.query(
      "jobads.search",
      {
        q: submittedQuery || " ", // Use a space as default to avoid empty string
        limit: 20,
        sort: "relevance" as const,
      },
      {
        reactivityKeys: [`jobads-search-${submittedQuery}`],
      },
    ),
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for jobs... (e.g., developer, designer, stockholm)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      {submittedQuery && (
        <div>
          {Result.match(searchResults, {
            onInitial: () => <div className="text-gray-500">Loading...</div>,
            onFailure: (e) => (
              <div className="text-red-600">Error: {Cause.pretty(e.cause)}</div>
            ),
            onSuccess: (data) => (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Found {data.value.total?.value || 0} jobs
                </div>

                {data.value.hits && data.value.hits.length > 0 ? (
                  <div className="grid gap-4">
                    {data.value.hits.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.headline || "Untitled Position"}
                        </h3>

                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {job.employer?.name && (
                            <p>
                              <span className="font-medium">Company:</span>{" "}
                              {job.employer.name}
                            </p>
                          )}

                          {job.workplace_address && (
                            <p>
                              <span className="font-medium">Location:</span>{" "}
                              {[
                                job.workplace_address.municipality,
                                job.workplace_address.region,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}

                          {job.employment_type?.label && (
                            <p>
                              <span className="font-medium">Type:</span>{" "}
                              {job.employment_type.label}
                            </p>
                          )}

                          {job.application_deadline && (
                            <p>
                              <span className="font-medium">Deadline:</span>{" "}
                              {new Date(
                                job.application_deadline,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {job.description?.text && (
                          <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                            {job.description.text}
                          </p>
                        )}

                        {job.relevance !== undefined && (
                          <div className="mt-3 text-xs text-gray-500">
                            Relevance:{" "}
                            {(job.relevance ? job.relevance * 100 : 0).toFixed(
                              0,
                            )}
                            %
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    No jobs found. Try a different search term.
                  </div>
                )}
              </div>
            ),
          })}
        </div>
      )}
    </div>
  );
}

function Job() {
  const thing = useAtomValue(api.query("job.get", { id: 1337 }));

  return (
    <div>
      {Result.match(thing, {
        onInitial: () => <div>Loading...</div>,
        onFailure: (e) => <div>failed: {Cause.pretty(e.cause)}</div>,
        onSuccess: (d) => (
          <div>
            {d.value.id}: {d.value.name}
          </div>
        ),
      })}
    </div>
  );
}
