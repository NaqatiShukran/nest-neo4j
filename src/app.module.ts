import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from './neo4j/neo4j.module';

@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: 'bolt',
      host: '18.214.25.229',
      port: 7687,
      username: 'neo4j',
      password: 'mixture-adjustment-adverb'
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
