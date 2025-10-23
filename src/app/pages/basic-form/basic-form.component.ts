import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormLayoutType, NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-basic-form',
  imports: [ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule, NzRadioModule, NzSelectModule, NzCheckboxModule, NzDatePickerModule, TranslocoPipe],
  templateUrl: './basic-form.component.html',
  styleUrls: ['./basic-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicFormComponent {
  private fb = inject(NonNullableFormBuilder);
  validateForm = this.fb.group({
    formLayout: this.fb.control<NzFormLayoutType>('horizontal'),
    fieldA: this.fb.control('', [Validators.required]),
    filedB: this.fb.control('', [Validators.required]),
    country: this.fb.control('', [Validators.required]),
    tags: this.fb.control<string[]>([]),
    subscribe: this.fb.control(false),
    agree: this.fb.control(false, { validators: Validators.requiredTrue }),
    date: new FormControl<Date | null>(null, { validators: Validators.required })
  });

  // options sourced from code (signals)
  // country display names are localized in i18n resources (form.countries.*)
  readonly countries = signal([
    { value: 'us' },
    { value: 'uk' },
    { value: 'cn' },
    { value: 'de' }
  ]);

  readonly tagsOptions = signal([
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
    { value: 'gamma', label: 'Gamma' }
  ]);

  submitForm(): void {
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  get isHorizontal(): boolean {
    return this.validateForm.controls.formLayout.value === 'horizontal';
  }
}
