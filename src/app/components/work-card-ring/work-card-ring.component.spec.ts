import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkCardRingComponent } from './work-card-ring.component';

describe('WorkCardRingComponent', () => {
  let component: WorkCardRingComponent;
  let fixture: ComponentFixture<WorkCardRingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkCardRingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkCardRingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
