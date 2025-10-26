import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { signIn } from "@/lib/auth";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Button } from "@repo/ui/components/button";
import { Briefcase } from "lucide-react";

const LoginFormSchema = Schema.Struct({
  email: Schema.String.pipe(
    Schema.minLength(1, { message: () => "E-post krävs" }),
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Ange en giltig e-postadress",
    }),
  ),
  password: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Lösenord krävs" }),
  ),
});

const FormSchema = Schema.standardSchemaV1(LoginFormSchema);

export function LoginForm() {
  const _navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: FormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: "/",
      });

      if (result.error) {
        formApi.setFieldMeta("email", (prev) => ({
          ...prev,
          errorMap: {
            onChange: result.error.message || "Inloggning misslyckades",
          },
        }));
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Logga in</CardTitle>
        <CardDescription>
          Ange din e-post och lösenord för att komma åt ditt konto
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <CardContent className="space-y-4 pb-0">
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>E-post</Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="namn@exempel.se"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]!.message}
                  </p>
                )}
              </div>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Lösenord</Label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]!.message}
                  </p>
                )}
              </div>
            )}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Loggar in..." : "Logga in"}
              </Button>
            )}
          />
          <p className="text-center text-muted-foreground text-sm">
            Har du inget konto?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Registrera dig
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
