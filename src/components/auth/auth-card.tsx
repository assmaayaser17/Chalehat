import { Logo } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
