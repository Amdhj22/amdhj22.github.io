import { FileTrieNode } from "../../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type ContentDetailsWithDates = ContentDetails & { created?: string; modified?: string }

type TagInfo = { name: string; slug: string; count: number }
type TagCategoryData = { category: string; tags: TagInfo[] }

const RECENT_COUNT = 5

type MaybeHTMLElement = HTMLElement | undefined

interface ParsedOptions {
  folderClickBehavior: "collapse" | "link"
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: "sort" | "filter" | "map"[]
}

type FolderState = {
  path: string
  collapsed: boolean
}

let currentExplorerState: Array<FolderState>
function toggleExplorer(this: HTMLElement) {
  const nearestExplorer = this.closest(".explorer") as HTMLElement
  if (!nearestExplorer) return
  const explorerCollapsed = nearestExplorer.classList.toggle("collapsed")
  nearestExplorer.setAttribute(
    "aria-expanded",
    nearestExplorer.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )

  if (!explorerCollapsed) {
    // Stop <html> from being scrollable when mobile explorer is open
    document.documentElement.classList.add("mobile-no-scroll")
  } else {
    document.documentElement.classList.remove("mobile-no-scroll")
  }
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  // Check if target was svg icon or button
  const isSvg = target.nodeName === "svg"

  // corresponding <ul> element relative to clicked button/folder
  const folderContainer = (
    isSvg
      ? // svg -> div.folder-container
        target.parentElement
      : // button.folder-button -> div -> div.folder-container
        target.parentElement?.parentElement
  ) as MaybeHTMLElement
  if (!folderContainer) return
  const childFolderContainer = folderContainer.nextElementSibling as MaybeHTMLElement
  if (!childFolderContainer) return

  childFolderContainer.classList.toggle("open")

  // Collapse folder container
  const isCollapsed = !childFolderContainer.classList.contains("open")
  setFolderState(childFolderContainer, isCollapsed)

  const currentFolderState = currentExplorerState.find(
    (item) => item.path === folderContainer.dataset.folderpath,
  )
  if (currentFolderState) {
    currentFolderState.collapsed = isCollapsed
  } else {
    currentExplorerState.push({
      path: folderContainer.dataset.folderpath as FullSlug,
      collapsed: isCollapsed,
    })
  }

  const stringifiedFileTree = JSON.stringify(currentExplorerState)
  localStorage.setItem("fileTree", stringifiedFileTree)
}

function getRecentDate(d: ContentDetailsWithDates): number {
  const updated = d.modified ? new Date(d.modified).getTime() : 0
  const created = d.created ? new Date(d.created).getTime() : 0
  return Math.max(updated, created)
}

const RECENT_EXCLUDED_BASENAMES = new Set(["index", "readme", "til"])

function renderRecentNotes(
  currentSlug: FullSlug,
  entries: [FullSlug, ContentDetailsWithDates][],
  recentUl: Element,
) {
  const fileEntries = entries.filter(([slug, d]) => {
    const basename = slug.split("/").pop()?.toLowerCase() ?? ""
    return !RECENT_EXCLUDED_BASENAMES.has(basename) && (d.modified || d.created)
  })
  fileEntries.sort(([, a], [, b]) => getRecentDate(b) - getRecentDate(a))

  const top = fileEntries.slice(0, RECENT_COUNT)
  recentUl.innerHTML = ""

  for (const [slug, details] of top) {
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = resolveRelative(currentSlug, slug)
    a.dataset.for = slug
    a.textContent = details.title || slug.split("/").pop() || slug
    if (currentSlug === slug) a.classList.add("active")
    li.appendChild(a)
    recentUl.appendChild(li)
  }
}

function groupTrieByYear(
  trie: FileTrieNode,
  entries: [FullSlug, ContentDetailsWithDates][],
): Map<number, FileTrieNode[]> {
  const slugToYear = new Map<string, number>()
  for (const [slug, details] of entries) {
    if (details.created) {
      const year = new Date(details.created).getFullYear()
      slugToYear.set(slug, year)
    }
  }

  const getEarliestYear = (node: FileTrieNode): number | undefined => {
    if (!node.isFolder && slugToYear.has(node.slug)) {
      return slugToYear.get(node.slug)
    }
    const childYears = node.children
      .map(getEarliestYear)
      .filter((y): y is number => y !== undefined)
    return childYears.length > 0 ? Math.min(...childYears) : undefined
  }

  const groups = new Map<number, FileTrieNode[]>()
  for (const child of trie.children) {
    const year = getEarliestYear(child) ?? new Date().getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(child)
  }
  return groups
}

function createYearGroupNode(
  currentSlug: FullSlug,
  year: number,
  children: FileTrieNode[],
  opts: ParsedOptions,
): HTMLLIElement {
  const template = document.getElementById("template-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".folder-container") as HTMLElement
  const titleContainer = folderContainer.querySelector("div") as HTMLElement
  const folderOuter = li.querySelector(".folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  folderContainer.dataset.folderpath = `year-${year}`
  li.dataset.yearGroup = String(year)

  const span = titleContainer.querySelector(".folder-title") as HTMLElement
  span.textContent = String(year)

  const isCollapsed =
    currentExplorerState.find((item) => item.path === `year-${year}`)?.collapsed ?? false

  if (!isCollapsed) {
    folderOuter.classList.add("open")
  }

  for (const child of children) {
    const childNode = child.isFolder
      ? createFolderNode(currentSlug, child, opts)
      : createFileNode(currentSlug, child)
    ul.appendChild(childNode)
  }

  return li
}

function createFileNode(currentSlug: FullSlug, node: FileTrieNode): HTMLLIElement {
  const template = document.getElementById("template-file") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  a.href = resolveRelative(currentSlug, node.slug)
  a.dataset.for = node.slug
  a.textContent = node.displayName

  if (currentSlug === node.slug) {
    a.classList.add("active")
  }

  return li
}

function createFolderNode(
  currentSlug: FullSlug,
  node: FileTrieNode,
  opts: ParsedOptions,
): HTMLLIElement {
  const template = document.getElementById("template-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".folder-container") as HTMLElement
  const titleContainer = folderContainer.querySelector("div") as HTMLElement
  const folderOuter = li.querySelector(".folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  const folderPath = node.slug
  folderContainer.dataset.folderpath = folderPath

  if (currentSlug === folderPath) {
    folderContainer.classList.add("active")
  }

  if (opts.folderClickBehavior === "link") {
    // Replace button with link for link behavior
    const button = titleContainer.querySelector(".folder-button") as HTMLElement
    const a = document.createElement("a")
    a.href = resolveRelative(currentSlug, folderPath)
    a.dataset.for = folderPath
    a.className = "folder-title"
    a.textContent = node.displayName
    button.replaceWith(a)
  } else {
    const span = titleContainer.querySelector(".folder-title") as HTMLElement
    span.textContent = node.displayName
  }

  // if the saved state is collapsed or the default state is collapsed
  const isCollapsed =
    currentExplorerState.find((item) => item.path === folderPath)?.collapsed ??
    opts.folderDefaultState === "collapsed"

  // if this folder is a prefix of the current path we
  // want to open it anyways
  const simpleFolderPath = simplifySlug(folderPath)
  const folderIsPrefixOfCurrentSlug =
    simpleFolderPath === currentSlug.slice(0, simpleFolderPath.length)

  if (!isCollapsed || folderIsPrefixOfCurrentSlug) {
    folderOuter.classList.add("open")
  }

  for (const child of node.children) {
    const childNode = child.isFolder
      ? createFolderNode(currentSlug, child, opts)
      : createFileNode(currentSlug, child)
    ul.appendChild(childNode)
  }

  return li
}

function buildTagCategoryData(
  entries: [FullSlug, ContentDetailsWithDates][],
): TagCategoryData[] {
  // Group tags by top-level folder (category)
  const categoryTagCounts = new Map<string, Map<string, number>>()

  for (const [slug, details] of entries) {
    const tags = details.tags ?? []
    if (tags.length === 0) continue
    // Skip index/folder notes
    if (slug.endsWith("/index")) continue

    // Derive category from first path segment
    const segments = slug.split("/")
    const category = segments.length > 1 ? segments[0] : "기타"

    if (!categoryTagCounts.has(category)) {
      categoryTagCounts.set(category, new Map())
    }
    const tagCounts = categoryTagCounts.get(category)!
    for (const tag of tags) {
      // Skip meta tags like "til", "index"
      if (tag === "til" || tag === "index") continue
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }

  // Remove empty categories
  for (const [cat, tags] of categoryTagCounts) {
    if (tags.size === 0) categoryTagCounts.delete(cat)
  }

  const sortedCategories = [...categoryTagCounts.keys()].sort((a, b) => a.localeCompare(b))

  return sortedCategories.map((category) => {
    const tagCounts = categoryTagCounts.get(category)!
    const tags: TagInfo[] = [...tagCounts.entries()]
      .map(([name, count]) => ({
        name,
        slug: name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, ""),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    return { category, tags }
  })
}

function renderTagView(
  container: HTMLElement,
  categories: TagCategoryData[],
  baseDir: string,
) {
  container.innerHTML = ""

  const savedCategories: string[] = JSON.parse(
    localStorage.getItem("tag-categories-open") ?? "[]",
  )

  for (const cat of categories) {
    const catDiv = document.createElement("div")
    catDiv.className = "tag-category"

    const header = document.createElement("button")
    header.className = "tag-category-header"
    header.type = "button"
    header.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="5 8 14 8"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" class="tag-category-icon">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      <span>${cat.category}</span>
    `

    const body = document.createElement("div")
    body.className = "tag-category-body"
    if (savedCategories.includes(cat.category)) {
      body.classList.add("open")
    }

    const ul = document.createElement("ul")
    ul.className = "tag-pill-list"

    for (const t of cat.tags) {
      const li = document.createElement("li")
      const a = document.createElement("a")
      a.href = `${baseDir}/tags/${t.slug}`
      a.className = "internal tag-link"
      a.innerHTML = `${t.name}<span class="tag-count">${t.count}</span>`
      li.appendChild(a)
      ul.appendChild(li)
    }

    body.appendChild(ul)
    catDiv.appendChild(header)
    catDiv.appendChild(body)
    container.appendChild(catDiv)

    // Toggle handler
    const toggleHandler = () => {
      body.classList.toggle("open")
      // Save state
      const openCats: string[] = []
      document.querySelectorAll(".tag-category").forEach((c) => {
        const b = c.querySelector(".tag-category-body")
        const n = c.querySelector(".tag-category-header span")?.textContent ?? ""
        if (b?.classList.contains("open") && n) openCats.push(n)
      })
      localStorage.setItem("tag-categories-open", JSON.stringify(openCats))
    }
    header.addEventListener("click", toggleHandler)
    window.addCleanup(() => header.removeEventListener("click", toggleHandler))
  }
}

function switchExplorerView(view: "year" | "tag") {
  localStorage.setItem("explorer-active-view", view)

  document.querySelectorAll(".explorer-tab").forEach((tab) => {
    const tabEl = tab as HTMLElement
    if (tabEl.dataset.view === view) {
      tabEl.classList.add("active")
    } else {
      tabEl.classList.remove("active")
    }
  })

  const yearView = document.querySelector("[data-explorer-view='year']") as MaybeHTMLElement
  const tagView = document.querySelector("[data-explorer-view='tag']") as MaybeHTMLElement
  if (yearView) yearView.style.display = view === "year" ? "" : "none"
  if (tagView) tagView.style.display = view === "tag" ? "" : "none"
}

async function setupExplorer(currentSlug: FullSlug) {
  const allExplorers = document.querySelectorAll("div.explorer") as NodeListOf<HTMLElement>

  for (const explorer of allExplorers) {
    const dataFns = JSON.parse(explorer.dataset.dataFns || "{}")
    const opts: ParsedOptions = {
      folderClickBehavior: (explorer.dataset.behavior || "collapse") as "collapse" | "link",
      folderDefaultState: (explorer.dataset.collapsed || "collapsed") as "collapsed" | "open",
      useSavedState: explorer.dataset.savestate === "true",
      order: dataFns.order || ["filter", "map", "sort"],
      sortFn: new Function("return " + (dataFns.sortFn || "undefined"))(),
      filterFn: new Function("return " + (dataFns.filterFn || "undefined"))(),
      mapFn: new Function("return " + (dataFns.mapFn || "undefined"))(),
    }

    // Get folder state from local storage
    const storageTree = localStorage.getItem("fileTree")
    const serializedExplorerState = storageTree && opts.useSavedState ? JSON.parse(storageTree) : []
    const oldIndex = new Map<string, boolean>(
      serializedExplorerState.map((entry: FolderState) => [entry.path, entry.collapsed]),
    )

    const data = await fetchData
    const entries = [...Object.entries(data)] as [FullSlug, ContentDetailsWithDates][]
    const trie = FileTrieNode.fromEntries(entries)

    // Apply functions in order
    for (const fn of opts.order) {
      switch (fn) {
        case "filter":
          if (opts.filterFn) trie.filter(opts.filterFn)
          break
        case "map":
          if (opts.mapFn) trie.map(opts.mapFn)
          break
        case "sort":
          if (opts.sortFn) trie.sort(opts.sortFn)
          break
      }
    }

    // Get folder paths for state management
    const folderPaths = trie.getFolderPaths()
    const yearGroups = groupTrieByYear(trie, entries)
    const yearPaths = [...yearGroups.keys()].map((y) => `year-${y}`)

    currentExplorerState = [...yearPaths, ...folderPaths].map((path) => {
      const previousState = oldIndex.get(path)
      const isYearGroup = path.startsWith("year-")
      return {
        path,
        collapsed:
          previousState === undefined
            ? isYearGroup
              ? false
              : opts.folderDefaultState === "collapsed"
            : previousState,
      }
    })

    const explorerUl = explorer.querySelector(".explorer-ul")
    if (!explorerUl) continue

    const recentUl = explorer.querySelector(".explorer-recent-ul")
    if (recentUl) {
      renderRecentNotes(currentSlug, entries, recentUl)
    }

    const overflowEnd = explorerUl.querySelector(".overflow-end")
    while (explorerUl.firstChild && explorerUl.firstChild !== overflowEnd) {
      explorerUl.removeChild(explorerUl.firstChild)
    }

    const fragment = document.createDocumentFragment()
    const sortedYears = [...yearGroups.keys()].sort((a, b) => b - a)

    for (const year of sortedYears) {
      const children = yearGroups.get(year)!
      const yearLi = createYearGroupNode(currentSlug, year, children, opts)
      fragment.appendChild(yearLi)
    }
    explorerUl.insertBefore(fragment, overflowEnd ?? null)

    // restore explorer scrollTop position if it exists
    const scrollTop = sessionStorage.getItem("explorerScrollTop")
    if (scrollTop) {
      explorerUl.scrollTop = parseInt(scrollTop)
    } else {
      // try to scroll to the active element if it exists
      const activeElement = explorerUl.querySelector(".active")
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth" })
      }
    }

    // Build tag view if enabled
    const enableTagView = explorer.dataset.enableTagView === "true"
    if (enableTagView) {
      const tagContainer = explorer.querySelector(".tag-explorer") as MaybeHTMLElement
      if (tagContainer) {
        const categories = buildTagCategoryData(entries)
        // Derive baseDir from current slug
        const depth = currentSlug.split("/").length - 1
        const baseDir = depth > 0 ? Array(depth).fill("..").join("/") : "."
        renderTagView(tagContainer, categories, baseDir)

        // Highlight active tag
        const tagMatch = currentSlug.match(/^tags\/(.+)$/)
        if (tagMatch) {
          const activeTag = tagContainer.querySelector(
            `a.tag-link[href$='/tags/${CSS.escape(tagMatch[1])}']`,
          ) as MaybeHTMLElement
          if (activeTag) activeTag.classList.add("is-active")
        }
      }

      // Restore active view
      const savedView = localStorage.getItem("explorer-active-view") as "year" | "tag" | null
      const activeView = savedView === "tag" ? "tag" : "year"

      const yearView = explorer.querySelector("[data-explorer-view='year']") as MaybeHTMLElement
      const tagView = explorer.querySelector("[data-explorer-view='tag']") as MaybeHTMLElement
      if (yearView && tagView) {
        yearView.style.display = activeView === "year" ? "" : "none"
        tagView.style.display = activeView === "tag" ? "" : "none"
      }

      // Update tab active states
      explorer.querySelectorAll(".explorer-tab").forEach((tab) => {
        const tabEl = tab as HTMLElement
        if (tabEl.dataset.view === activeView) {
          tabEl.classList.add("active")
        } else {
          tabEl.classList.remove("active")
        }
      })

      // Tab click handlers
      explorer.querySelectorAll(".explorer-tab").forEach((tab) => {
        const tabEl = tab as HTMLElement
        const handler = () => switchExplorerView(tabEl.dataset.view as "year" | "tag")
        tabEl.addEventListener("click", handler)
        window.addCleanup(() => tabEl.removeEventListener("click", handler))
      })
    }

    // Set up event handlers
    const explorerButtons = explorer.getElementsByClassName(
      "explorer-toggle",
    ) as HTMLCollectionOf<HTMLElement>
    for (const button of explorerButtons) {
      button.addEventListener("click", toggleExplorer)
      window.addCleanup(() => button.removeEventListener("click", toggleExplorer))
    }

    // Set up folder click handlers
    if (opts.folderClickBehavior === "collapse") {
      const folderButtons = explorer.getElementsByClassName(
        "folder-button",
      ) as HTMLCollectionOf<HTMLElement>
      for (const button of folderButtons) {
        button.addEventListener("click", toggleFolder)
        window.addCleanup(() => button.removeEventListener("click", toggleFolder))
      }
    }

    const folderIcons = explorer.getElementsByClassName(
      "folder-icon",
    ) as HTMLCollectionOf<HTMLElement>
    for (const icon of folderIcons) {
      icon.addEventListener("click", toggleFolder)
      window.addCleanup(() => icon.removeEventListener("click", toggleFolder))
    }
  }
}

document.addEventListener("prenav", async () => {
  // save explorer scrollTop position
  const explorer = document.querySelector(".explorer-ul")
  if (!explorer) return
  sessionStorage.setItem("explorerScrollTop", explorer.scrollTop.toString())
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const currentSlug = e.detail.url
  await setupExplorer(currentSlug)

  // if mobile hamburger is visible, collapse by default
  for (const explorer of document.getElementsByClassName("explorer")) {
    const mobileExplorer = explorer.querySelector(".mobile-explorer")
    if (!mobileExplorer) return

    if (mobileExplorer.checkVisibility()) {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")

      // Allow <html> to be scrollable when mobile explorer is collapsed
      document.documentElement.classList.remove("mobile-no-scroll")
    }

    mobileExplorer.classList.remove("hide-until-loaded")
  }
})

window.addEventListener("resize", function () {
  // Desktop explorer opens by default, and it stays open when the window is resized
  // to mobile screen size. Applies `no-scroll` to <html> in this edge case.
  const explorer = document.querySelector(".explorer")
  if (explorer && !explorer.classList.contains("collapsed")) {
    document.documentElement.classList.add("mobile-no-scroll")
    return
  }
})

function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}
