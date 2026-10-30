import { createFileRoute } from "@tanstack/react-router";
import { UrlStudio } from "@/components/url-studio";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <UrlStudio />;
}
