import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { ActivatedRoute, Router } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NzButtonModule, NzCheckboxModule, NzFormModule, NzInputModule, NzIconModule, TranslocoPipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private t = inject(TranslocoService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  validateForm = this.fb.group({
    username: this.fb.control('', [Validators.required]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
    remember: this.fb.control(false)
  });

  // controls visibility of the password input
  passwordVisible = signal(false);

  // convenience handles to controls
  private readonly usernameControl = this.validateForm.get('username')!;
  private readonly passwordControl = this.validateForm.get('password')!;

  // signals mirroring form control values
  readonly usernameValue = toSignal(this.usernameControl.valueChanges, {
    initialValue: this.usernameControl.value
  });
  readonly passwordValue = toSignal(this.passwordControl.valueChanges, {
    initialValue: this.passwordControl.value
  });
  // track active language to recompute translated error messages on language change
  readonly activeLang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  // derived error messages as signals
  readonly usernameError = computed(() => {
    // track on value to recompute
    void this.usernameValue();
    // track on language to recompute translations when language changes
    void this.activeLang();
    const errors = this.usernameControl.errors;
    if (errors?.['required']) return this.t.translate('login.errors.usernameRequired');
    return '';
  });

  readonly passwordError = computed(() => {
    void this.passwordValue();
    void this.activeLang();
    const errors = this.passwordControl.errors;
    if (errors?.['required']) return this.t.translate('login.errors.passwordRequired');
    if (errors?.['minlength']) return this.t.translate('login.errors.passwordMinLength');
    if (errors?.['usernamePasswordSame']) return this.t.translate('login.errors.usernamePasswordSame');
    return '';
  });

  readonly canSubmit = computed(() => {
    // track on values to recompute when form changes
    void this.usernameValue();
    void this.passwordValue();
    return this.validateForm.valid;
  });

  submitForm(): void {
    if (this.validateForm.valid) {
      const { username, password, remember } = this.validateForm.getRawValue();
      const ok = this.auth.login(username!, password!, !!remember);
      if (ok) {
        const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') || '/welcome';
        this.router.navigateByUrl(redirectUrl);
      }
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
