import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Comments({
      provider: "giscus",
      options: {
        repo: "Amdhj22/amdhj22.github.io",
        repoId: "R_kgDOR72Y3g",
        category: "General",
        categoryId: "DIC_kwDOR72Y3s4C7DJb",
        mapping: "pathname",
        strict: false,
        reactionsEnabled: true,
        inputPosition: "bottom",
        lang: "ko",
        themeUrl: "https://giscus.app/themes",
        lightTheme: "light",
        darkTheme: "dark_dimmed",
      },
    }),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.SocialLinks({
      links: [
        { icon: "github", href: "https://github.com/Amdhj22", label: "GitHub" },
        { icon: "mail", href: "mailto:amdhj22@gmail.com", label: "Email" },
        { icon: "rss", href: "/index.xml", label: "RSS" },
      ],
    }),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({ enableTagView: true }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.SocialLinks({
      links: [
        { icon: "github", href: "https://github.com/Amdhj22", label: "GitHub" },
        { icon: "mail", href: "mailto:amdhj22@gmail.com", label: "Email" },
        { icon: "rss", href: "/index.xml", label: "RSS" },
      ],
    }),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({ enableTagView: true }),
  ],
  right: [],
}
