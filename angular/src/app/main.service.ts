import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MainService {

  constructor(private http: HttpClient) {
  }

  getDownloadFile(): Observable<any | null> {
    return this.http.get<{ hasFile: boolean, fileName: string }>('/api/has-file')
      .pipe(
        map(res => res.hasFile ? res : null),
        catchError(() => of(null)),
      )
  }

  createNewBuild(): Observable<any> {
    return this.http.post('/api/assemble', {});
  }

  checkIsAssembleStarted(): Observable<boolean> {
    return this.http.get<{inProgress: boolean}>('/api/assemble/status')
      .pipe(
        map(res => res.inProgress),
        catchError(() => of(false)),
      )
  }
}
