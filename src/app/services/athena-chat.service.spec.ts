import { TestBed } from '@angular/core/testing';

import { AthenaChatService } from './athena-chat.service';

describe('AthenaChatService', () => {
  let service: AthenaChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AthenaChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
