import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";

export const Route = createFileRoute("/test")({
  component: TestPage,
});

function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold">shadcn/ui Components Test</h1>
          <p className="text-muted-foreground mt-2">
            Testing components from @repo/ui
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Input</h2>
          <div className="space-y-4 max-w-md">
            <Input placeholder="Enter your name" />
            <Input type="email" placeholder="Enter your email" />
            <Input type="password" placeholder="Enter your password" />
            <Input disabled placeholder="Disabled input" />
          </div>
        </Card>
      </div>
    </div>
  );
}
