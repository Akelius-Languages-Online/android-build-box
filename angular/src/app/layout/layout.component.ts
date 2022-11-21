import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  public year: string = '';
  private readonly _defaultYear = 2022;

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    this.year = `${this._defaultYear}`;
    if (currentYear > this._defaultYear) {
      this.year += ` — ${currentYear}`;
    }
  }
}
