import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AthenaChatWidgetComponent } from './athena-chat-widget.component';

describe('AthenaChatWidgetComponent', () => {
  let component: AthenaChatWidgetComponent;
  let fixture: ComponentFixture<AthenaChatWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AthenaChatWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AthenaChatWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
