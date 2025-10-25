import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DummyUser } from '../../models';

// DummyUser interface defined in src/app/models/dummy-user.model.ts

@Component({
  selector: 'app-advanced-table',
  imports: [NzTableModule, TranslocoModule, LocalDatePipe],
  templateUrl: './advanced-table.component.html',
  styleUrl: './advanced-table.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedTableComponent implements OnInit {
  total = 0; // DummyJSON provides total; initialize to 0 and set after fetch
  loading = true;
  pageSize = 10;
  pageIndex = 1;
  private langSig!: () => string;
  private readonly STORAGE_KEY = 'advancedTableParams';
  constructor(
    private http: HttpClient,
    private t: TranslocoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Track language for UI-only recomputations (sorting labels), but do not refetch on language change
    this.langSig = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
    // Fetch only when params change; avoid coupling network requests to language changes
    const params$ = toObservable(this.params);
    const rawUsers = toSignal(
      params$.pipe(
        tap(() => (this.loading = true)),
        switchMap((p) =>
          this.getUsers(p.pageIndex, p.pageSize, p.sortField, p.sortOrder, p.filter).pipe(
            map((data) => {
              const raw = (data as any)?.users ?? data?.results ?? [];
              const transformed: DummyUser[] = raw.map((u: any) => {
                return {
                  name: `${u?.firstName ?? u?.name?.first ?? ''} ${
                    u?.lastName ?? u?.name?.last ?? ''
                  }`.trim(),
                  gender: u?.gender ?? '',
                  email: u?.email ?? '',
                  username: u?.username ?? u?.login?.username ?? '',
                  age: Number(u?.age ?? u?.dob?.age ?? 0),
                  city: u?.address?.city ?? u?.location?.city ?? '',
                  birthDate: u?.birthDate ?? u?.registered?.date ?? '',
                } as const as DummyUser;
              });
              // If DummyJSON shape present with total, reflect it
              const total = (data as any)?.total;
              if (typeof total === 'number' && Number.isFinite(total)) {
                this.total = total;
              } else {
                this.total = transformed.length;
              }
              return transformed;
            }),
            catchError(() => of([] as DummyUser[])),
            finalize(() => (this.loading = false)),
          ),
        ),
      ),
      { initialValue: [] as DummyUser[] },
    );

    // Derive UI sorting/filtering; recompute on lang changes without triggering network requests
    this.users = computed(() => {
      // depend on language changes for translated sort labels
      void this.langSig?.();
      const source = rawUsers();
      const p = this.params();
      // Apply filters
      let list = source;
      if (p.filter?.length) {
        list = p.filter.reduce((acc, f) => {
          const vals = f?.value ?? [];
          if (!vals.length) return acc;
          const key = f.key as keyof DummyUser;
          return acc.filter((u) => vals.includes(String((u as any)[key])));
        }, list);
      }
      // Apply sorting (gender uses translated labels)
      const { sortField, sortOrder } = p;
      if (sortField && sortOrder) {
        const dir = sortOrder === 'ascend' ? 1 : -1;
        const get = (u: DummyUser) =>
          (sortField === 'gender'
            ? this.t.translate('advancedTable.values.gender.' + String((u as any)['gender'] ?? ''))
            : (u as any)[sortField]) ?? '';
        list = [...list].sort((a, b) => {
          const av = get(a);
          const bv = get(b);
          if (av == null && bv == null) return 0;
          if (av == null) return -1 * dir;
          if (bv == null) return 1 * dir;
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          if (sortField === 'birthDate')
            return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
      }
      return list;
    });
  }

  // Simple map between UI sort keys and DummyJSON API sort keys
  private readonly sortFieldMap: Record<string, string> = {
    name: 'firstName',
    birthDate: 'birthDate',
    gender: 'gender',
    email: 'email',
    username: 'username',
    age: 'age',
    // city is nested (address.city) and not supported by server sort
  } as const;
  private mapSortField(sf: string | null): string | null {
    if (!sf) return null;
    return this.sortFieldMap[sf] ?? null;
  }
  private mapSortFieldBack(sb: string | null): string | null {
    if (!sb) return null;
    for (const ui in this.sortFieldMap) {
      if (this.sortFieldMap[ui] === sb) return ui;
    }
    return null;
  }

  // Removed country localization (region names) as country column was dropped
  readonly genderFilters = computed(() => {
    void this.langSig?.();
    return [
      { text: this.t.translate('advancedTable.values.gender.male'), value: 'male' },
      { text: this.t.translate('advancedTable.values.gender.female'), value: 'female' },
    ];
  });

  // Locale for DatePipe based on current language
  readonly dateLocale = computed(() => {
    const lang = this.langSig?.() || this.t.getActiveLang();
    return lang === 'cs' ? 'cs' : 'en-US';
  });

  // Removed country filters as country column was dropped

  // Trigger fetch by setting params; users signal re-computes automatically
  private readonly params = signal<{
    pageIndex: number;
    pageSize: number;
    sortField: string | null;
    sortOrder: string | null;
    filter: Array<{ key: string; value: string[] }>;
  }>({
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    sortField: null,
    sortOrder: null,
    filter: [],
  });

  readonly users!: Signal<DummyUser[]>;

  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filter: Array<{ key: string; value: string[] }>,
  ): void {
    const next = { pageIndex, pageSize, sortField, sortOrder, filter };
    const prev = this.params();
    if (this.areParamsEqual(prev, next)) {
      return; // avoid redundant updates that can cause request loops
    }
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.params.set(next);
    // Sync to URL (replace to avoid polluting history) and persist to localStorage
    const queryParams = this.buildQueryParams(next);
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // ignore storage errors
    }
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    const currentSort = sort.find((item) => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    this.loadDataFromServer(pageIndex, pageSize, sortField, sortOrder, filter);
  }

  ngOnInit(): void {
    // Seed from URL first; if empty, fallback to localStorage; else defaults
    const seeded = this.seedFromUrlOrStorage();
    this.loadDataFromServer(
      seeded.pageIndex,
      seeded.pageSize,
      seeded.sortField,
      seeded.sortOrder,
      seeded.filter,
    );
  }

  // Prevent infinite loops by only updating params when something actually changed
  private areParamsEqual(
    a: {
      pageIndex: number;
      pageSize: number;
      sortField: string | null;
      sortOrder: string | null;
      filter: Array<{ key: string; value: string[] }>;
    },
    b: {
      pageIndex: number;
      pageSize: number;
      sortField: string | null;
      sortOrder: string | null;
      filter: Array<{ key: string; value: string[] }>;
    },
  ): boolean {
    if (!a || !b) return false;
    if (a.pageIndex !== b.pageIndex) return false;
    if (a.pageSize !== b.pageSize) return false;
    if (a.sortField !== b.sortField) return false;
    if (a.sortOrder !== b.sortOrder) return false;
    return this.areFiltersEqual(a.filter, b.filter);
  }

  private areFiltersEqual(
    aa: Array<{ key: string; value: string[] }>,
    bb: Array<{ key: string; value: string[] }>,
  ): boolean {
    const norm = (x: Array<{ key: string; value: string[] }>) =>
      (x || [])
        .map((f) => ({ key: f.key, value: [...(f.value || [])].sort() }))
        .sort((a, b) => a.key.localeCompare(b.key));
    return JSON.stringify(norm(aa)) === JSON.stringify(norm(bb));
  }

  private buildQueryParams(p: {
    pageIndex: number;
    pageSize: number;
    sortField: string | null;
    sortOrder: string | null;
    filter: Array<{ key: string; value: string[] }>;
  }): Record<string, any> {
    // Use DummyJSON keywords in URL: limit, skip, sortBy, order, key, value
    const qp: any = {
      limit: p.pageSize,
      skip: Math.max(0, (p.pageIndex - 1) * p.pageSize),
    };
    // Map sort to server keywords when possible
    if (p.sortField && p.sortOrder) {
      const sb = this.mapSortField(p.sortField);
      if (sb) {
        qp.sortBy = sb;
        qp.order = p.sortOrder === 'ascend' ? 'asc' : 'desc';
      }
    }
    // Put first filter into key/value for round-trip; values can be array in URL for multiple selections
    const first = (p.filter || []).find((f) => (f?.value?.length ?? 0) > 0);
    if (first?.key && first.value?.length) {
      qp.key = first.key;
      qp.value = first.value.length === 1 ? first.value[0] : first.value;
    }
    return qp;
  }

  private seedFromUrlOrStorage(): {
    pageIndex: number;
    pageSize: number;
    sortField: string | null;
    sortOrder: string | null;
    filter: Array<{ key: string; value: string[] }>;
  } {
    const qpm = this.route.snapshot.queryParamMap;
    const parseIntSafe = (v: string | null | undefined, fallback: number) => {
      const n = Number.parseInt(String(v ?? ''), 10);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    // Read DummyJSON keywords: limit, skip, sortBy, order, key, value
    const limit = parseIntSafe(qpm.get('limit'), this.pageSize);
    const skip = parseIntSafe(qpm.get('skip'), 0);
    let pageSize = limit;
    let pageIndex = Math.max(1, Math.floor(skip / Math.max(1, pageSize)) + 1);
    const sortBy = (qpm.get('sortBy') as string | null) || null;
    const sortField = this.mapSortFieldBack(sortBy);
    const orderRaw = (qpm.get('order') as string | null) || null;
    const sortOrder = orderRaw === 'asc' ? 'ascend' : orderRaw === 'desc' ? 'descend' : null;
    const key = qpm.get('key');
    const values = qpm.getAll('value');
    const filter: Array<{ key: string; value: string[] }> = [];
    if (key && values && values.length) {
      filter.push({ key, value: values });
    }
    // If URL has nothing, try localStorage fallback
    const hasUrlState = !!(
      qpm.get('limit') ||
      qpm.get('skip') ||
      qpm.get('sortBy') ||
      qpm.get('order') ||
      qpm.get('key') ||
      qpm.get('value')
    );
    if (!hasUrlState) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(this.STORAGE_KEY);
          if (raw) {
            const s = JSON.parse(raw);
            pageIndex = parseIntSafe(s?.pageIndex, pageIndex);
            pageSize = parseIntSafe(s?.pageSize, pageSize);
            const so = s?.sortOrder;
            return {
              pageIndex,
              pageSize,
              sortField: s?.sortField ?? null,
              sortOrder: so === 'ascend' || so === 'descend' ? so : null,
              filter: Array.isArray(s?.filter) ? s.filter : [],
            };
          }
        }
      } catch {
        // ignore storage issues
      }
    }
    return { pageIndex, pageSize, sortField, sortOrder, filter };
  }

  getUsers(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filters: Array<{ key: string; value: string[] }>,
  ): Observable<any> {
    // Translate page/pageSize to DummyJSON pagination
    const limit = pageSize;
    const skip = Math.max(0, (pageIndex - 1) * pageSize);
    // Request only needed fields to reduce payload
    const select = [
      'firstName',
      'lastName',
      'gender',
      'email',
      'username',
      'age',
      'birthDate',
      'address',
    ].join(',');
    let params = new HttpParams()
      .set('limit', String(limit))
      .set('skip', String(skip))
      .set('select', select);
    if (sortField && sortOrder) {
      const sb = this.mapSortField(sortField);
      if (sb) {
        params = params.set('sortBy', sb).set('order', sortOrder === 'ascend' ? 'asc' : 'desc');
      }
    }
    // Use server filter for single gender value; else fetch all and filter client-side
    const gf = (filters || []).find((f) => f?.key === 'gender' && (f?.value?.length ?? 0) > 0);
    const endpoint =
      gf && gf.value.length === 1
        ? 'https://dummyjson.com/users/filter'
        : 'https://dummyjson.com/users';
    if (endpoint.endsWith('/filter') && gf) {
      params = params.set('key', 'gender').set('value', gf.value[0]);
    }
    return this.http
      .get<any>(endpoint, { params })
      .pipe(catchError(() => of({ users: [] as any[], total: 0 })));
  }
}
