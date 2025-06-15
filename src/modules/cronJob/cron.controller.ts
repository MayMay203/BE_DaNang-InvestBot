import { Controller, Get } from '@nestjs/common';

@Controller('cron')
export class CronController {
    @Get('ping')
    ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}