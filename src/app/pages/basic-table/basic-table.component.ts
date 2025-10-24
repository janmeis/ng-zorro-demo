import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { TranslocoModule } from '@ngneat/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BasicTableRow } from '../../models';
import { createPaginatedDataStore } from '../../services/paginated-data.service';

@Component({
  selector: 'app-basic-table',
  imports: [NzTableModule, TranslocoModule],
  templateUrl: './basic-table.component.html',
  styleUrl: './basic-table.component.less'
})
export class BasicTableComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Reusable paginated store configured for DummyJSON users
  private readonly store = createPaginatedDataStore<BasicTableRow>({
    route: this.route,
  router: this.router,
  location: this.location,
    urlSync: true,
    persistKey: 'basic-table',
    pageSizes: [5, 10, 20],
    fetchPage: ({ skip, limit, sortKey, sortOrder }) =>
      this.http
        .get<{ users: any[]; total: number; skip: number; limit: number }>(
          'https://dummyjson.com/users',
          { params: { limit: String(limit), skip: String(skip) } }
        )
        .pipe(
          map((res) => {
            const items = res.users.map((u: any): BasicTableRow => ({
              id: Number(u.id) || 0,
              image: u.image ?? '',
              name: `${u.firstName} ${u.lastName}`,
              age: u.age,
              gender: u.gender === 'female' ? 'female' : 'male',
              email: u.email,
              phone: u.phone,
              city: u.address?.city ?? '',
              country: u.address?.country ?? '',
              company: u.company?.name ?? '',
            }));
            if (sortKey && sortOrder) {
              const dir = sortOrder === 'ascend' ? 1 : -1;
              items.sort((a: BasicTableRow, b: BasicTableRow) => {
                const av = (a as any)[sortKey];
                const bv = (b as any)[sortKey];
                if (av == null && bv == null) return 0;
                if (av == null) return -1 * dir;
                if (bv == null) return 1 * dir;
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
                return String(av).localeCompare(String(bv)) * dir;
              });
            }
            return { items, total: res.total };
          })
        ),
  });

  // Expose signals/handlers for the template
  readonly loading = this.store.loading;
  readonly total = this.store.total;
  readonly listOfData = this.store.listOfData;
  readonly pageIndex = this.store.pageIndex;
  readonly pageSize = this.store.pageSize;
  readonly onPageIndexChange = this.store.onPageIndexChange;
  readonly onPageSizeChange = this.store.onPageSizeChange;
  readonly sortKey = this.store.sortKey;
  readonly sortOrder = this.store.sortOrder;
  readonly onSortChange = this.store.onSortChange;
  readonly setPagination = this.store.setPagination;

  // Optional: Single handler for server-side style pagination/sorting events
  onQueryParamsChange(params: NzTableQueryParams) {
    const { pageIndex, pageSize, sort } = params;
    if (pageIndex != null || pageSize != null) this.setPagination(pageIndex!, pageSize!);
    const active = sort?.find(s => s.value === 'ascend' || s.value === 'descend');
    if (active) this.onSortChange(active.key, active.value as 'ascend' | 'descend');
  }
}
