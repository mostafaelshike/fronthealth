import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly inFlightGets = new Map<string, Observable<unknown>>();
  private requestGeneration = 0;

  constructor(private http: HttpClient) {}

  /**
   * Generic GET Request
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    const url = `${this.baseUrl}/${endpoint}`;
    const key = `${this.requestGeneration}:${url}?${httpParams.toString()}`;
    const existing = this.inFlightGets.get(key);
    if (existing) {
      return existing as Observable<T>;
    }

    const request = this.http.get<T>(url, { params: httpParams }).pipe(
      finalize(() => this.inFlightGets.delete(key)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.inFlightGets.set(key, request);
    return request;
  }

  
  post<T>(endpoint: string, body: any): Observable<T> {
    this.requestGeneration++;
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  /**
   * Generic PUT Request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    this.requestGeneration++;
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  /**
   * Generic DELETE Request
   */
  delete<T>(endpoint: string, params?: any): Observable<T> {
    this.requestGeneration++;
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params: httpParams });
  }

  /**
   * Upload FormData with Cloudinary support
   */
  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    this.requestGeneration++;
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, formData);
  }
}
