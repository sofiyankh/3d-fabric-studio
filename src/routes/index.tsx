import { createFileRoute } from "@tanstack/react-router";
import { GarmentViewer } from "@/components/GarmentViewer";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "FORM/ARCHIVE — Production 3D Garment Viewer" },
      { name: "description", content: "Inspect production garment geometry and fabric materials in an interactive studio." },
      { property: "og:title", content: "FORM/ARCHIVE — Production 3D Garment Viewer" },
      { property: "og:description", content: "Inspect production garment geometry and fabric materials in an interactive studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GarmentViewer />;
}
