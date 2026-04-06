import { PackService } from '_root/modules/packs/pack.service';
import { PackController } from '_root/modules/packs/pack.controller';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '_root/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PackController],
  providers: [PackService],
  exports: [PackService],
})
export class PackModule {}
