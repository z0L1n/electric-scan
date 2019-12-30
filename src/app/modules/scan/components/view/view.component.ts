import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { FadeInOut } from '@app/shared/animations';
import { ScannerService, Scan, ScanResult } from '@app/providers/scanner.service';
import { ClientService } from '@app/providers/client.service';


@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  animations: [FadeInOut]
})
export class ViewComponent implements OnInit {

  scanId: string;
  scan: Scan;
  private _scanSub: Subscription;

  @ViewChild(MatMenuTrigger, { static: false }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(public dialog: MatDialog,
              private _route: ActivatedRoute,
              private _scannerService: ScannerService,
              private _clientService: ClientService) { }

  ngOnInit() {
    this._route.params.subscribe((params) => {
      this.scanId = params['scan-id'];
      this.fetchScan();
      this._scanSub = this._scannerService.scans$.subscribe((scan) => {
        if (scan.id === this.scanId) {
          this.scan = scan;
        }
      });
    });
  }

  ngOnDestroy() {
    this._scanSub.unsubscribe();
  }
  
  onScroll() {
    console.log('scrolled!!');
  }

  isComplete(): boolean {
    return this.scan ? this.scan.duration !== -1 : false;
  }

  async fetchScan() {
    this.scan = await this._scannerService.GetScan(this.scanId);
  }

  results() {
    return this.scan ? this.scan.results.filter(r => r !== null) : [];
  }

  details(result: ScanResult) {
    this.contextMenu.closeMenu();
    this.dialog.open(DetailsDialogComponent, {
      data: { 
        scan: this.scan,
        result: result,
        parent: this,
      }
    });
  }

  saveAs(result: ScanResult) {
    console.log(`Save image ${this.scan.id}/${result.id}.png`)
    this._clientService.saveImageAs(this.scan.id, result.id);
  }

  openUrl(result: ScanResult) {
    const dialogRef = this.dialog.open(OpenUrlDialogComponent, {
      data: { 
        scan: this.scan,
        result: result,
      }
    });
    const dialogSub = dialogRef.afterClosed().subscribe(async (data) => {
      if (data) {
        this._clientService.openUrl(data.result.target);
      }
      dialogSub.unsubscribe();
    });
  }

  onContextMenu(event: MouseEvent, result: ScanResult) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { 'item': result };
    this.contextMenu.openMenu();
  }

}


@Component({
  selector: 'app-details-dialog',
  templateUrl: 'details-dialog.html',
})
export class DetailsDialogComponent implements OnInit {

  scan: Scan;
  result: ScanResult;
  parent: ViewComponent;

  constructor(public dialogRef: MatDialogRef<DetailsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.scan = this.data.scan;
    this.result = this.data.result;
    this.parent = this.data.parent;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  saveAs(result: ScanResult) {
    this.dialogRef.close();
    this.parent.saveAs(result);
  }

  openUrl(result: ScanResult) {
    this.dialogRef.close();
    this.parent.openUrl(result);
  }

}

@Component({
  selector: 'app-openurl-dialog',
  templateUrl: 'openurl-dialog.html',
})
export class OpenUrlDialogComponent implements OnInit {

  scan: Scan;
  result: ScanResult;

  constructor(public dialogRef: MatDialogRef<DetailsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.scan = this.data.scan;
    this.result = this.data.result;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}