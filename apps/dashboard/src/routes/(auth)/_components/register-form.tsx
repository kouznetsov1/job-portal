import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { signUp } from "@/lib/auth";
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

const RegisterFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Namn krävs" }),
  ),
  email: Schema.String.pipe(
    Schema.minLength(1, { message: () => "E-post krävs" }),
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Ange en giltig e-postadress",
    }),
  ),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => "Lösenordet måste vara minst 8 tecken",
    }),
  ),
  confirmPassword: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Vänligen bekräfta ditt lösenord" }),
  ),
});

const FormSchema = Schema.standardSchemaV1(RegisterFormSchema);

export function RegisterForm() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: FormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (value.password !== value.confirmPassword) {
        formApi.setFieldMeta("confirmPassword", (prev) => ({
          ...prev,
          errorMap: {
            onChange: "Lösenorden matchar inte",
          },
        }));
        return;
      }

      const result = await signUp.email({
        email: value.email,
        password: value.password,
        name: value.name,
        callbackURL: "/",
      });

      if (result.error) {
        formApi.setFieldMeta("email", (prev) => ({
          ...prev,
          errorMap: {
            onChange: result.error.message || "Registrering misslyckades",
          },
        }));
      } else {
        navigate({ to: "/" });
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Skapa konto</CardTitle>
        <CardDescription>
          Ange dina uppgifter för att skapa ett nytt konto
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
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Namn</Label>
                <Input
                  id={field.name}
                  type="text"
                  placeholder="Anna Andersson"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]!.message}
                  </p>
                )}
              </div>
            )}
          />
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
                  <p className="text-sm text-destructive">
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
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]!.message}
                  </p>
                )}
              </div>
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Bekräfta lösenord</Label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
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
                {isSubmitting ? "Skapar konto..." : "Registrera"}
              </Button>
            )}
          />
          <p className="text-center text-sm text-muted-foreground">
            Har du redan ett konto?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Logga in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}