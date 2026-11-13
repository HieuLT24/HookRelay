import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { EndpointsModule } from './modules/endpoints/endpoints.module';
import { EventsModule } from './modules/events/events.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { SigningModule } from './modules/signing/signing.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { DeliveryEngineModule } from './infrastructure/delivery-engine/delivery-engine.module';
import { SweeperModule } from './infrastructure/sweeper/sweeper.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ApiKeysModule,
    EndpointsModule,
    EventsModule,
    DeliveriesModule,
    SigningModule,
    QueueModule,
    DeliveryEngineModule,
    SweeperModule,
  ],
})
export class AppModule {}
