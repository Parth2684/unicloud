import { create } from "zustand";
import { MAX_RECENT_LOCATIONS, STORAGE_KEYS } from "@/constants/storage-keys";
import { readJson, writeJson } from "@/lib/storage";
import {
  driveHref,
  locationKey,
  rootPath,
  type DriveLocation,
  type FavoriteFolder,
  type PathSegment,
  type RecentLocation,
  type TreeNodeCache,
} from "./types";

type NavigationState = {
  path: PathSegment[];
  driveId: string | null;
  folderId?: string;
  history: DriveLocation[];
  historyIndex: number;
  favorites: FavoriteFolder[];
  recent: RecentLocation[];
  expanded: Record<string, boolean>;
  lastFolderByDrive: Record<string, DriveLocation>;
  pathCache: Record<string, PathSegment[]>;
  treeCache: Record<string, TreeNodeCache>;
  folderFilter: string;
  commandOpen: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
};

type NavigationActions = {
  hydrate: () => void;
  setLocation: (loc: DriveLocation, options?: { pushHistory?: boolean }) => void;
  navigateTo: (loc: DriveLocation) => string;
  goBack: () => string | null;
  goForward: () => string | null;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  jumpToBreadcrumb: (index: number) => string | null;
  rememberPath: (driveId: string, folderId: string | undefined, path: PathSegment[]) => void;
  getCachedPath: (driveId: string, folderId?: string) => PathSegment[] | null;
  toggleFavorite: (fav: FavoriteFolder) => void;
  isFavorite: (driveId: string, folderId: string) => boolean;
  addRecent: (loc: DriveLocation) => void;
  toggleExpanded: (key: string) => void;
  setExpanded: (key: string, open: boolean) => void;
  setTreeChildren: (key: string, children: { id: string; name: string }[]) => void;
  getTreeChildren: (key: string) => { id: string; name: string }[] | null;
  setFolderFilter: (value: string) => void;
  setCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  getLastLocation: (driveId: string) => DriveLocation | null;
};

const emptyState = (): NavigationState => ({
  path: rootPath(),
  driveId: null,
  folderId: undefined,
  history: [],
  historyIndex: -1,
  favorites: [],
  recent: [],
  expanded: {},
  lastFolderByDrive: {},
  pathCache: {},
  treeCache: {},
  folderFilter: "",
  commandOpen: false,
  sidebarOpen: false,
  sidebarCollapsed: false,
});

function persistUi(state: NavigationState) {
  writeJson(STORAGE_KEYS.favorites, state.favorites);
  writeJson(STORAGE_KEYS.recentLocations, state.recent);
  writeJson(STORAGE_KEYS.expandedFolders, state.expanded);
  writeJson(STORAGE_KEYS.lastFolderByDrive, state.lastFolderByDrive);
  writeJson(STORAGE_KEYS.pathCache, state.pathCache);
  writeJson(STORAGE_KEYS.sidebarCollapsed, state.sidebarCollapsed);
}

export const useNavigationStore = create<NavigationState & NavigationActions>((set, get) => ({
  ...emptyState(),

  hydrate: () => {
    set({
      favorites: readJson(STORAGE_KEYS.favorites, [] as FavoriteFolder[]),
      recent: readJson(STORAGE_KEYS.recentLocations, [] as RecentLocation[]),
      expanded: readJson(STORAGE_KEYS.expandedFolders, {} as Record<string, boolean>),
      lastFolderByDrive: readJson(
        STORAGE_KEYS.lastFolderByDrive,
        {} as Record<string, DriveLocation>,
      ),
      pathCache: readJson(STORAGE_KEYS.pathCache, {} as Record<string, PathSegment[]>),
      sidebarCollapsed: readJson(STORAGE_KEYS.sidebarCollapsed, false),
    });
  },

  setLocation: (loc, options) => {
    const pushHistory = options?.pushHistory ?? true;
    const key = locationKey(loc.driveId, loc.folderId);
    const path = loc.path.length > 0 ? loc.path : rootPath();

    set((state) => {
      let history = state.history;
      let historyIndex = state.historyIndex;

      if (pushHistory) {
        const current = history[historyIndex];
        const same =
          current &&
          current.driveId === loc.driveId &&
          current.folderId === loc.folderId;

        if (!same) {
          history = [...history.slice(0, historyIndex + 1), { ...loc, path }];
          historyIndex = history.length - 1;
        }
      }

      const lastFolderByDrive = {
        ...state.lastFolderByDrive,
        [loc.driveId]: { ...loc, path },
      };
      const pathCache = { ...state.pathCache, [key]: path };

      const next = {
        ...state,
        driveId: loc.driveId,
        folderId: loc.folderId,
        path,
        history,
        historyIndex,
        lastFolderByDrive,
        pathCache,
      };
      persistUi(next);
      return next;
    });

    get().addRecent({ ...loc, path });
  },

  navigateTo: (loc) => {
    get().setLocation(loc, { pushHistory: true });
    return driveHref(loc.driveId, loc.folderId);
  },

  goBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const nextIndex = historyIndex - 1;
    const loc = history[nextIndex];
    set({ historyIndex: nextIndex, driveId: loc.driveId, folderId: loc.folderId, path: loc.path });
    return driveHref(loc.driveId, loc.folderId);
  },

  goForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const nextIndex = historyIndex + 1;
    const loc = history[nextIndex];
    set({ historyIndex: nextIndex, driveId: loc.driveId, folderId: loc.folderId, path: loc.path });
    return driveHref(loc.driveId, loc.folderId);
  },

  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().history.length - 1,

  jumpToBreadcrumb: (index) => {
    const { path, driveId } = get();
    if (!driveId || index < 0 || index >= path.length) return null;
    const nextPath = path.slice(0, index + 1);
    const segment = nextPath[nextPath.length - 1];
    const folderId = segment.id === "root" ? undefined : segment.id;
    return get().navigateTo({ driveId, folderId, path: nextPath });
  },

  rememberPath: (driveId, folderId, path) => {
    const key = locationKey(driveId, folderId);
    set((state) => {
      const pathCache = { ...state.pathCache, [key]: path };
      const next = { ...state, pathCache };
      writeJson(STORAGE_KEYS.pathCache, pathCache);
      return next;
    });
  },

  getCachedPath: (driveId, folderId) => {
    return get().pathCache[locationKey(driveId, folderId)] ?? null;
  },

  toggleFavorite: (fav) => {
    set((state) => {
      const exists = state.favorites.some(
        (f) => f.driveId === fav.driveId && f.folderId === fav.folderId,
      );
      const favorites = exists
        ? state.favorites.filter(
            (f) => !(f.driveId === fav.driveId && f.folderId === fav.folderId),
          )
        : [...state.favorites, fav];
      const next = { ...state, favorites };
      writeJson(STORAGE_KEYS.favorites, favorites);
      return next;
    });
  },

  isFavorite: (driveId, folderId) =>
    get().favorites.some((f) => f.driveId === driveId && f.folderId === folderId),

  addRecent: (loc) => {
    set((state) => {
      const label = loc.path.map((p) => p.name).join(" / ");
      const filtered = state.recent.filter(
        (r) => !(r.driveId === loc.driveId && r.folderId === loc.folderId),
      );
      const recent = [
        { ...loc, label, visitedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_LOCATIONS);
      writeJson(STORAGE_KEYS.recentLocations, recent);
      return { recent };
    });
  },

  toggleExpanded: (key) => {
    set((state) => {
      const expanded = { ...state.expanded, [key]: !state.expanded[key] };
      writeJson(STORAGE_KEYS.expandedFolders, expanded);
      return { expanded };
    });
  },

  setExpanded: (key, open) => {
    const current = !!get().expanded[key];
    if (current === open) return;
    set((state) => {
      const expanded = { ...state.expanded, [key]: open };
      writeJson(STORAGE_KEYS.expandedFolders, expanded);
      return { expanded };
    });
  },

  setTreeChildren: (key, children) => {
    set((state) => ({
      treeCache: {
        ...state.treeCache,
        [key]: { children, loadedAt: Date.now() },
      },
    }));
  },

  getTreeChildren: (key) => get().treeCache[key]?.children ?? null,

  setFolderFilter: (folderFilter) => set({ folderFilter }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => {
    writeJson(STORAGE_KEYS.sidebarCollapsed, sidebarCollapsed);
    set({ sidebarCollapsed });
  },

  getLastLocation: (driveId) => get().lastFolderByDrive[driveId] ?? null,
}));

// Hydrate persisted nav UI as soon as this module loads in the browser
// (before child page effects read path cache / favorites).
if (typeof window !== "undefined") {
  useNavigationStore.getState().hydrate();
}
