import { Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-welcome',
  imports: [TranslocoPipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.less'
})
export class Welcome {}
