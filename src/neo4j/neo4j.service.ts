import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { strict } from 'assert';
import { Driver, Result, session, Session } from 'neo4j-driver';
import { createRelationObject } from 'src/dto/create-relation.dto';
import { Neo4jConfig } from 'src/neo4j-config.interface';
import { NEO4J_CONFIG, NEO4J_DRIVER } from './neo4j.constants';

@Injectable()
export class Neo4jService {
    constructor(
        @Inject(NEO4J_CONFIG) private readonly config: Neo4jConfig,
        @Inject(NEO4J_DRIVER) private readonly driver: Driver
    ) {}

    getConfig(): Neo4jConfig {
        return this.config;
    }

    getDriver(): Driver {
        return this.driver;
    }

    getReadSession(database?: string): Session {
        return this.driver.session({
            database: database || this.config.database,
            defaultAccessMode: session.READ,
        })
    }
    getWriteSession(database?: string): Session  {
        return this.driver.session({
            database: database || this.config.database,
            defaultAccessMode: session.WRITE,
        })
    }

    read(cypher: string, params?: Record<string, any>, database?: string): Result {
        const session = this.getReadSession(database);
        return session.run(cypher, params)
    }

    write(cypher: string, params?: Record<string, any>, database?: string): Result {
        const session = this.getWriteSession(database);
        return session.run(cypher, params)
    }

    async getRelation(name: string): Promise<object>{
        try{
            const data = await this.read(`MATCH (per: User)-[rel]-(node) WHERE per.name= $name 
            RETURN per,rel,node`, {name});
            
            if (data.records.length<1){
                throw new NotFoundException('Data node not found')
            }
            
            let relationTypes = [];
            const relationsArray = []

            const unique = (value, index, self) => {
                return self.indexOf(value) === index
            }

            data.records.forEach( record => relationTypes.push(record.get('rel').type) )
            relationTypes = relationTypes.filter(unique);

            relationTypes.forEach( type => {
                let relationsForType = []
                data.records.forEach( rec => {
                    if ( type===rec.get('rel').type ) {
                        relationsForType.push({
                            labels: rec.get('node').labels,
                            properties: rec.get('node').properties
                        })
                    }
                })
                relationsArray.push( { [type]:relationsForType } )
            })

            return {
                properties: data.records[0].get('per').properties,
                relationships: relationsArray
            };
        } catch (err) {
            return err
        }
    }

    async createRelations(input: createRelationObject): Promise<object>{
        try{
            function convertProperties(nodeName: string, property: Object): string{
                let entries = Object.entries(property);
                let convertedString ='';
                entries.forEach( entry => {
                    convertedString += `${nodeName}.${entry[0]} = "${entry[1]}"`
                })

                return convertedString;
            }

            const filter1 = convertProperties('n1',input.property1);
            const filter2 = convertProperties('n2',input.property2);
            console.log(`match (n1:${input.label1}) where ${filter1}
            match (n2:${input.label2})  where ${filter2}
            merge (n1)-[:${input.relation} ${input.relationProperty}]->(n2)`,input.relationProperty);
            
            if(input.relationProperty){
                return this.write(`match (n1:${input.label1}) where ${filter1}
                match (n2:${input.label2})  where ${filter2}
                merge (n1)-[:${input.relation} {properties: ${input.relationProperty}}]->(n2)`, {properties: input.relationProperty});
            } else{
                // match checks the exiting node and then merge updates the same node instead of creating a duplicate node
                return this.write(`match (n1:${input.label1}) where ${filter1}
                match (n2:${input.label2})  where ${filter2}
                merge (n1)-[:${input.relation}]->(n2)`);
            }
        } catch (err) {
            return { error: err.message}
        }
    }
}
