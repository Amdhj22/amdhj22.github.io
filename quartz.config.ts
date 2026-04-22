import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Amdhj22",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "ko-KR",
    baseUrl: "Amdhj22.github.io",
    ignorePatterns: ["private", "templates", ".obsidian", "Archive", "Temp"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      // RBR (Red Bull Racing) palette — https://github.com/Amdhj22/rbr
      // Two-accent scheme: Kerb Red (#e84a55) primary, RB Yellow (#ffd84d) secondary
      colors: {
        lightMode: {
          light: "#fafbfd",
          lightgray: "#e1e4ed",
          gray: "#8590ae",
          darkgray: "#0a1128",
          dark: "#05091a",
          secondary: "#cc1e4a",
          tertiary: "#e84a55",
          highlight: "rgba(232, 74, 85, 0.1)",
          textHighlight: "#ffd84d88",
        },
        darkMode: {
          light: "#0a1128",
          lightgray: "#3a4466",
          gray: "#6a7495",
          darkgray: "#c8d0e8",
          dark: "#c8d0e8",
          secondary: "#e84a55",
          tertiary: "#ffd84d",
          highlight: "rgba(31, 42, 82, 0.5)",
          textHighlight: "#ffd84d55",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
