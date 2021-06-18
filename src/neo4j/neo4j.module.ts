import { DynamicModule, Module } from '@nestjs/common';
import { Neo4jConfig } from 'src/neo4j-config.interface';
import { NEO4J_CONFIG } from './neo4j.constants';
import { Neo4jService } from './neo4j.service';
import { createDriver } from './neo4j.utils';
import { Neo4jController } from './neo4j.controller';

const NEO4J_DRIVER = 'NEO4J_DRIVER'

@Module({
  controllers: [Neo4jController]
})
export class Neo4jModule {
  static forRoot(config: Neo4jConfig): DynamicModule {
    return {
        module: Neo4jModule,
        providers: [
          {
            provide: NEO4J_CONFIG,
            useValue: config
          },
          {
            provide: NEO4J_DRIVER,
            inject: [NEO4J_CONFIG],
            useFactory: async (config: Neo4jConfig) => createDriver(config)
          },
          Neo4jService,
        ],
        controllers: [Neo4jController],
        exports: [
          Neo4jService
        ]
    }
}
}
