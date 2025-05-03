import { Controller } from '@nestjs/common';
import { MaterialService } from './material.service';

@Controller()
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}
}
