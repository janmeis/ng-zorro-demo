import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { computed, effect, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap, tap, catchError, skip } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export type FetchPageResult<T> = { items: T[]; total: number };

export interface PaginatedDataOptions<T> {
  fetchPage: (params: { skip: number; limit: number; sortKey?: string; sortOrder?: 'ascend' | 'descend' | null }) => Observable<FetchPageResult<T>>;
  pageSizes?: readonly number[];
  initial?: { pageIndex?: number; pageSize?: number };
  urlSync?: boolean;
  route?: ActivatedRoute;
  router?: Router;
  location?: Location;
  /** Persist page and size under this key using localStorage (browser-only). */
  persistKey?: string;
}

export function createPaginatedDataStore<T>(opts: PaginatedDataOptions<T>) {
  const PAGE_SIZES = (opts.pageSizes ?? [5, 10, 20]) as readonly number[];
  const urlSync = !!opts.urlSync && !!opts.route && !!opts.router;
  const persistKey = opts.persistKey?.trim();

  const readPageFromUrl = () => {
    if (!urlSync || !opts.route) return undefined;
    const qp = opts.route.snapshot.queryParamMap;
    const page = Number(qp.get('page'));
    const size = Number(qp.get('size'));
    return {
      pageIndex: Number.isFinite(page) && page > 0 ? page : undefined,
      pageSize: PAGE_SIZES.includes(size) ? size : undefined,
    } as { pageIndex?: number; pageSize?: number };
  };

  const initialFromUrl = readPageFromUrl();

  const readPersisted = (): { pageIndex?: number; pageSize?: number } | undefined => {
    if (!persistKey) return undefined;
    const store = getLocalStorage();
    if (!store) return undefined;
    try {
      const raw = store.getItem(`pager:${persistKey}`);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { page?: number; size?: number };
      const page = Number(parsed.page);
      const size = Number(parsed.size);
      return {
        pageIndex: Number.isFinite(page) && page > 0 ? page : undefined,
        pageSize: PAGE_SIZES.includes(size) ? size : undefined,
      };
    } catch {
      return undefined;
    }
  };

  const persisted = readPersisted();
  const pagination = signal<{ pageIndex: number; pageSize: number }>({
    pageIndex: initialFromUrl?.pageIndex ?? persisted?.pageIndex ?? opts.initial?.pageIndex ?? 1,
    pageSize: initialFromUrl?.pageSize ?? persisted?.pageSize ?? opts.initial?.pageSize ?? (PAGE_SIZES[1] ?? 10),
  });

  const loading = signal(true);
  const total = signal(0);
  const sort = signal<{ key?: string; order: 'ascend' | 'descend' | null }>({ key: undefined, order: null });

  const params = computed(() => ({
    page: pagination().pageIndex,
    size: pagination().pageSize,
    skip: (pagination().pageIndex - 1) * pagination().pageSize,
    limit: pagination().pageSize,
    sortKey: sort().key,
    sortOrder: sort().order,
  }));

  const list = toSignal(
    toObservable(params).pipe(
      tap(() => loading.set(true)),
      switchMap(({ skip, limit, sortKey, sortOrder }) =>
        opts.fetchPage({ skip, limit, sortKey, sortOrder }).pipe(
          tap((res) => total.set(res.total)),
          map((res) => res.items),
          catchError(() => of([] as T[])),
          finalize(() => loading.set(false))
        )
      )
    ),
    { initialValue: [] as T[] }
  );

  // Persist page and size when they change (browser-only)
  if (persistKey) {
    effect(() => {
      const p = pagination();
      const isBrowser = typeof window !== 'undefined' && !!window.localStorage;
      if (!isBrowser) return;
      try {
        window.localStorage.setItem(`pager:${persistKey}`,(JSON.stringify({ page: p.pageIndex, size: p.pageSize })));
      } catch {}
    });
  }

  // URL -> state
  if (urlSync) {
    type RouteParams = { page: number; size: number; sort?: string; order: 'ascend' | 'descend' | null };
    const routeParams = toSignal<RouteParams | null>(
      opts.route!.queryParamMap.pipe(
        // Ignore the initial emission; we already initialized state from the URL snapshot.
        skip(1),
        map((qp) => ({
          page: Number(qp.get('page')) || 1,
          size: (() => {
            const s = Number(qp.get('size'));
            return PAGE_SIZES.includes(s) ? s : (PAGE_SIZES[1] ?? 10);
          })(),
          sort: qp.get('sort') || undefined,
          order: (() => {
            const o = qp.get('order');
            return o === 'ascend' || o === 'descend' ? (o as 'ascend' | 'descend') : null;
          })(),
        }))
      ),
      { initialValue: null }
    );

    effect(() => {
      const rp = routeParams();
      const p = pagination();
      const s = sort();
      if (!rp) return; // no URL-driven update yet
      if (rp.page !== p.pageIndex || rp.size !== p.pageSize) {
        pagination.set({ pageIndex: rp.page, pageSize: rp.size });
      }
      if (rp.sort !== s.key || rp.order !== s.order) {
        sort.set({ key: rp.sort, order: rp.order });
      }
    });

    // state -> URL
    effect(() => {
      // Only update the URL on the client
      const isBrowser = typeof window !== 'undefined' && !!window.history;
      if (!isBrowser || !opts.router || !opts.route || !opts.location) {
        // still read signals to establish dependencies
        void pagination();
        void sort();
        return;
      }
      const p = pagination();
      const s = sort();
      const tree = opts.router.createUrlTree([], {
        relativeTo: opts.route,
        queryParams: { page: p.pageIndex, size: p.pageSize, sort: s.key ?? null, order: s.order ?? null },
        queryParamsHandling: 'merge',
      });
      const url = opts.router.serializeUrl(tree);
      // replaceState expects a path starting with '/'
      opts.location.replaceState(url);
    });
  }

  // Clamp page when total/pageSize changes, but avoid clamping while loading to prevent
  // reverting to page 1 before the real total is known (which would cancel in-flight requests).
  effect(() => {
    const p = pagination();
    const t = total();
    if (loading()) return;
    if (t <= 0) {
      if (p.pageIndex !== 1) pagination.set({ ...p, pageIndex: 1 });
      return;
    }
    const max = Math.max(1, Math.ceil(t / p.pageSize));
    if (p.pageIndex > max) {
      pagination.set({ ...p, pageIndex: max });
    }
  });

  const onPageIndexChange = (page: number) => {
    const p = pagination();
    if (page !== p.pageIndex) pagination.set({ ...p, pageIndex: page });
  };
  const onPageSizeChange = (size: number) => {
    const p = pagination();
    if (size !== p.pageSize) pagination.set({ pageIndex: 1, pageSize: size });
  };
  const setPagination = (page: number, size: number) => {
    const p = pagination();
    const nextPage = page ?? p.pageIndex;
    const nextSize = size ?? p.pageSize;
    if (nextPage !== p.pageIndex || nextSize !== p.pageSize) {
      // If size changes, reset page to 1 unless the caller explicitly set page
      const normalized = nextSize !== p.pageSize && page == null ? 1 : nextPage;
      pagination.set({ pageIndex: normalized, pageSize: nextSize });
    }
  };
  const onSortChange = (key: string | undefined, order: 'ascend' | 'descend' | null) => {
    const current = sort();
    if (current.key !== key || current.order !== order) sort.set({ key, order });
  };

  return {
    loading,
    total,
    list,
    listOfData: list, // alias for table template compatibility
    pageIndex: computed(() => pagination().pageIndex),
    pageSize: computed(() => pagination().pageSize),
    sortKey: computed(() => sort().key),
    sortOrder: computed(() => sort().order),
    onPageIndexChange,
    onPageSizeChange,
    onSortChange,
    setPagination,
  } as const;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) return window.localStorage;
  } catch {}
  return null;
}
