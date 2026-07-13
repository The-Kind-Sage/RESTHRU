import { createFileRoute } from "@tanstack/react-router";
import { NotFoundScene } from "../components/not-found-scene";

export const Route = createFileRoute("/not-found")({
  head: () => ({
    meta: [
      { title: "404 — This dish isn't on the menu" },
      {
        name: "description",
        content:
          "The page you're craving drifted off into the kitchen void. Head back home and pick another dish.",
      },
      { property: "og:title", content: "404 — This dish isn't on the menu" },
      {
        property: "og:description",
        content:
          "The page you're craving drifted off into the kitchen void. Head back home and pick another dish.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return <NotFoundScene />;
}