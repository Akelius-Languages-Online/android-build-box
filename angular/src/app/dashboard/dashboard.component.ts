import { Component, OnDestroy, OnInit } from '@angular/core';
import { MainService } from '../main.service';
import { Subject, take, takeUntil } from 'rxjs';
import { Router } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  downloadFile: string | null = null;
  statsFile: any | null = null;
  wait = false;

  private _evtSource: EventSource | undefined;
  private _recording = false;
  private _destroy$ = new Subject();
  private _output: string | undefined;

  constructor(private mainService: MainService, private router: Router) {
  }

  set output(str: string | undefined) {
    this._output += str || '';
    this._scrollTo();
  }

  get output(): string | undefined {
    return this._output;
  }

  ngOnInit() {
    this._startListen();
    this._checkIsInProgress();
    this._checkCanDownload();
  }

  ngOnDestroy() {
    this._evtSource?.close();
    this._destroy$.next(null);
    this._destroy$.unsubscribe();
  }

  createNewBuild(out: string) {
    this._recording = true;
    this._output = '';
    this.output = out;
    this.wait = true;
    this.downloadFile = null;
    this.mainService.createNewBuild().pipe(
      take(1),
      takeUntil(this._destroy$),
    ).subscribe({
      complete: () => {
        this.wait = false;
        this.output = `Finished!\n`;
        this._recording = false;
        this._checkCanDownload();
        this._scrollTo(true);
      }
    });
  }

  private _startListen() {
    this._evtSource = new EventSource('/api/status');
    this._evtSource.addEventListener('message', (e: MessageEvent) => {
      if (this._recording) {
        this.output = `${e.data}\n`;
      }
    });
    this._evtSource.addEventListener('error', () => {
      this.router.navigateByUrl('/server-error').then();
    });
  }

  private _checkCanDownload() {
    this.mainService.getDownloadFile().pipe(
        take(1),
        takeUntil(this._destroy$),
    ).subscribe(res => {
      this.downloadFile = res.fileName;
      this.statsFile = res.stats;
    });
  }

  private _checkIsInProgress() {
    this.mainService.checkIsAssembleStarted().pipe(
      take(1),
      takeUntil(this._destroy$),
    ).subscribe(res => {
      if (res) {
        this.createNewBuild('Previous build in progress...\n');
      }
    });
  }

  private _scrollTo(toTop = false) {
    setTimeout(() => {
      const el = document.getElementById('main-wrapper') as HTMLDivElement;
      if (el) {
        el.scrollTo({top: toTop ? 0 : el.scrollHeight, behavior: 'smooth'});
      }
    });
  }
}
