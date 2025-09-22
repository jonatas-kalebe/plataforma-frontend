import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeParticleBackgroundComponent } from './three-particle-background.component';

describe('ThreeParticleBackgroundComponent', () => {
  let component: ThreeParticleBackgroundComponent;
  let fixture: ComponentFixture<ThreeParticleBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeParticleBackgroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreeParticleBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
