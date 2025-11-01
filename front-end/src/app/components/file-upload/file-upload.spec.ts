import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUpLoad } from './file-upload';

describe('FileUpload', () => {
  let component: FileUpLoad;
  let fixture: ComponentFixture<FileUpLoad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUpLoad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUpLoad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
